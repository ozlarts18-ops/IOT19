const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const PestDetection = require("../models/PestDetection");

const MODEL_URL = process.env.PEST_MODEL_URL || "http://localhost:8001";

function severityFromDetections(detections) {
    if (!detections || !detections.length) {
        return "NONE";
    }
    const maxConf = Math.max(...detections.map(d => d.confidence || 0));
    if (detections.length >= 5 || maxConf >= 0.85) {
        return "HIGH";
    }
    if (detections.length >= 2 || maxConf >= 0.6) {
        return "MEDIUM";
    }
    return "LOW";
}

async function runInference(imagePath, confThreshold = 0.35) {
    const form = new FormData();
    form.append("file", fs.createReadStream(imagePath));

    const url = confThreshold !== undefined 
        ? `${MODEL_URL}/predict?conf=${encodeURIComponent(confThreshold)}`
        : `${MODEL_URL}/predict`;

    const { data } = await axios.post(url, form, {
        headers: form.getHeaders(),
        timeout: 30000,
    });
    return data;
}

async function getModelInfo() {
    try {
        const { data } = await axios.get(`${MODEL_URL}/model-info`, { timeout: 5000 });
        return data;
    } catch (e) {
        return {
            success: false,
            model_name: "best (1).pt",
            model_file: "best (1).pt",
            architecture: "Ultralytics YOLO11s",
            total_classes: 102,
            status: "OFFLINE",
            error: e.message
        };
    }
}

async function detectAndLog(imagePath, confThreshold = 0.35) {
    const result = await runInference(imagePath, confThreshold);
    const detections = result.detections || [];
    const severity = severityFromDetections(detections);
    const topDetection = result.top_detection || (detections.length ? detections[0] : null);

    const topPestName = topDetection ? topDetection.class_name : "None";
    const topConfidence = topDetection ? topDetection.confidence : 0;
    const modelName = result.model_name || "best (1).pt";

    // Relative web URL for uploads
    const filename = path.basename(imagePath);
    const imageUrl = `/uploads/pests/${filename}`;

    const record = await PestDetection.create({
        pestType: topPestName,
        topPest: topPestName,
        confidence: topConfidence > 1 ? topConfidence : Math.round(topConfidence * 100),
        pestCount: detections.length,
        severity: severity,
        detections: detections,
        imagePath: imagePath,
        imageUrl: imageUrl,
        modelName: modelName,
        status: detections.length ? "DETECTED" : "NOT_DETECTED",
        detectedAt: new Date()
    });

    return {
        detectedPest: topPestName,
        confidence: topConfidence,
        severity: severity,
        allDetections: detections,
        annotatedImage: result.annotated_image || null,
        inferenceMs: result.inference_ms || 0,
        pestCount: detections.length,
        imageUrl: imageUrl,
        modelName: modelName,
        thresholdUsed: result.threshold_used || confThreshold,
        recordId: record._id
    };
}

async function getRecentPests(limit = 20) {
    return PestDetection.find()
        .sort({ detectedAt: -1 })
        .limit(Number(limit));
}

module.exports = {
    detectAndLog,
    runInference,
    severityFromDetections,
    getRecentPests,
    getModelInfo
};