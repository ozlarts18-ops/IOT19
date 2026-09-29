#!/usr/bin/env python3
"""
================================================================================
Greenhouse Controller & Cloud Gateway (Raspberry Pi 3/4, RPi.GPIO)
================================================================================
Modules (each runs in its own concurrent thread):
  1. Grow Light : BH1750 lux sensor + relay (hysteresis) [BCM 17]
  2. Water Tank : HC-SR04 ultrasonic + 16x2 I2C LCD + motor relay [BCM 23/24, 27]
  3. Soil / Pump: ADS1115 soil sensor + pump relay [ADS1115 A0, BCM 22]
  4. Climate    : DHT22 + fan relay (hysteresis) [BCM 26, BCM 21]
  5. Cloud Sync : Continuous telemetry pusher to the IOT19 Cloud Gateway API
  6. Local API  : Flask HTTP endpoint on port 5000 (or PORT env var)

HOW TO CONNECT TO YOUR CLOUD SERVER OVER THE INTERNET:
  Run with your server's public IP, domain, or local IP:
    python3 rpi_greenhouse_gateway.py --gateway http://<YOUR_SERVER_IP>:5000/api/sensors/gateway
  Or set environment variables:
    export IOT19_GATEWAY_URL="http://<YOUR_SERVER_IP>:5000/api/sensors/gateway"
    python3 rpi_greenhouse_gateway.py
================================================================================
"""

import os
import sys
import copy
import signal
import threading
import time
import argparse
from datetime import datetime
import requests

# Try importing hardware libraries; provide helpful error message if not on Pi
try:
    import board
    import busio
    import RPi.GPIO as GPIO
    import adafruit_bh1750
    import adafruit_dht
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn
    from RPLCD.i2c import CharLCD
    ON_RASPBERRY_PI = True
except ImportError as e:
    print(f"[WARN] Hardware library missing ({e}). If testing on PC, simulated mode will be used.")
    ON_RASPBERRY_PI = False

try:
    from flask import Flask, jsonify
    from flask_cors import CORS
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    Flask = None
    jsonify = None
    CORS = None


# ==============================================================================
# CONFIGURATION (BCM pin numbers)
# Note: Physical Pin 37 = BCM 26, Physical Pin 40 = BCM 21
# ==============================================================================
# --- Cloud Gateway ---
DEFAULT_GATEWAY_URL = os.environ.get("IOT19_GATEWAY_URL", "http://localhost:5000/api/sensors/gateway")
GATEWAY_SYNC_INTERVAL = float(os.environ.get("IOT19_SYNC_INTERVAL", "3.0"))  # Push every 3 seconds

# --- Module 1: Grow Light ---
LIGHT_RELAY = 17            # BCM 17: low-level trigger relay
LIGHT_ON_BELOW = 400        # Turn light ON when lux < 400
LIGHT_OFF_ABOVE = 600       # Turn light OFF when lux > 600
LIGHT_INTERVAL = 2          # Check interval in seconds
LIGHT_ACTIVE_LOW = True     # True: pin LOW = relay energized (ON)
LIGHT_OFF_MODE = "drive"    # "drive" = actively drive HIGH; "release" = float pin
MAX_SENSOR_FAILURES = 3

# --- Module 2: Water Tank ---
TANK_TRIG = 23              # BCM 23 (HC-SR04 Trigger)
TANK_ECHO = 24              # BCM 24 (HC-SR04 Echo)
TANK_RELAY = 27             # BCM 27 (Water Refill Motor Relay) - active LOW
TANK_FULL_CM = 5            # Distance <= 5cm indicates tank is full -> stop motor
TANK_INTERVAL = 1           # Ultrasonic check interval
LCD_ADDRESS = 0x27          # Standard I2C address for PCF8574 LCD (or 0x3F)

# --- Module 3: Soil Moisture & Pump ---
PUMP_RELAY = 22             # BCM 22 (Watering Pump Relay) - active LOW
DRY_THRESHOLD = 8000        # ADS1115 raw ADC reading above this indicates DRY soil
PUMP_TIME = 5               # Seconds to run irrigation pump
SOIL_INTERVAL = 30          # Seconds between soil moisture samples
SOAK_TIME = 300             # Seconds to wait after watering before re-checking soil

