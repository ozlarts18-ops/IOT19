const mongoose = require("mongoose");

const plantIdentificationSchema = new mongoose.Schema(
    {
        // ================================
        // SPECIES IDENTIFICATION
        // ================================
        commonName: {
            type: String,
            default: "Unknown Plant",
            trim: true
        },

        scientificName: {
            type: String,
            default: "",
            trim: true
        },

        confidence: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        family: {
            type: String,
            default: "",
            trim: true
        },

        genus: {
            type: String,
            default: "",
            trim: true
        },


        // ================================
        // GBIF TAXONOMY
        // ================================
        gbifTaxonomy: {
            kingdom: { type: String, default: "Plantae" },
            phylum: { type: String, default: "" },
            class: { type: String, default: "" },
            order: { type: String, default: "" },
            family: { type: String, default: "" },
            genus: { type: String, default: "" },
            species: { type: String, default: "" },
            scientificName: { type: String, default: "" },
            matchType: { type: String, default: "" },
            status: { type: String, default: "" },
            taxonID: { type: Number, default: null }
        },


        // ================================
        // PERENUAL CARE DATA
        // ================================
        perenual: {
            watering: { type: String, default: "Average" },
            wateringPeriod: { type: String, default: "Weekly" },
            sunlight: [{ type: String }],
            soil: { type: String, default: "Well-drained fertile soil" },
            growthRate: { type: String, default: "Moderate" },
            careLevel: { type: String, default: "Medium" },
            cycle: { type: String, default: "Annual / Perennial" },
            dimension: { type: String, default: "" },
            floweringSeason: { type: String, default: "Summer" },
            propagation: { type: String, default: "Seed / Cutting" },
            origin: { type: String, default: "" },
            maintenance: { type: String, default: "Moderate" }
        },


        // ================================
        // GREEN INDEX & GROWTH TRACKING
        // ================================
        greenIndex: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        greenIndexChange: {
            type: Number,
            default: 0
        },


        // ================================
        // IMAGE & ATTACHMENT
        // ================================
        imageUrl: {
            type: String,
            default: ""
        },

        imagePath: {
            type: String,
            default: ""
        },

        imageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CropImage",
            default: null
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

plantIdentificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PlantIdentification", plantIdentificationSchema);
