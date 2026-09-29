const mongoose = require("mongoose");

const cropHealthSchema = new mongoose.Schema(
    {
        health: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        healthScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        status: {
            type: String,
            default: "UNKNOWN"
        },
        diagnosis: {
            type: String,
            default: "ANALYZING"
        },
        crop: {
            type: String,
            default: ""
        },
        disease: {
            type: String,
            default: ""
        },
        confidence: {
            type: Number,
            default: 0
        },
        modelName: {
            type: String,
            default: "plant_disease_model.pt"
        },
        treatment: {
            type: String,
            default: ""
        },
        topDetections: [
            {
                className: String,
                crop: String,
                disease: String,
                probability: Number
            }
        ],
        imageUrl: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.CropHealth ||
    mongoose.model("CropHealth", cropHealthSchema);
