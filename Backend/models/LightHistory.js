const mongoose = require("mongoose");

const lightHistorySchema = new mongoose.Schema(
    {
        lightIntensity: {
            type: Number,
            required: true
        },

        lightRequirement: {
            type: Number,
            default: 700
        },

        // Backward compatibility with older records.
        requiredLight: {
            type: Number,
            default: 700
        },

        growLight: {
            type: Boolean,
            default: false
        },

        mode: {
            type: String,
            enum: ["AUTO", "MANUAL"],
            default: "AUTO"
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
    "LightHistory",
    lightHistorySchema
);
