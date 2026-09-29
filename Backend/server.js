const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const app = express();

// =====================================================
// ROUTES
// =====================================================

const cropGrowthRoutes =
    require("./routes/cropGrowthRoutes");

const irrigationRoutes =
    require("./routes/irrigationRoutes");

const analyticsRoutes =
    require("./routes/analyticsRoutes");

const cameraRoutes =
    require("./routes/cameraRoutes");

const pestRoutes =
    require("./routes/pestRoutes");

const deviceRoutes =
    require("./routes/deviceRoutes");

const authRoutes =
    require("./routes/authRoutes");

const sensorRoutes =
    require("./routes/sensorRoutes");

const alertRoutes =
    require("./routes/alertRoutes");

const cropHealthRoutes =
    require("./routes/cropHealthRoutes");

const systemRoutes =
    require("./routes/systemRoutes");


// =====================================================
// MODELS
// =====================================================

const Sensor =
    require("./models/Sensor");

const Alert =
    require("./models/Alert");


// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use(
    "/api/auth",
    authRoutes
);


// Sensors
app.use(
    "/api/sensors",
    sensorRoutes
);


// Alerts
app.use(
    "/api/alerts",
    alertRoutes
);


// Crop Health
app.use(
    "/api/crop-health",
    cropHealthRoutes
);


// Crop Growth
app.use(
    "/api/crop-growth",
    cropGrowthRoutes
);


// Irrigation
app.use(
    "/api/irrigation",
    irrigationRoutes
);


// Analytics
app.use(
    "/api/analytics",
    analyticsRoutes
);


// Camera
app.use(
    "/api/camera",
    cameraRoutes
);


// Pest Detection
app.use(
    "/api/pests",
    pestRoutes
);


// Devices
app.use(
    "/api/devices",
    deviceRoutes
);


// System
app.use(
    "/api/system",
    systemRoutes
);


// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "IOT19 Backend API is Running"
    });

});


// =====================================================
// CREATE AUTOMATIC ALERT
// =====================================================

async function createAlert(
    type,
    message,
    severity,
    sensorValue,
    sensorType
) {

    try {

        const existingAlert =
            await Alert.findOne({
                type: type,
                status: "ACTIVE"
            });


        // Don't create duplicate active alerts
        if (existingAlert) {
            return;
        }


        const alert =
            await Alert.create({

                type: type,

                message: message,

                severity: severity,

                sensorValue:
                    Number(sensorValue ?? 0),

                sensorType:
                    sensorType || null,

                status: "ACTIVE",

                read: false

            });


        console.log(
            `🚨 Alert created: ${type}`
        );


        // =================================================
        // WHATSAPP ALERT
        // =================================================

        try {

            const {
                sendWhatsAppAlert
            } = require(
                "./services/whatsappService"
            );


            const result =
                await sendWhatsAppAlert(alert);


            if (
                result &&
                result.success
            ) {

                console.log(
                    `✅ WhatsApp alert sent: ${type}`
                );

            } else {

                console.log(
                    `⚠️ WhatsApp alert failed: ${type}`
                );

            }

        } catch (whatsappError) {

            console.error(
                "WhatsApp error:",
                whatsappError.message
            );

        }

    } catch (error) {

        console.error(
            "Create alert error:",
            error.message
        );

    }

}


// =====================================================
// SOIL MOISTURE ALERT
// =====================================================

async function checkSoilMoistureAlert() {

    try {

        const sensor =
            await Sensor.findOne()
                .sort({
                    createdAt: -1
                });


        if (!sensor) {
            return;
        }


        const soil =
            Number(
                sensor.soilMoisture
            );


        if (!Number.isFinite(soil)) {
            return;
        }


        // Soil below 40%
        if (soil < 40) {

            await createAlert(

                "LOW_SOIL_MOISTURE",

                `Soil moisture is low: ${soil}%. Irrigation recommended.`,

                "HIGH",

                soil,

                "soilMoisture"

            );

        }


        // Resolve alert when soil reaches 40%
        else if (soil >= 40) {

            const alert =
                await Alert.findOne({

                    type:
                        "LOW_SOIL_MOISTURE",

                    status:
                        "ACTIVE"

                });


            if (alert) {

                alert.status =
                    "RESOLVED";

                alert.resolvedAt =
                    new Date();

                await alert.save();

                console.log(
                    "✅ Soil moisture alert resolved"
                );

            }

        }

    } catch (error) {

        console.error(
            "Soil moisture alert error:",
            error.message
        );

    }

}


// =====================================================
// AUTOMATIC IRRIGATION
// =====================================================

async function automaticIrrigation() {

    try {

        const sensor =
            await Sensor.findOne()
                .sort({
                    createdAt: -1
                });


        if (!sensor) {
            return;
        }


        const soil =
            Number(
                sensor.soilMoisture
            );


        const water =
            Number(
                sensor.waterLevel
            );


        if (
            !Number.isFinite(soil) ||
            !Number.isFinite(water)
        ) {
            return;
        }


        // =================================================
        // WATER SAFETY
        // =================================================

        if (water < 20) {

            if (
                sensor.irrigation ||
                sensor.pumpStatus
            ) {

                sensor.irrigation =
                    false;

                sensor.pumpStatus =
                    false;

                await sensor.save();

                console.log(
                    "🚨 Water below 20% - Pump disabled"
                );

            }

            return;
        }


        // =================================================
        // SOIL DRY
        // =================================================

        if (soil < 40) {

            if (!sensor.irrigation) {

                sensor.irrigation =
                    true;

                sensor.pumpStatus =
                    true;

                await sensor.save();

                console.log(
                    "🌱 Soil below 40% - Irrigation ON"
                );

            }

        }


        // =================================================
        // SOIL WET
        // =================================================

        else if (soil >= 65) {

            if (sensor.irrigation) {

                sensor.irrigation =
                    false;

                sensor.pumpStatus =
                    false;

                await sensor.save();

                console.log(
                    "💧 Soil reached 65% - Irrigation OFF"
                );

            }

        }

    } catch (error) {

        console.error(
            "Automatic irrigation error:",
            error.message
        );

    }

}


