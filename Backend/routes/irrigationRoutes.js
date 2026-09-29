const express = require("express");

const router = express.Router();

const {
    startIrrigation,
    stopIrrigation,
    getIrrigationStatus
} = require("../services/irrigationService");

const IrrigationEvent =
    require("../models/IrrigationEvent");


// =====================================================
// GET IRRIGATION STATUS
// GET /api/irrigation/status
// =====================================================

router.get("/status", async (req, res) => {

    try {

        const status =
            await getIrrigationStatus();

        res.status(200).json({

            success: true,

            data: status

        });

    } catch (error) {

        console.error(
            "Irrigation status error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to get irrigation status",

            error:
                error.message

        });

    }

});


// =====================================================
// START IRRIGATION
// POST /api/irrigation/on
// =====================================================

router.post("/on", async (req, res) => {

    try {

        const result =
            await startIrrigation({

                soilMoisture:
                    req.body.soilMoisture,

                waterLevel:
                    req.body.waterLevel,

                mode:
                    "MANUAL",

                reason:
                    req.body.reason ||
                    "Manual dashboard control"

            });


        if (!result.success) {

            return res.status(400).json(
                result
            );

        }


        res.status(200).json(
            result
        );

    } catch (error) {

        console.error(
            "Start irrigation error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to start irrigation",

            error:
                error.message

        });

    }

});


// =====================================================
// STOP IRRIGATION
// POST /api/irrigation/off
// =====================================================

router.post("/off", async (req, res) => {

    try {

        const result =
            await stopIrrigation({

                soilMoisture:
                    req.body.soilMoisture,

                waterUsedLitres:
                    req.body.waterUsedLitres || 0

            });


        res.status(200).json(
            result
        );

    } catch (error) {

        console.error(
            "Stop irrigation error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to stop irrigation",

            error:
                error.message

        });

    }

});


// =====================================================
// IRRIGATION HISTORY
// GET /api/irrigation/history
// =====================================================

router.get("/history", async (req, res) => {

    try {

        const limit =
            Number(req.query.limit) || 50;


        const events =
            await IrrigationEvent
                .find()
                .sort({
                    startTime: -1
                })
                .limit(limit)
                .lean();


        res.status(200).json({

            success: true,

            count: events.length,

            data: events

        });

    } catch (error) {

        console.error(
            "Irrigation history error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch irrigation history",

            error:
                error.message

        });

    }

});


module.exports = router;