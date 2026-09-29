const mongoose = require("mongoose");

const cropImageSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: true
        },

        originalName: {
            type: String,
            default: ""
        },

        path: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        plantHeight: {
            type: Number,
            default: null
        },

        leafCount: {
            type: Number,
            default: null
        },

        leafArea: {
    type: Number,
    default: 0,
    min: 0
},

        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "CropImage",
    cropImageSchema
);