# --- Module 4: Climate (Temperature & Humidity) ---
# Physical pin 37 is BCM 26 (board.D26)
# Physical pin 40 is BCM 21
DHT_BCM_PIN = 26
FAN_RELAY = 21              # BCM 21 (Ventilation Fan Relay) - active LOW
FAN_ON_TEMP = 30.0          # Turn fan ON at >= 30.0 °C
FAN_OFF_TEMP = 28.0         # Turn fan OFF at <= 28.0 °C
CLIMATE_INTERVAL = 2.5      # Sampling interval for DHT22

# ==============================================================================
# CLI ARGUMENTS
# ==============================================================================
parser = argparse.ArgumentParser(description="Greenhouse Controller & Gateway")
parser.add_argument("--gateway", type=str, default=DEFAULT_GATEWAY_URL,
                    help=f"Target cloud backend gateway URL (default: {DEFAULT_GATEWAY_URL})")
parser.add_argument("--sync-interval", type=float, default=GATEWAY_SYNC_INTERVAL,
                    help="Seconds between cloud gateway syncs (default: 3.0)")
parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 5000)),
                    help="Local Flask API port (default: 5000)")
cli_args, _ = parser.parse_known_args()
GATEWAY_URL = cli_args.gateway
SYNC_INTERVAL = cli_args.sync_interval
LOCAL_PORT = cli_args.port

# ==============================================================================
# SHARED STATE
# ==============================================================================
stop_event = threading.Event()
state_lock = threading.Lock()

state = {
    "light": {
        "lux": 0.0,
        "light_status": "OFF",
        "natural_light": "Sufficient",
        "threshold_on_below": LIGHT_ON_BELOW,
        "threshold_off_above": LIGHT_OFF_ABOVE,
        "relay_gpio": LIGHT_RELAY,
        "sensor_ok": False,
        "timestamp": None,
    },
    "tank": {
        "distance_cm": None,
        "motor": "OFF",
        "sensor_ok": False,
        "timestamp": None,
    },
    "soil": {
        "raw": None,
        "voltage": None,
        "soil": "UNKNOWN",
        "pump": "OFF",
        "sensor_ok": False,
        "timestamp": None,
    },
    "climate": {
        "temperature": None,
        "humidity": None,
        "fan": "OFF",
        "sensor_ok": False,
        "timestamp": None,
    },
    "gateway": {
        "connected": False,
        "last_sync": None,
        "last_status_code": None,
        "url": GATEWAY_URL,
    }
}

def update(section, **values):
    with state_lock:
        if section in state:
            state[section].update(values)
            state[section]["timestamp"] = datetime.now().isoformat()

# ==============================================================================
# GPIO SETUP + RELAY HELPERS
# ==============================================================================
if ON_RASPBERRY_PI:
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)

def light_on():
    if not ON_RASPBERRY_PI:
        return
    GPIO.setup(LIGHT_RELAY, GPIO.OUT,
               initial=GPIO.LOW if LIGHT_ACTIVE_LOW else GPIO.HIGH)

def light_off():
    if not ON_RASPBERRY_PI:
        return
    if LIGHT_OFF_MODE == "release" and LIGHT_ACTIVE_LOW:
        GPIO.setup(LIGHT_RELAY, GPIO.IN)
    else:
        GPIO.setup(LIGHT_RELAY, GPIO.OUT,
                   initial=GPIO.HIGH if LIGHT_ACTIVE_LOW else GPIO.LOW)

def active_low(pin, on):
    if not ON_RASPBERRY_PI:
        return
    GPIO.output(pin, GPIO.LOW if on else GPIO.HIGH)

def all_relays_off():
    if not ON_RASPBERRY_PI:
        return
    for fn in (
        light_off,
        lambda: active_low(TANK_RELAY, False),
        lambda: active_low(PUMP_RELAY, False),
        lambda: active_low(FAN_RELAY, False),
    ):
        try:
            fn()
        except Exception as e:
            print("Relay-off error:", e)

