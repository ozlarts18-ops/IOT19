const mongoose = require("mongoose");

const waterHistorySchema = new mongoose.Schema(
    {
        waterLevel: {
            type: Number,
            required: true
        },

        waterHeight: {
            type: Number,
            default: 0
        },

        tankCapacity: {
            type: Number,
            default: 0
        },

        waterUsed: {
            type: Number,
            default: 0
        },

        // Compatibility with IrrigationEvent terminology.
        waterUsedLitres: {
            type: Number,
            default: 0
        },

        pumpAllowed: {
            type: Boolean,
            default: true
        },

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
    "WaterHistory",
    waterHistorySchema
);
