const mongoose = require("mongoose");

const pestDetectionSchema = new mongoose.Schema(
    {
        // =====================================================
        // PEST TYPE & TOP PEST
        // =====================================================
        pestType: {
            type: String,
            default: "None",
            trim: true
        },

        topPest: {
            type: String,
            default: "None",
            trim: true
        },

        // =====================================================
        // AI CONFIDENCE
        // =====================================================
        confidence: {
            type: Number,
            default: 0
        },

        // =====================================================
        // NUMBER OF PESTS
        // =====================================================
        pestCount: {
            type: Number,
            default: 0,
            min: 0
        },

        // =====================================================
        // SEVERITY
        // =====================================================
        severity: {
            type: String,
            enum: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "NONE"
        },

        // =====================================================
        // DETECTIONS ARRAY
        // =====================================================
        detections: [
            {
                class_id: Number,
                class_name: String,
                confidence: Number,
                bbox: [Number]
            }
        ],

        // =====================================================
        // IMAGE PATH / URL
        // =====================================================
        imagePath: {
            type: String,
            default: null,
            trim: true
        },

        imageUrl: {
            type: String,
            default: null,
            trim: true
        },

        // =====================================================
        // DETECTION STATUS
        // =====================================================
        status: {
            type: String,
            default: "DETECTED"
        },

        // =====================================================
        // CAMERA SOURCE
        // =====================================================
        cameraId: {
            type: String,
            default: null,
            trim: true
        },

        // =====================================================
        // ADDITIONAL INFORMATION
        // =====================================================
        notes: {
            type: String,
            default: "",
            trim: true
        },

        modelName: {
            type: String,
            default: "best (1).pt",
            trim: true
        },

        // =====================================================
        // DETECTION TIME
        // =====================================================
        detectedAt: {
            type: Date,
            default: Date.now
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
    mongoose.models.PestDetection ||
    mongoose.model(
        "PestDetection",
        pestDetectionSchema
    );