// =====================================================
// AUTOMATIC FAN
// =====================================================

async function automaticEnvironmentControl() {

    try {

        const sensor =
            await Sensor.findOne()
                .sort({
                    createdAt: -1
                });


        if (!sensor) {
            return;
        }


        const temperature =
            Number(
                sensor.temperature
            );


        if (!Number.isFinite(temperature)) {
            return;
        }


        // Fan ON at 30°C or above
        if (temperature >= 30) {

            sensor.fanStatus =
                true;

        }


        // Fan OFF at 28°C or below
        else if (temperature <= 28) {

            sensor.fanStatus =
                false;

        }


        await sensor.save();

    } catch (error) {

        console.error(
            "Environment automation error:",
            error.message
        );

    }

}


// =====================================================
// AUTOMATIC GROW LIGHT
// =====================================================

async function automaticLighting() {

    try {

        const sensor =
            await Sensor.findOne()
                .sort({
                    createdAt: -1
                });


        if (!sensor) {
            return;
        }


        const light =
            Number(
                sensor.lightIntensity ??
                sensor.lightLevel ??
                0
            );


        const required =
            Number(
                sensor.lightRequirement ??
                700
            );


        if (
            !Number.isFinite(light) ||
            !Number.isFinite(required)
        ) {
            return;
        }


        // Light below required level
        if (light < required) {

            sensor.growLightStatus =
                true;

        }


        // Light sufficient
        else {

            sensor.growLightStatus =
                false;

        }


        await sensor.save();

    } catch (error) {

        console.error(
            "Lighting automation error:",
            error.message
        );

    }

}


// =====================================================
// ENVIRONMENT ALERTS
// =====================================================

async function checkEnvironmentAlerts() {

    try {

        const sensor =
            await Sensor.findOne()
                .sort({
                    createdAt: -1
                });


        if (!sensor) {
            return;
        }


        const temperature =
            Number(
                sensor.temperature
            );


        const humidity =
            Number(
                sensor.humidity
            );


        const water =
            Number(
                sensor.waterLevel
            );


        // =================================================
        // HIGH TEMPERATURE
        // =================================================

        if (temperature > 35) {

            await createAlert(

                "HIGH_TEMPERATURE",

                `Temperature is too high: ${temperature}°C`,

                "HIGH",

                temperature,

                "temperature"

            );

        }


        // =================================================
        // LOW TEMPERATURE
        // =================================================

        if (temperature < 15) {

            await createAlert(

                "LOW_TEMPERATURE",

                `Temperature is too low: ${temperature}°C`,

                "MEDIUM",

                temperature,

                "temperature"

            );

        }


        // =================================================
        // HIGH HUMIDITY
        // =================================================

        if (humidity > 85) {

            await createAlert(

                "HIGH_HUMIDITY",

                `Humidity is too high: ${humidity}%`,

                "MEDIUM",

                humidity,

                "humidity"

            );

        }


        // =================================================
        // LOW HUMIDITY
        // =================================================

        if (humidity < 30) {

            await createAlert(

                "LOW_HUMIDITY",

                `Humidity is too low: ${humidity}%`,

                "MEDIUM",

                humidity,

                "humidity"

            );

        }


        // =================================================
        // LOW WATER
        // =================================================

        if (water < 20) {

            await createAlert(

                "LOW_WATER_LEVEL",

                `Water tank level is low: ${water}%. Pump disabled.`,

                "HIGH",

                water,

                "waterLevel"

            );

        }

    } catch (error) {

        console.error(
            "Environment alert error:",
            error.message
        );

    }

}


// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
    .connect(process.env.MONGO_URI)

    .then(() => {

        console.log(
            "✅ MongoDB Connected Successfully"
        );


        // =================================================
        // AUTOMATIC SYSTEMS
        // =================================================

        setInterval(
            checkSoilMoistureAlert,
            10000
        );


        setInterval(
            automaticIrrigation,
            10000
        );


        setInterval(
            automaticEnvironmentControl,
            10000
        );


        setInterval(
            automaticLighting,
            10000
        );


        setInterval(
            checkEnvironmentAlerts,
            10000
        );


        // Optional periodic plant monitor interval
        const plantIdIntervalSec = parseInt(process.env.PLANT_ID_INTERVAL_SECONDS, 10);
        if (plantIdIntervalSec && plantIdIntervalSec > 0) {
            setInterval(async () => {
                try {
                    const CropImage = require("./models/CropImage");
                    const { identifyAndLogPlant } = require("./services/plantIdService");
                    const latestImage = await CropImage.findOne().sort({ uploadedAt: -1 });
                    if (latestImage && latestImage.imagePath) {
                        await identifyAndLogPlant(latestImage.imagePath, latestImage._id);
                    }
                } catch (e) {
                    console.error("Periodic plant monitor interval error:", e.message);
                }
            }, plantIdIntervalSec * 1000);
            console.log(`🌿 Plant Identification periodic monitor active (${plantIdIntervalSec}s interval)`);
        }


        console.log(
            "🌱 IOT19 Automatic Systems Started"
        );

    })

    .catch((error) => {

        console.error(
            "❌ MongoDB Connection Error:",
            error.message
        );

    });


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server error:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                err.message

        });

    }
);


// =====================================================
// SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `🚀 IOT19 Backend running on port ${PORT}`
        );

    }
);