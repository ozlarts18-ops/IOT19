const express = require("express");
const router = express.Router();

const CropGrowth = require("../models/CropGrowth");

const {
    calculateGrowth,
    getGrowthHistory,
    getLatestGrowth
} = require("../services/cropGrowthService");


// =====================================================
// GET LATEST CROP GROWTH
// GET /api/crop-growth
// =====================================================

router.get("/", async (req, res) => {
    try {
        const latest = await getLatestGrowth();

        if (!latest) {
            return res.status(404).json({
                success: false,
                message: "No crop growth data found"
            });
        }

        res.status(200).json({
            success: true,
            data: latest
        });

    } catch (error) {
        console.error("Crop growth GET error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch crop growth data",
            error: error.message
        });
    }
});


// =====================================================
// GET CROP GROWTH HISTORY
// GET /api/crop-growth/history
// =====================================================

router.get("/history", async (req, res) => {
    try {
        const history = await getGrowthHistory();

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error("Crop growth history error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch crop growth history",
            error: error.message
        });
    }
});


// =====================================================
// GET CALCULATED GROWTH
// GET /api/crop-growth/calculate
// =====================================================

router.get("/calculate", async (req, res) => {
    try {
        const result = await calculateGrowth();

        res.status(200).json(result);

    } catch (error) {
        console.error("Crop growth calculation error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to calculate crop growth",
            error: error.message
        });
    }
});


// =====================================================
// CREATE CROP GROWTH RECORD
// POST /api/crop-growth
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            imageUrl,
            date,
            time,
            dayNumber,

            plantHeight,
            previousHeight,

            leafCount,
            previousLeafCount,

            leafArea,
            averageLeafSize,

            growthRate,
            growthPercentage,

            growthSinceDay1,
            heightSinceDay1,
            leavesSinceDay1,
            leafAreaSinceDay1,

            plantSize,
            previousPlantSize,
            plantSizeChange,

            growthStage,
            growthHealth
        } = req.body;


        const height = Number(plantHeight || 0);
        const oldHeight = Number(previousHeight || 0);

        const leaves = Number(leafCount || 0);
        const oldLeaves = Number(previousLeafCount || 0);


        const calculatedHeightGrowth =
            height - oldHeight;


        const calculatedNewLeaves =
            Math.max(0, leaves - oldLeaves);


        let calculatedGrowthPercentage = 0;

        if (oldHeight > 0) {
            calculatedGrowthPercentage =
                (calculatedHeightGrowth / oldHeight) * 100;
        }


        const cropGrowth = new CropGrowth({

            imageUrl: imageUrl || "",

            date: date || new Date(),

            time:
                time ||
                new Date().toLocaleTimeString(),

            dayNumber:
                Number(dayNumber || 1),


            plantHeight: height,

            previousHeight: oldHeight,

            heightGrowth:
                calculatedHeightGrowth,

            growthRate:
                Number(growthRate || 0),


            leafCount: leaves,

            previousLeafCount: oldLeaves,

            newLeaves:
                calculatedNewLeaves,

            leafArea:
                Number(leafArea || 0),

            averageLeafSize:
                Number(averageLeafSize || 0),


            growthPercentage:
                growthPercentage !== undefined
                    ? Number(growthPercentage)
                    : calculatedGrowthPercentage,


            growthSinceDay1:
                Number(growthSinceDay1 || 0),

            heightSinceDay1:
                Number(heightSinceDay1 || 0),

            leavesSinceDay1:
                Number(leavesSinceDay1 || 0),

            leafAreaSinceDay1:
                Number(leafAreaSinceDay1 || 0),


            plantSize:
                plantSize || "Small",

            previousPlantSize:
                previousPlantSize || "Small",

            plantSizeChange:
                plantSizeChange || "0%",


            growthStage:
                growthStage || "Seedling",

            growthHealth:
                growthHealth || "Healthy Growth"
        });


        const saved = await cropGrowth.save();


        res.status(201).json({
            success: true,
            message: "Crop growth data saved successfully",
            data: saved
        });

    } catch (error) {
        console.error("Crop growth POST error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save crop growth data",
            error: error.message
        });
    }
});


// =====================================================
// DELETE CROP GROWTH RECORD
// DELETE /api/crop-growth/:id
// =====================================================

router.delete("/:id", async (req, res) => {
    try {

        const deleted =
            await CropGrowth.findByIdAndDelete(
                req.params.id
            );


        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Crop growth record not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Crop growth record deleted successfully"
        });

    } catch (error) {

        console.error(
            "Crop growth DELETE error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete crop growth record",
            error: error.message
        });
    }
});


module.exports = router;