const mongoose = require("mongoose");

const deviceConfigSchema = new mongoose.Schema(
    {
        deviceName: {
            type: String,
            required: true,
            unique: true
        },

        deviceType: {
            type: String,
            enum: [
                "PUMP",
                "FAN",
                "GROW_LIGHT",
                "CAMERA"
            ],
            required: true
        },

        state: {
            type: Boolean,
            default: false
        },

        mode: {
            type: String,
            enum: ["AUTO", "MANUAL"],
            default: "AUTO"
        },

        enabled: {
            type: Boolean,
            default: true
        },

        lastChanged: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "DeviceConfig",
    deviceConfigSchema
);