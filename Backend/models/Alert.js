const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        // =====================================================
        // ALERT TYPE
        // =====================================================
        type: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // ALERT MESSAGE
        // =====================================================
        message: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // SEVERITY
        // =====================================================
        severity: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ],
            default: "MEDIUM"
        },

        // =====================================================
        // SENSOR VALUE
        // =====================================================
        sensorValue: {
            type: Number,
            default: null
        },

        // =====================================================
        // SENSOR TYPE
        // =====================================================
        sensorType: {
            type: String,
            default: null,
            trim: true
        },

        // =====================================================
        // PEST INFORMATION
        // =====================================================
        pestType: {
            type: String,
            default: null,
            trim: true
        },

        confidence: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        },

        pestCount: {
            type: Number,
            default: null,
            min: 0
        },

        // =====================================================
        // ALERT STATUS
        // =====================================================
        status: {
            type: String,
            enum: [
                "ACTIVE",
                "RESOLVED"
            ],
            default: "ACTIVE"
        },

        // =====================================================
        // READ / UNREAD
        // =====================================================
        read: {
            type: Boolean,
            default: false
        },

        // =====================================================
        // RESOLVED TIME
        // =====================================================
        resolvedAt: {
            type: Date,
            default: null
        }
    },

    {
        timestamps: true
    }
);


// =====================================================
// PREVENT OverwriteModelError
// =====================================================

module.exports =
    mongoose.models.Alert ||
    mongoose.model("Alert", alertSchema);