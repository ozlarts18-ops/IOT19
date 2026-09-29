const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const CropHealth = require("../models/CropHealth");

const MODEL_URL = process.env.PEST_MODEL_URL || "http://localhost:8001";

async function runDiseaseInference(imagePath) {
    const form = new FormData();
    form.append("file", fs.createReadStream(imagePath));

    const { data } = await axios.post(`${MODEL_URL}/predict-disease`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
    });
    return data;
}

async function getDiseaseModelInfo() {
    try {
        const { data } = await axios.get(`${MODEL_URL}/disease/model-info`, { timeout: 5000 });
        return data;
    } catch (e) {
        return {
            success: false,
            model_name: "plant_disease_model.pt",
            architecture: "PyTorch ResNet-18",
            total_classes: 38,
            status: "OFFLINE",
            error: e.message
        };
    }
}

async function diagnoseAndSave(imagePath) {
    const result = await runDiseaseInference(imagePath);
    if (!result.success) {
        throw new Error(result.message || "Disease inference failed");
    }

    const filename = path.basename(imagePath);
    const imageUrl = `/uploads/crops/${filename}`;

    const diagnosisText = result.is_healthy 
        ? `${result.crop} — Healthy Foliage`
        : `${result.crop} — ${result.disease}`;

    const record = await CropHealth.create({
        health: result.health_score,
        healthScore: result.health_score,
        status: result.status,
        diagnosis: diagnosisText,
        crop: result.crop,
        disease: result.disease,
        confidence: Math.round(result.confidence * 100),
        modelName: result.model_name || "plant_disease_model.pt",
        treatment: result.treatment,
        topDetections: (result.top5_predictions || []).map(p => ({
            className: p.className,
            crop: p.crop,
            disease: p.disease,
            probability: p.probability
        })),
        imageUrl: imageUrl
    });

    return {
        ...result,
        healthScore: result.health_score,
        confidence: Math.round(result.confidence * 100),
        diagnosis: diagnosisText,
        recordId: record._id,
        imageUrl: imageUrl
    };
}

module.exports = {
    runDiseaseInference,
    getDiseaseModelInfo,
    diagnoseAndSave
};
