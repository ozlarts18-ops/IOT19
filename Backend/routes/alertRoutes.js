const express = require("express");
const router = express.Router();

// IMPORTANT:
// Use the existing Alert model.
// DO NOT use mongoose.model("Alert", ...) here.
const Alert = require("../models/Alert");


// ============================================================
// GET ALL ALERTS
// GET /api/alerts
// ============================================================
router.get("/", async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("GET /api/alerts error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts",
            error: error.message
        });
    }
});


// ============================================================
// GET ACTIVE ALERTS
// GET /api/alerts/active
// ============================================================
router.get("/active", async (req, res) => {
    try {
        const alerts = await Alert.find({
            status: "ACTIVE"
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("GET /api/alerts/active error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch active alerts",
            error: error.message
        });
    }
});


// ============================================================
// GET UNREAD ALERTS
// GET /api/alerts/unread
// ============================================================
router.get("/unread", async (req, res) => {
    try {
        const alerts = await Alert.find({
            read: false
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("GET /api/alerts/unread error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch unread alerts",
            error: error.message
        });
    }
});


// ============================================================
// GET ALERT COUNT
// GET /api/alerts/count
// ============================================================
router.get("/count", async (req, res) => {
    try {
        const active = await Alert.countDocuments({
            status: "ACTIVE"
        });

        const unread = await Alert.countDocuments({
            read: false
        });

        res.status(200).json({
            success: true,
            active,
            unread
        });

    } catch (error) {
        console.error("GET /api/alerts/count error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get alert count",
            error: error.message
        });
    }
});


// ============================================================
// GET ALERT BY ID
// GET /api/alerts/:id
// ============================================================
router.get("/:id", async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            alert
        });

    } catch (error) {
        console.error("GET /api/alerts/:id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alert",
            error: error.message
        });
    }
});


// ============================================================
// CREATE ALERT
// POST /api/alerts
// ============================================================
router.post("/", async (req, res) => {
    try {
        const {
            type,
            message,
            severity,
            sensorValue,
            sensorType,
            pestType,
            confidence,
            pestCount
        } = req.body;

        if (!type || !message) {
            return res.status(400).json({
                success: false,
                message: "type and message are required"
            });
        }

        const alert = new Alert({
            type,
            message,
            severity: severity || "LOW",
            sensorValue:
                sensorValue !== undefined
                    ? sensorValue
                    : null,
            sensorType:
                sensorType || null,
            pestType:
                pestType || null,
            confidence:
                confidence !== undefined
                    ? confidence
                    : null,
            pestCount:
                pestCount !== undefined
                    ? pestCount
                    : null,
            status: "ACTIVE",
            read: false
        });

        await alert.save();

        res.status(201).json({
            success: true,
            message: "Alert created successfully",
            alert
        });

    } catch (error) {
        console.error("POST /api/alerts error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create alert",
            error: error.message
        });
    }
});


// ============================================================
// MARK ALERT AS READ
// PUT /api/alerts/:id/read
// ============================================================
router.put("/:id/read", async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            {
                read: true
            },
            {
                new: true
            }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Alert marked as read",
            alert
        });

    } catch (error) {
        console.error("PUT /api/alerts/:id/read error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to mark alert as read",
            error: error.message
        });
    }
});


// ============================================================
// MARK ALL ALERTS AS READ
// PUT /api/alerts/read-all
// ============================================================
router.put("/read-all", async (req, res) => {
    try {
        const result = await Alert.updateMany(
            {
                read: false
            },
            {
                $set: {
                    read: true
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "All alerts marked as read",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("PUT /api/alerts/read-all error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to mark all alerts as read",
            error: error.message
        });
    }
});


// ============================================================
// RESOLVE ALERT
// PUT /api/alerts/:id/resolve
// ============================================================
router.put("/:id/resolve", async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            {
                status: "RESOLVED",
                resolvedAt: new Date(),
                read: true
            },
            {
                new: true
            }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Alert resolved successfully",
            alert
        });

    } catch (error) {
        console.error(
            "PUT /api/alerts/:id/resolve error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to resolve alert",
            error: error.message
        });
    }
});


// ============================================================
// DELETE ALERT
// DELETE /api/alerts/:id
// ============================================================
router.delete("/:id", async (req, res) => {
    try {
        const alert = await Alert.findByIdAndDelete(
            req.params.id
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Alert deleted successfully",
            alert
        });

    } catch (error) {
        console.error(
            "DELETE /api/alerts/:id error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete alert",
            error: error.message
        });
    }
});


// ============================================================
// DELETE ALL RESOLVED ALERTS
// DELETE /api/alerts/resolved/all
// ============================================================
router.delete("/resolved/all", async (req, res) => {
    try {
        const result = await Alert.deleteMany({
            status: "RESOLVED"
        });

        res.status(200).json({
            success: true,
            message: "Resolved alerts deleted",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error(
            "DELETE /api/alerts/resolved/all error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete resolved alerts",
            error: error.message
        });
    }
});


module.exports = router;