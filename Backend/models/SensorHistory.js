const mongoose = require("mongoose");

const sensorHistorySchema = new mongoose.Schema(
    {
        // =====================================================
        // ENVIRONMENT
        // =====================================================

        temperature: {
            type: Number,
            required: true
        },

        humidity: {
            type: Number,
            required: true
        },

        soilMoisture: {
            type: Number,
            required: true
        },

        airQuality: {
            type: Number,
            default: 0
        },


        // =====================================================
        // WATER
        // =====================================================

        waterLevel: {
            type: Number,
            required: true
        },

        waterHeight: {
            type: Number,
            default: 0
        },

        waterUsage: {
            type: Number,
            default: 0
        },

        tankStatus: {
            type: String,
            enum: ["NORMAL", "LOW", "CRITICAL"],
            default: "NORMAL"
        },

        pumpPermission: {
            type: Boolean,
            default: true
        },

        lowWaterStatus: {
            type: Boolean,
            default: false
        },

        lastRefill: {
            type: Date,
            default: null
        },


        // =====================================================
        // LIGHT
        // =====================================================

        lightIntensity: {
            type: Number,
            default: 0
        },

        lightRequirement: {
            type: Number,
            default: 700
        },

        growLightStatus: {
            type: Boolean,
            default: false
        },


        // =====================================================
        // CROP
        // =====================================================

        plantHeight: {
            type: Number,
            default: 0
        },

        leafCount: {
            type: Number,
            default: 0
        },

        growthRate: {
            type: Number,
            default: 0
        },


        // =====================================================
        // IRRIGATION
        // =====================================================

        irrigation: {
            type: Boolean,
            default: false
        },

        pumpStatus: {
            type: Boolean,
            default: false
        },

        irrigationDuration: {
            type: Number,
            default: 0
        },

        irrigationMode: {
            type: String,
            enum: ["MANUAL", "AUTO"],
            default: "AUTO"
        },


        // =====================================================
        // FAN
        // =====================================================

        fanStatus: {
            type: Boolean,
            default: false
        },

        fanThreshold: {
            type: Number,
            default: 30
        },


        // =====================================================
        // AUTOMATION
        // =====================================================

        automationMode: {
            type: String,
            enum: ["MANUAL", "AUTO"],
            default: "AUTO"
        },


        // =====================================================
        // RECORD TIME
        // =====================================================

        recordedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "SensorHistory",
    sensorHistorySchema
);