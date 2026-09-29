const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
    {
        // =====================================================
        // ENVIRONMENT
        // =====================================================

        temperature: {
            type: Number,
            required: true,
            default: 0
        },

        humidity: {
            type: Number,
            required: true,
            default: 0
        },

        soilMoisture: {
            type: Number,
            required: true,
            default: 0
        },

        airQuality: {
            type: Number,
            default: 0
        },


        // =====================================================
        // WATER TANK
        // =====================================================
waterLevel: {
    type: Number,
    required: true,
    default: 0
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

        // Keep lightLevel for compatibility
        // with existing frontend/API code
        lightLevel: {
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
        // CROP GROWTH
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
        }
    },

    {
        timestamps: true
    }
);


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model(
    "Sensor",
    sensorSchema
);