if ON_RASPBERRY_PI:
    light_off()
    for _pin in (TANK_RELAY, PUMP_RELAY, FAN_RELAY):
        GPIO.setup(_pin, GPIO.OUT, initial=GPIO.HIGH)  # Active low: HIGH = OFF
    GPIO.setup(TANK_TRIG, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(TANK_ECHO, GPIO.IN)

# ==============================================================================
# HARDWARE INITIALIZATION
# ==============================================================================
i2c = None
bh1750 = None
soil_channel = None
lcd = None
dht = None

if ON_RASPBERRY_PI:
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
    except Exception as e:
        print("[INIT] I2C bus init failed:", e)

    if i2c:
        try:
            bh1750 = adafruit_bh1750.BH1750(i2c)
            print("[INIT] BH1750 Lux sensor initialized.")
        except Exception as e:
            print("[INIT] BH1750 init failed:", e)

        try:
            soil_channel = AnalogIn(ADS.ADS1115(i2c), 0)
            print("[INIT] ADS1115 Soil moisture ADC initialized.")
        except Exception as e:
            print("[INIT] ADS1115 init failed:", e)

        try:
            lcd = CharLCD(i2c_expander="PCF8574", address=LCD_ADDRESS, port=1,
                          cols=16, rows=2, dotsize=8)
            lcd.clear()
            print("[INIT] LCD 16x2 display initialized.")
        except Exception as e:
            print("[INIT] LCD init failed (tank module continues without LCD):", e)

    try:
        # Use board.D26 for DHT22 on BCM26 (Physical pin 37)
        dht_pin_obj = getattr(board, f"D{DHT_BCM_PIN}", board.D26)
        dht = adafruit_dht.DHT22(dht_pin_obj, use_pulseio=False)
        print(f"[INIT] DHT22 initialized on BCM pin {DHT_BCM_PIN}.")
    except Exception as e:
        print("[INIT] DHT22 init failed:", e)

def lcd_write(row, text):
    if lcd is None or not ON_RASPBERRY_PI:
        return
    try:
        lcd.cursor_pos = (row, 0)
        lcd.write_string(text[:16].ljust(16))
    except Exception as e:
        print("[LCD] error:", e)

# ==============================================================================
# MODULE 1: GROW LIGHT
# ==============================================================================
def light_worker():
    light_is_on = False
    failures = 0
    while not stop_event.is_set():
        try:
            if bh1750:
                lux = bh1750.lux
                failures = 0
                new_state = light_is_on
                if lux < LIGHT_ON_BELOW:
                    new_state = True
                elif lux > LIGHT_OFF_ABOVE:
                    new_state = False

                if new_state != light_is_on:
                    light_is_on = new_state
                    light_on() if light_is_on else light_off()

                status = "ON" if light_is_on else "OFF"
                update("light", lux=round(lux, 2), light_status=status,
                       natural_light="Insufficient" if light_is_on else "Sufficient",
                       sensor_ok=True)
                print(f"[LIGHT] {lux:.2f} lux | Grow light: {status}")
            stop_event.wait(LIGHT_INTERVAL)
        except Exception as e:
            failures += 1
            print(f"[LIGHT] error ({failures}): {e}")
            if failures >= MAX_SENSOR_FAILURES:
                try:
                    light_off()
                    light_is_on = False
                except Exception as ge:
                    print("[LIGHT] GPIO fail-safe error:", ge)
                update("light", light_status="OFF", sensor_ok=False)
            stop_event.wait(2)

# ==============================================================================
# MODULE 2: WATER TANK
# ==============================================================================
def get_distance():
    if not ON_RASPBERRY_PI:
        return 12.0  # Simulated default
    GPIO.output(TANK_TRIG, GPIO.LOW)
    time.sleep(0.05)
    GPIO.output(TANK_TRIG, GPIO.HIGH)
    time.sleep(0.00001)
    GPIO.output(TANK_TRIG, GPIO.LOW)

    deadline = time.perf_counter() + 0.04
    while GPIO.input(TANK_ECHO) == GPIO.LOW:
        if time.perf_counter() > deadline:
            return None
    pulse_start = time.perf_counter()
    deadline = pulse_start + 0.04
    while GPIO.input(TANK_ECHO) == GPIO.HIGH:
        if time.perf_counter() > deadline:
            return None
    pulse_end = time.perf_counter()
    return round((pulse_end - pulse_start) * 17150, 2)

def tank_worker():
    lcd_write(0, "Sensor Init...")
    stop_event.wait(2)
    while not stop_event.is_set():
        try:
            distance = get_distance()
            if distance is None:
                active_low(TANK_RELAY, False)
                lcd_write(0, "Sensor Error")
                lcd_write(1, "Motor: OFF")
                update("tank", distance_cm=None, motor="OFF", sensor_ok=False)
                print("[TANK] Sensor error | Motor OFF")
            else:
                # Motor runs when tank is NOT full (distance >= full threshold)
                motor_on = distance >= TANK_FULL_CM
                active_low(TANK_RELAY, motor_on)
                lcd_write(0, f"Dist:{distance:6.1f}cm")
                lcd_write(1, "Motor: ON" if motor_on else "Motor: OFF")
                update("tank", distance_cm=distance,
                       motor="ON" if motor_on else "OFF", sensor_ok=True)
                print(f"[TANK] {distance:.1f} cm | Refill Motor: {'ON' if motor_on else 'OFF'}")
        except Exception as e:
            print("[TANK] error:", e)
            try:
                active_low(TANK_RELAY, False)
            except Exception:
                pass
        stop_event.wait(TANK_INTERVAL)

# ==============================================================================
# MODULE 3: SOIL MOISTURE / PUMP
# ==============================================================================
def soil_worker():
    while not stop_event.is_set():
        wait_time = SOIL_INTERVAL
        try:
            if soil_channel:
                raw = soil_channel.value
                volt = soil_channel.voltage
                dry = raw > DRY_THRESHOLD
                update("soil", raw=raw, voltage=round(volt, 3),
                       soil="DRY" if dry else "WET/NORMAL", sensor_ok=True)
                print(f"[SOIL] raw={raw} ({volt:.3f}V) -> {'DRY' if dry else 'WET/NORMAL'}")
                if dry:
                    print("[SOIL] Soil DRY -> Irrigation Pump ON")
                    active_low(PUMP_RELAY, True)
                    update("soil", pump="ON")
                    stop_event.wait(PUMP_TIME)
                    active_low(PUMP_RELAY, False)
                    update("soil", pump="OFF")
                    print("[SOIL] Irrigation Pump OFF - Soak phase begins")
                    wait_time = SOAK_TIME
            else:
                stop_event.wait(wait_time)
                continue
        except Exception as e:
            print("[SOIL] error:", e)
            try:
                active_low(PUMP_RELAY, False)
            except Exception:
                pass
            update("soil", pump="OFF", sensor_ok=False)
        stop_event.wait(wait_time)

# ==============================================================================
# MODULE 4: CLIMATE (TEMPERATURE / FAN)
# ==============================================================================
def climate_worker():
    fan_on = False
    while not stop_event.is_set():
        try:
            if dht:
                temperature = dht.temperature
                humidity = dht.humidity
                if temperature is None or humidity is None:
                    raise RuntimeError("Empty DHT reading")
                if temperature >= FAN_ON_TEMP and not fan_on:
                    active_low(FAN_RELAY, True)
                    fan_on = True
                elif temperature <= FAN_OFF_TEMP and fan_on:
                    active_low(FAN_RELAY, False)
                    fan_on = False

                update("climate", temperature=round(temperature, 1),
                       humidity=round(humidity, 1),
                       fan="ON" if fan_on else "OFF", sensor_ok=True)
                print(f"[CLIMATE] {temperature:.1f}°C | {humidity:.1f}% RH | Fan: {'ON' if fan_on else 'OFF'}")
            stop_event.wait(CLIMATE_INTERVAL)
        except RuntimeError as e:
            # Normal for DHT22 single read timing blip
            stop_event.wait(CLIMATE_INTERVAL)
        except Exception as e:
            print("[CLIMATE] error:", e)
            update("climate", sensor_ok=False)
            stop_event.wait(CLIMATE_INTERVAL)

# ==============================================================================
# MODULE 5: CLOUD GATEWAY SYNC WORKER (TRANSMITS OVER INTERNET)
# ==============================================================================
def cloud_sync_worker():
    """
    Asynchronously streams all greenhouse telemetry to the cloud backend.
    Runs in its own background thread so network latency never stalls GPIO.
    """
    print(f"\n[CLOUD] Gateway sync active -> Pushing to {GATEWAY_URL} every {SYNC_INTERVAL}s")
    session = requests.Session()

    while not stop_event.is_set():
        try:
            with state_lock:
                telemetry_payload = {
                    "source": "RaspberryPi_Greenhouse_Gateway",
                    "timestamp": datetime.now().isoformat(),
                    "lux": state["light"].get("lux", 0),
                    "light_status": state["light"].get("light_status", "OFF"),
                    "natural_light": state["light"].get("natural_light", "Sufficient"),
                    "light": copy.deepcopy(state["light"]),
                    "tank": copy.deepcopy(state["tank"]),
                    "soil": copy.deepcopy(state["soil"]),
                    "climate": copy.deepcopy(state["climate"]),
                }

            res = session.post(GATEWAY_URL, json=telemetry_payload, timeout=5)
            if res.status_code in (200, 201):
                with state_lock:
                    state["gateway"]["connected"] = True
                    state["gateway"]["last_sync"] = datetime.now().isoformat()
                    state["gateway"]["last_status_code"] = res.status_code
                print(f"[CLOUD] Gateway Sync OK ({res.status_code}) -> Telemetry delivered to website")
            else:
                print(f"[CLOUD] Gateway returned HTTP {res.status_code}: {res.text[:100]}")
                with state_lock:
                    state["gateway"]["connected"] = False
                    state["gateway"]["last_status_code"] = res.status_code

        except requests.exceptions.RequestException as e:
            with state_lock:
                state["gateway"]["connected"] = False
                state["gateway"]["last_status_code"] = "DISCONNECTED"
            print(f"[CLOUD] Gateway sync offline or unreachable ({e.__class__.__name__}). Will retry...")

        stop_event.wait(SYNC_INTERVAL)

# ==============================================================================
if FLASK_AVAILABLE:
    app = Flask(__name__)
    CORS(app)

    @app.route("/api/data", methods=["GET"])
    def get_data():
        with state_lock:
            snap = copy.deepcopy(state)
            out = snap["light"]
            out["tank"] = snap["tank"]
            out["soil"] = snap["soil"]
            out["climate"] = snap["climate"]
            out["gateway"] = snap["gateway"]
            return jsonify(out)

    @app.route("/api/status", methods=["GET"])
    def get_status():
        return jsonify({
            "status": "online",
            "gateway_sync": {
                "target": GATEWAY_URL,
                "connected": state["gateway"]["connected"],
                "last_sync": state["gateway"]["last_sync"],
            },
            "modules": {
                "light": bh1750 is not None,
                "tank": ON_RASPBERRY_PI,
                "lcd": lcd is not None,
                "soil": soil_channel is not None,
                "climate": dht is not None,
            },
        })
else:
    app = None

# ==============================================================================
# LIFECYCLE & THREADS MANAGEMENT
# ==============================================================================
def _on_sigterm(signum, frame):
    raise KeyboardInterrupt

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, _on_sigterm)

    workers = [
        ("tank", tank_worker),
        ("cloud_sync", cloud_sync_worker)
    ]
    if bh1750 or not ON_RASPBERRY_PI:
        workers.append(("light", light_worker))
    if soil_channel or not ON_RASPBERRY_PI:
        workers.append(("soil", soil_worker))
    if dht or not ON_RASPBERRY_PI:
        workers.append(("climate", climate_worker))

    threads = [threading.Thread(target=fn, name=name, daemon=True) for name, fn in workers]

    print("\n==================================================")
    print("  GREENHOUSE AUTOMATION & CLOUD GATEWAY STARTED   ")
    print("==================================================")
    print(f"Target Gateway: {GATEWAY_URL}")
    if FLASK_AVAILABLE:
        print(f"Local API     : http://0.0.0.0:{LOCAL_PORT}/api/data")
    print("Press Ctrl+C to stop.\n")

    for t in threads:
        t.start()

    try:
        if FLASK_AVAILABLE:
            app.run(host="0.0.0.0", port=LOCAL_PORT, debug=False, threaded=True)
        else:
            while not stop_event.is_set():
                time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping greenhouse system...")

    finally:
        stop_event.set()
        for t in threads:
            t.join(timeout=3)
        all_relays_off()
        if lcd:
            try:
                lcd.clear()
            except Exception:
                pass
        if dht:
            try:
                dht.exit()
            except Exception:
                pass
        if ON_RASPBERRY_PI:
            GPIO.cleanup()
            print("GPIO cleaned up.")
