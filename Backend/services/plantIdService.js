const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const PlantIdentification = require("../models/PlantIdentification");

const PLANT_ID_SERVICE_URL = process.env.PLANT_ID_SERVICE_URL || "http://localhost:8002";

/**
 * Call Python plant identification microservice and persist result in MongoDB.
 */
async function identifyAndLogPlant(imagePath, imageId = null) {
    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found at path: ${imagePath}`);
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(imagePath));

    const { data } = await axios.post(`${PLANT_ID_SERVICE_URL}/identify`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
    });

    const filename = path.basename(imagePath);
    const imageUrl = `/uploads/crops/${filename}`;

    // Calculate green index change relative to previous record
    const previousRecord = await PlantIdentification.findOne().sort({ createdAt: -1 });
    const currentGreenIndex = Number(data.greenIndex || 0);
    const previousGreenIndex = previousRecord ? Number(previousRecord.greenIndex || 0) : currentGreenIndex;
    const greenIndexChange = Number((currentGreenIndex - previousGreenIndex).toFixed(2));

    const record = await PlantIdentification.create({
        commonName: data.commonName || "Unknown Plant",
        scientificName: data.scientificName || "",
        confidence: data.confidence > 1 ? Number(data.confidence) : Number(((data.confidence || 0) * 100).toFixed(1)),
        family: data.family || "",
        genus: data.genus || "",
        gbifTaxonomy: data.gbifTaxonomy || {},
        perenual: data.perenual || {},
        greenIndex: currentGreenIndex,
        greenIndexChange: greenIndexChange,
        imageUrl: imageUrl,
        imagePath: imagePath,
        imageId: imageId,
        timestamp: new Date()
    });

    return {
        id: record._id,
        commonName: record.commonName,
        scientificName: record.scientificName,
        confidence: record.confidence,
        family: record.family,
        genus: record.genus,
        gbifTaxonomy: record.gbifTaxonomy,
        perenual: record.perenual,
        greenIndex: record.greenIndex,
        greenIndexChange: record.greenIndexChange,
        imageUrl: record.imageUrl,
        processingMs: data.processing_ms || 0,
        timestamp: record.timestamp
    };
}

async function getLatestPlantIdentification() {
    return PlantIdentification.findOne().sort({ createdAt: -1 });
}

async function getPlantIdentificationHistory(limit = 30) {
    return PlantIdentification.find().sort({ createdAt: 1 }).limit(Number(limit));
}

module.exports = {
    identifyAndLogPlant,
    getLatestPlantIdentification,
    getPlantIdentificationHistory
};
