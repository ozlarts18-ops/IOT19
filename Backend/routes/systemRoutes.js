const express = require("express");
const router = express.Router();

const Sensor = require("../models/Sensor");
const CropGrowth = require("../models/CropGrowth");


// =====================================================
// SYSTEM STATUS
// GET /api/system/status
// =====================================================

router.get("/status", async (req, res) => {
    try {

        const latestSensor =
            await Sensor.findOne()
                .sort({ createdAt: -1 });


        const latestCropGrowth =
            await CropGrowth.findOne()
                .sort({ createdAt: -1 });


        res.status(200).json({

            success: true,

            system: {
                name: "IOT19 Smart Agriculture",
                status: "Connected",
                backend: "Online",
                database: "Connected"
            },

            sensors: {
                connected:
                    !!latestSensor,

                lastUpdate:
                    latestSensor
                        ? latestSensor.createdAt
                        : null
            },

            cropGrowth: {
                available:
                    !!latestCropGrowth,

                lastUpdate:
                    latestCropGrowth
                        ? latestCropGrowth.createdAt
                        : null
            },

            timestamp:
                new Date()
        });

    } catch (error) {

        console.error(
            "System status error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch system status",

            error:
                error.message
        });
    }
});


// =====================================================
// SYSTEM HEALTH
// GET /api/system/health
// =====================================================

router.get("/health", async (req, res) => {
    try {

        const sensor =
            await Sensor.findOne()
                .sort({ createdAt: -1 });


        res.status(200).json({

            success: true,

            status: "OK",

            message:
                "IOT19 Smart Agriculture system is healthy",

            database:
                "Connected",

            sensorData:
                sensor
                    ? "Available"
                    : "No sensor data",

            timestamp:
                new Date()
        });

    } catch (error) {

        console.error(
            "System health error:",
            error
        );

        res.status(500).json({

            success: false,

            status: "ERROR",

            message:
                "System health check failed",

            database:
                "Disconnected",

            error:
                error.message,

            timestamp:
                new Date()
        });
    }
});


// =====================================================
// SYSTEM SUMMARY
// GET /api/system/summary
// =====================================================

router.get("/summary", async (req, res) => {
    try {

        const sensorCount =
            await Sensor.countDocuments();


        const cropGrowthCount =
            await CropGrowth.countDocuments();


        const latestSensor =
            await Sensor.findOne()
                .sort({ createdAt: -1 });


        const latestCropGrowth =
            await CropGrowth.findOne()
                .sort({ createdAt: -1 });


        res.status(200).json({

            success: true,

            data: {

                totalSensorRecords:
                    sensorCount,

                totalCropGrowthRecords:
                    cropGrowthCount,

                latestSensor:
                    latestSensor || null,

                latestCropGrowth:
                    latestCropGrowth || null
            },

            timestamp:
                new Date()
        });

    } catch (error) {

        console.error(
            "System summary error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch system summary",

            error:
                error.message
        });
    }
});


// =====================================================
// SENSOR CONNECTION STATUS
// GET /api/system/sensors
// =====================================================

router.get("/sensors", async (req, res) => {
    try {

        const latestSensor =
            await Sensor.findOne()
                .sort({ createdAt: -1 });


        if (!latestSensor) {

            return res.status(200).json({

                success: true,

                connected: false,

                message:
                    "No sensor data available",

                data: null
            });
        }


        res.status(200).json({

            success: true,

            connected: true,

            message:
                "Sensor system connected",

            data: {

                temperature:
                    latestSensor.temperature,

                humidity:
                    latestSensor.humidity,

                soilMoisture:
                    latestSensor.soilMoisture,

                waterLevel:
                    latestSensor.waterLevel,

                lightIntensity:
                    latestSensor.lightIntensity,

                irrigation:
                    latestSensor.irrigation,

                pumpStatus:
                    latestSensor.pumpStatus,

                fanStatus:
                    latestSensor.fanStatus,

                growLightStatus:
                    latestSensor.growLightStatus,

                lastUpdate:
                    latestSensor.createdAt
            }
        });

    } catch (error) {

        console.error(
            "System sensor status error:",
            error
        );

        res.status(500).json({

            success: false,

            connected: false,

            message:
                "Failed to fetch sensor status",

            error:
                error.message
        });
    }
});


// =====================================================
// CROP GROWTH STATUS
// GET /api/system/crop-growth
// =====================================================

router.get("/crop-growth", async (req, res) => {
    try {

        const latest =
            await CropGrowth.findOne()
                .sort({ createdAt: -1 });


        if (!latest) {

            return res.status(200).json({

                success: true,

                available: false,

                message:
                    "No crop growth data available",

                data: null
            });
        }


        res.status(200).json({

            success: true,

            available: true,

            data: {

                plantHeight:
                    latest.plantHeight,

                leafCount:
                    latest.leafCount,

                growthRate:
                    latest.growthRate,

                growthPercentage:
                    latest.growthPercentage,

                growthStage:
                    latest.growthStage,

                growthHealth:
                    latest.growthHealth,

                plantSize:
                    latest.plantSize,

                lastUpdate:
                    latest.createdAt
            }
        });

    } catch (error) {

        console.error(
            "System crop growth error:",
            error
        );

        res.status(500).json({

            success: false,

            available: false,

            message:
                "Failed to fetch crop growth status",

            error:
                error.message
        });
    }
});


module.exports = router;