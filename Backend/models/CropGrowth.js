const mongoose = require("mongoose");

const cropGrowthSchema = new mongoose.Schema(
    {
        // ================================
        // CROP IMAGE
        // ================================

        imageUrl: {
            type: String,
            default: ""
        },

        date: {
            type: Date,
            default: Date.now
        },

        time: {
            type: String,
            default: ""
        },

        dayNumber: {
            type: Number,
            default: 1,
            min: 1
        },


        // ================================
        // PLANT HEIGHT
        // ================================

        plantHeight: {
            type: Number,
            default: 0,
            min: 0
        },

        previousHeight: {
            type: Number,
            default: 0,
            min: 0
        },

        heightGrowth: {
            type: Number,
            default: 0
        },

        growthRate: {
            type: Number,
            default: 0
        },


        // ================================
        // LEAF INFORMATION
        // ================================

        leafCount: {
            type: Number,
            default: 0,
            min: 0
        },

        previousLeafCount: {
            type: Number,
            default: 0,
            min: 0
        },

        newLeaves: {
            type: Number,
            default: 0
        },

        leafArea: {
            type: Number,
            default: 0,
            min: 0
        },

        averageLeafSize: {
            type: Number,
            default: 0,
            min: 0
        },


        // ================================
        // GROWTH
        // ================================

        growthPercentage: {
            type: Number,
            default: 0
        },

        growthSinceDay1: {
            type: Number,
            default: 0
        },

        heightSinceDay1: {
            type: Number,
            default: 0
        },

        leavesSinceDay1: {
            type: Number,
            default: 0
        },

        leafAreaSinceDay1: {
            type: Number,
            default: 0
        },


        // ================================
        // PLANT SIZE
        // ================================

        plantSize: {
            type: String,
            default: "Small"
        },

        previousPlantSize: {
            type: String,
            default: "Small"
        },

        plantSizeChange: {
            type: String,
            default: "0%"
        },


        // ================================
        // GROWTH STAGE
        // ================================

        growthStage: {
            type: String,
            enum: [
                "Seedling",
                "Vegetative",
                "Flowering",
                "Fruiting"
            ],
            default: "Seedling"
        },


        // ================================
        // GROWTH HEALTH
        // ================================

        growthHealth: {
            type: String,
            enum: [
                "Healthy Growth",
                "Moderate Growth",
                "Poor Growth",
                "Critical"
            ],
            default: "Healthy Growth"
        }
    },

    {
        timestamps: true
    }
);


// Index for latest crop record
cropGrowthSchema.index({
    createdAt: -1
});


// Export model
module.exports = mongoose.model(
    "CropGrowth",
    cropGrowthSchema
);