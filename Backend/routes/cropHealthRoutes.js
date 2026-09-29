const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const CropHealth = require("../models/CropHealth");
const { diagnoseAndSave, getDiseaseModelInfo } = require("../services/cropDiseaseService");

// Multer storage for uploaded crop disease images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/crops"));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || ".jpg";
        const uniqueName = "crop-disease-" + Date.now() + "-" + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeHealth(doc) {
    if (!doc) {
        return {
            health: 0,
            healthScore: 0,
            status: "UNKNOWN",
            diagnosis: "ANALYZING",
            crop: "None",
            disease: "Analyzing",
            confidence: 0,
            modelName: "plant_disease_model.pt",
            treatment: "",
            topDetections: [],
            imageUrl: ""
        };
    }

    const score = toNumber(
        doc.healthScore ?? doc.health ?? doc.score,
        0
    );

    return {
        health: score,
        healthScore: score,
        status: doc.status || doc.healthStatus || "UNKNOWN",
        diagnosis:
            doc.diagnosis ||
            doc.disease ||
            doc.result ||
            doc.prediction ||
            "ANALYZING",
        crop: doc.crop || "",
        disease: doc.disease || "",
        confidence: doc.confidence || 0,
        modelName: doc.modelName || "plant_disease_model.pt",
        treatment: doc.treatment || "",
        topDetections: doc.topDetections || [],
        imageUrl: doc.imageUrl || "",
        createdAt: doc.createdAt
    };
}


// ============================================================
// GET PLANT DISEASE MODEL METADATA (plant_disease_model.pt)
// GET /api/crop-health/model-info
// ============================================================

router.get("/model-info", async (req, res) => {
    try {
        const info = await getDiseaseModelInfo();
        return res.status(200).json({
            success: true,
            model: info
        });
    } catch (error) {
        console.error("GET /api/crop-health/model-info error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch disease model info",
            error: error.message
        });
    }
});


// ============================================================
// DIAGNOSE CROP DISEASE (plant_disease_model.pt ResNet-18)
// POST /api/crop-health/diagnose
// ============================================================

router.post("/diagnose", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No crop image uploaded for disease diagnosis"
            });
        }

        const diagnosis = await diagnoseAndSave(req.file.path);

        return res.status(200).json({
            success: true,
            message: "Plant disease diagnosis completed",
            model: diagnosis.model_name || "plant_disease_model.pt",
            data: diagnosis
        });

    } catch (error) {
        console.error("POST /api/crop-health/diagnose error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Plant disease diagnosis failed",
            error: error.message
        });
    }
});


// ============================================================
// GET LATEST CROP HEALTH
// GET /api/crop-health/latest
// ============================================================

router.get("/latest", async (req, res) => {
    try {
        const health = await CropHealth.findOne()
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            data: normalizeHealth(health)
        });
    } catch (error) {
        console.error("Latest crop health error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch latest crop health",
            error: error.message
        });
    }
});


// ============================================================
// GET ALL CROP HEALTH RECORDS
// GET /api/crop-health
// ============================================================

router.get("/", async (req, res) => {
    try {
        const health = await CropHealth.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return res.json({
            success: true,
            count: health.length,
            data: health.map(normalizeHealth)
        });
    } catch (error) {
        console.error("Crop health history error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch crop health history",
            error: error.message
        });
    }
});


// ============================================================
// MANUAL CROP HEALTH CREATION
// POST /api/crop-health
// ============================================================

router.post("/", async (req, res) => {
    try {
        const body = req.body || {};

        const score = toNumber(
            body.healthScore ?? body.health ?? body.score,
            0
        );

        if (score < 0 || score > 100) {
            return res.status(400).json({
                success: false,
                message: "Health score must be between 0 and 100"
            });
        }

        const cropHealth = await CropHealth.create({
            health: score,
            healthScore: score,
            status:
                body.status ||
                body.healthStatus ||
                "UNKNOWN",
            diagnosis:
                body.diagnosis ||
                body.disease ||
                body.result ||
                body.prediction ||
                "ANALYZING",
            crop: body.crop || "",
            disease: body.disease || "",
            confidence: body.confidence || 0,
            modelName: body.modelName || "plant_disease_model.pt",
            treatment: body.treatment || "",
            imageUrl: body.imageUrl || ""
        });

        return res.status(201).json({
            success: true,
            message: "Crop health saved successfully",
            data: normalizeHealth(cropHealth.toObject())
        });
    } catch (error) {
        console.error("Save crop health error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to save crop health",
            error: error.message
        });
    }
});

module.exports = router;
