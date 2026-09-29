require("dotenv").config();

const mongoose = require("mongoose");
const Sensor = require("../models/Sensor");
const SensorHistory = require("../models/SensorHistory");
const LightHistory = require("../models/LightHistory");
const WaterHistory = require("../models/WaterHistory");
const IrrigationEvent = require("../models/IrrigationEvent");
const PestDetection = require("../models/PestDetection");

function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

async function main() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const now = Date.now();
    const sensorDocs = [];
    const sensorHistoryDocs = [];
    const lightDocs = [];
    const waterDocs = [];

    for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now - (23 - i) * 60 * 60 * 1000);
        const temperature = round(24 + Math.sin(i / 3) * 4);
        const humidity = round(62 + Math.cos(i / 4) * 10);
        const soilMoisture = round(52 + Math.sin(i / 4) * 14);
        const lightIntensity = round(500 + Math.max(0, Math.sin((i / 23) * Math.PI)) * 550);
        const waterLevel = round(78 - i * 0.9 + Math.sin(i / 3) * 4);
        const waterHeight = round(waterLevel * 0.42);
        const requiredLight = 700;
        const growLightStatus = lightIntensity < requiredLight;
        const pumpStatus = soilMoisture < 40 && waterLevel >= 20;

        const data = {
            temperature,
            humidity,
            soilMoisture,
            airQuality: 45 + (i % 8),
            waterLevel,
            waterHeight,
            waterUsage: pumpStatus ? 2 : 0,
            tankStatus: waterLevel < 10 ? "CRITICAL" : waterLevel < 20 ? "LOW" : "NORMAL",
            pumpPermission: waterLevel >= 20,
            lowWaterStatus: waterLevel < 20,
            lastRefill: i === 0 ? timestamp : null,
            lightIntensity,
            lightLevel: lightIntensity,
            lightRequirement: requiredLight,
            growLightStatus,
            plantHeight: round(12 + i * 0.25),
            leafCount: 6 + Math.floor(i / 3),
            growthRate: 0.25,
            irrigation: pumpStatus,
            pumpStatus,
            irrigationDuration: pumpStatus ? 5 : 0,
            irrigationMode: "AUTO",
            fanStatus: temperature > 30,
            fanThreshold: 30,
            automationMode: "AUTO",
            createdAt: timestamp,
            updatedAt: timestamp
        };

        sensorDocs.push(data);
        sensorHistoryDocs.push({ ...data, recordedAt: timestamp });
        lightDocs.push({
            lightIntensity,
            lightRequirement: requiredLight,
            requiredLight,
            growLight: growLightStatus,
            mode: "AUTO",
            recordedAt: timestamp
        });
        waterDocs.push({
            waterLevel,
            waterHeight,
            waterUsed: pumpStatus ? 2 : 0,
            waterUsedLitres: pumpStatus ? 2 : 0,
            pumpAllowed: waterLevel >= 20,
            recordedAt: timestamp
        });
    }

    await Sensor.insertMany(sensorDocs);
    await SensorHistory.insertMany(sensorHistoryDocs);
    await LightHistory.insertMany(lightDocs);
    await WaterHistory.insertMany(waterDocs);

    await IrrigationEvent.create({
        startTime: new Date(now - 3 * 60 * 60 * 1000),
        endTime: new Date(now - 3 * 60 * 60 * 1000 + 5 * 60 * 1000),
        durationMinutes: 5,
        soilMoistureBefore: 36,
        soilMoistureAfter: 48,
        waterUsedLitres: 2,
        mode: "AUTO",
        reason: "Test data",
        status: "COMPLETED"
    });

    await PestDetection.create({
        pestType: "Aphids",
        confidence: 91,
        pestCount: 3,
        status: "DETECTED",
        notes: "Test analytics record",
        detectedAt: new Date(now - 2 * 60 * 60 * 1000)
    });

    console.log("✅ IOT19 test data inserted successfully.");
    console.log("   Sensor records:", sensorDocs.length);
    console.log("   History records:", sensorHistoryDocs.length);
    console.log("   Light records:", lightDocs.length);
    console.log("   Water records:", waterDocs.length);
    console.log("   Irrigation records: 1");
    console.log("   Pest records: 1");
}

main()
    .catch(error => {
        console.error("❌ Test data error:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
