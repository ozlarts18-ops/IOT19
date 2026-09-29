const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const PestDetection = require("../models/PestDetection");
const { detectAndLog, getModelInfo } = require("../services/pestDetectionService");

// Configure multer storage for uploaded pest images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/pests"));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || ".jpg";
        const uniqueName = "pest-" + Date.now() + "-" + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });


// ============================================================
// GET PEST MODEL INFORMATION (best (1).pt)
// GET /api/pests/model-info
// ============================================================

router.get("/model-info", async (req, res) => {
    try {
        const info = await getModelInfo();
        res.status(200).json({
            success: true,
            model: info
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch model info",
            error: error.message
        });
    }
});


// ============================================================
// RUN AI PEST DETECTION ON IMAGE
// POST /api/pests/detect
// ============================================================

router.post("/detect", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded"
            });
        }

        const conf = req.query.conf !== undefined 
            ? parseFloat(req.query.conf) 
            : (req.body && req.body.conf ? parseFloat(req.body.conf) : 0.35);

        const result = await detectAndLog(req.file.path, conf);

        res.status(200).json({
            success: true,
            message: "Pest detection completed",
            model: result.modelName || "best (1).pt",
            data: result
        });

    } catch (error) {
        console.error("POST /api/pests/detect error:", error.message);

        res.status(500).json({
            success: false,
            message: "Pest detection failed",
            error: error.message
        });
    }
});


// ============================================================
// GET ALL PEST DETECTIONS
// GET /api/pests
// ============================================================

router.get("/", async (req, res) => {
    try {
        const pests = await PestDetection
            .find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pests.length,
            pests
        });

    } catch (error) {
        console.error("GET /api/pests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pest detections",
            error: error.message
        });
    }
});


// ============================================================
// GET LATEST PEST DETECTION
// GET /api/pests/latest
// ============================================================

router.get("/latest", async (req, res) => {
    try {
        const pest = await PestDetection
            .findOne()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            pest
        });

    } catch (error) {
        console.error("GET /api/pests/latest error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch latest pest detection",
            error: error.message
        });
    }
});


// ============================================================
// GET PEST DETECTIONS BY TYPE
// GET /api/pests/type/:type
// ============================================================

router.get("/type/:type", async (req, res) => {
    try {
        const pests = await PestDetection
            .find({
                $or: [
                    { pestType: req.params.type },
                    { topPest: req.params.type }
                ]
            })
            .sort({
                createdAt: -1
            });

        res.status(200).json({
            success: true,
            count: pests.length,
            pests
        });

    } catch (error) {
        console.error("GET /api/pests/type error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pest type",
            error: error.message
        });
    }
});


// ============================================================
// CREATE PEST DETECTION MANUALLY
// POST /api/pests
// ============================================================

router.post("/", async (req, res) => {
    try {
        const {
            pestType,
            topPest,
            confidence,
            pestCount,
            severity,
            imageUrl,
            status
        } = req.body;

        const name = pestType || topPest || "Unknown";

        const pest = new PestDetection({
            pestType: name,
            topPest: name,
            confidence: confidence !== undefined ? confidence : 0,
            pestCount: pestCount !== undefined ? pestCount : 0,
            severity: severity || "LOW",
            imageUrl: imageUrl || null,
            status: status || "DETECTED"
        });

        await pest.save();

        res.status(201).json({
            success: true,
            message: "Pest detection created successfully",
            pest
        });

    } catch (error) {
        console.error("POST /api/pests error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create pest detection",
            error: error.message
        });
    }
});


// ============================================================
// GET PEST BY ID
// GET /api/pests/:id
// ============================================================

router.get("/:id", async (req, res) => {
    try {
        const pest = await PestDetection.findById(req.params.id);

        if (!pest) {
            return res.status(404).json({
                success: false,
                message: "Pest detection not found"
            });
        }

        res.status(200).json({
            success: true,
            pest
        });

    } catch (error) {
        console.error("GET /api/pests/:id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pest detection",
            error: error.message
        });
    }
});


// ============================================================
// DELETE PEST DETECTION
// DELETE /api/pests/:id
// ============================================================

router.delete("/:id", async (req, res) => {
    try {
        const pest = await PestDetection.findByIdAndDelete(req.params.id);

        if (!pest) {
            return res.status(404).json({
                success: false,
                message: "Pest detection not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pest detection deleted successfully",
            pest
        });

    } catch (error) {
        console.error("DELETE /api/pests/:id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete pest detection",
            error: error.message
        });
    }
});


module.exports = router;