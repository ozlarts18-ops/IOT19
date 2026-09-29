const mongoose = require("mongoose");

const irrigationEventSchema = new mongoose.Schema(
    {
        startTime: {
            type: Date,
            required: true,
            default: Date.now
        },

        endTime: {
            type: Date,
            default: null
        },

        durationMinutes: {
            type: Number,
            default: 0
        },

        soilMoistureBefore: {
            type: Number,
            default: null
        },

        soilMoistureAfter: {
            type: Number,
            default: null
        },

        waterUsedLitres: {
            type: Number,
            default: 0
        },

        mode: {
            type: String,
            enum: ["AUTO", "MANUAL"],
            default: "AUTO"
        },

        reason: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["RUNNING", "COMPLETED", "CANCELLED"],
            default: "RUNNING"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "IrrigationEvent",
    irrigationEventSchema
);