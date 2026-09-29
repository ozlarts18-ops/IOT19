const express = require("express");
const router = express.Router();

const CropGrowth = require("../models/CropGrowth");

// =====================================================
// GET LATEST CROP GROWTH
// GET /api/crop-growth
// =====================================================

router.get("/", async (req, res) => {

    try {

        const latest = await CropGrowth
            .findOne()
            .sort({ createdAt: -1 });

        if (!latest) {

            return res.status(404).json({
                success: false,
                message: "No crop growth data found"
            });

        }

        // ---------------------------------------------
        // FIND DAY 1 RECORD
        // ---------------------------------------------

        const day1 = await CropGrowth
            .findOne({
                dayNumber: 1
            })
            .sort({ createdAt: 1 });


        // ---------------------------------------------
        // CALCULATE DAY 1 COMPARISON
        // ---------------------------------------------

        if (day1) {

            const currentHeight =
                Number(latest.plantHeight || 0);

            const day1Height =
                Number(day1.plantHeight || 0);

            const currentLeaves =
                Number(latest.leafCount || 0);

            const day1Leaves =
                Number(day1.leafCount || 0);

            const currentLeafArea =
                Number(latest.leafArea || 0);

            const day1LeafArea =
                Number(day1.leafArea || 0);


            // Height increase
            const heightIncrease =
                currentHeight - day1Height;


            // Leaf increase
            const leafIncrease =
                currentLeaves - day1Leaves;


            // Leaf area increase
            const leafAreaIncrease =
                currentLeafArea - day1LeafArea;


            // Growth percentage from Day 1
            let growthSinceDay1 = 0;

            if (day1Height > 0) {

                growthSinceDay1 =
                    (
                        heightIncrease /
                        day1Height
                    ) * 100;

            }


            // -----------------------------------------
            // UPDATE VALUES IN DATABASE
            // -----------------------------------------

            latest.growthSinceDay1 =
                Number(
                    growthSinceDay1.toFixed(2)
                );

            latest.heightSinceDay1 =
                Number(
                    heightIncrease.toFixed(2)
                );

            latest.leavesSinceDay1 =
                Number(
                    leafIncrease
                );

            latest.leafAreaSinceDay1 =
                Number(
                    leafAreaIncrease.toFixed(2)
                );


            await latest.save();

        }


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        res.status(200).json({

            success: true,

            data: latest

        });

    }
    catch (error) {

        console.error(
            "Crop growth GET error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch crop growth data",

            error:
                error.message

        });

    }

});


// =====================================================
// GET ALL CROP GROWTH RECORDS
// GET /api/crop-growth/all
// =====================================================

router.get("/all", async (req, res) => {

    try {

        const crops =
            await CropGrowth
                .find()
                .sort({ dayNumber: 1 });


        res.status(200).json({

            success: true,

            count:
                crops.length,

            data:
                crops

        });

    }
    catch (error) {

        console.error(
            "Get all crop growth error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch crop growth records",

            error:
                error.message

        });

    }

});


// =====================================================
// GET CROP GROWTH HISTORY
// GET /api/crop-growth/history
// =====================================================

router.get("/history", async (req, res) => {

    try {

        const history =
            await CropGrowth
                .find()
                .sort({ createdAt: -1 })
                .limit(100);


        res.status(200).json({

            success: true,

            count:
                history.length,

            data:
                history

        });

    }
    catch (error) {

        console.error(
            "Crop growth history error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch crop growth history",

            error:
                error.message

        });

    }

});


// =====================================================
// GET CROP GROWTH STATISTICS
// GET /api/crop-growth/statistics
// =====================================================

router.get("/statistics", async (req, res) => {

    try {

        const records =
            await CropGrowth.find();


        if (records.length === 0) {

            return res.status(200).json({

                success: true,

                data: {

                    plantHeight: {
                        min: 0,
                        max: 0,
                        average: 0
                    },

                    leafCount: {
                        min: 0,
                        max: 0,
                        average: 0
                    },

                    growthRate: {
                        min: 0,
                        max: 0,
                        average: 0
                    }

                }

            });

        }


        const heights =
            records
                .map(item =>
                    Number(item.plantHeight)
                )
                .filter(value =>
                    Number.isFinite(value)
                );


        const leaves =
            records
                .map(item =>
                    Number(item.leafCount)
                )
                .filter(value =>
                    Number.isFinite(value)
                );


        const growthRates =
            records
                .map(item =>
                    Number(item.growthRate)
                )
                .filter(value =>
                    Number.isFinite(value)
                );


        const average = values => {

            if (values.length === 0) {

                return 0;

            }


            return Number(

                (
                    values.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    )
                    /
                    values.length
                ).toFixed(2)

            );

        };


        res.status(200).json({

            success: true,

            data: {

                plantHeight: {

                    min:
                        heights.length
                            ? Math.min(...heights)
                            : 0,

                    max:
                        heights.length
                            ? Math.max(...heights)
                            : 0,

                    average:
                        average(heights)

                },


                leafCount: {

                    min:
                        leaves.length
                            ? Math.min(...leaves)
                            : 0,

                    max:
                        leaves.length
                            ? Math.max(...leaves)
                            : 0,

                    average:
                        average(leaves)

                },


                growthRate: {

                    min:
                        growthRates.length
                            ? Math.min(...growthRates)
                            : 0,

                    max:
                        growthRates.length
                            ? Math.max(...growthRates)
                            : 0,

                    average:
                        average(growthRates)

                }

            }

        });

    }
    catch (error) {

        console.error(
            "Crop growth statistics error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to calculate crop growth statistics",

            error:
                error.message

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

            heightGrowth,


            leafCount,

            previousLeafCount,

            newLeaves,


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


        // ---------------------------------------------
        // BASIC VALUES
        // ---------------------------------------------

        const currentHeight =
            Number(plantHeight || 0);

        const oldHeight =
            Number(previousHeight || 0);

        const currentLeaves =
            Number(leafCount || 0);

        const oldLeaves =
            Number(previousLeafCount || 0);


        // ---------------------------------------------
        // HEIGHT GROWTH
        // ---------------------------------------------

        const calculatedHeightGrowth =
            currentHeight - oldHeight;


        // ---------------------------------------------
        // NEW LEAVES
        // ---------------------------------------------

        const calculatedNewLeaves =
            Math.max(
                0,
                currentLeaves - oldLeaves
            );


        // ---------------------------------------------
        // GROWTH PERCENTAGE
        // ---------------------------------------------

        let calculatedGrowthPercentage = 0;


        if (oldHeight > 0) {

            calculatedGrowthPercentage =
                (
                    calculatedHeightGrowth /
                    oldHeight
                ) * 100;

        }


        // ---------------------------------------------
        // FIND DAY 1
        // ---------------------------------------------

        const day1 =
            await CropGrowth
                .findOne({
                    dayNumber: 1
                })
                .sort({ createdAt: 1 });


        // ---------------------------------------------
        // DAY 1 VALUES
        // ---------------------------------------------

        let calculatedGrowthSinceDay1 = 0;

        let calculatedHeightSinceDay1 = 0;

        let calculatedLeavesSinceDay1 = 0;

        let calculatedLeafAreaSinceDay1 = 0;


        if (day1) {

            const day1Height =
                Number(
                    day1.plantHeight || 0
                );

            const day1Leaves =
                Number(
                    day1.leafCount || 0
                );

            const day1LeafArea =
                Number(
                    day1.leafArea || 0
                );


            // Height increase
            calculatedHeightSinceDay1 =
                currentHeight -
                day1Height;


            // Leaf increase
            calculatedLeavesSinceDay1 =
                currentLeaves -
                day1Leaves;


            // Leaf area increase
            calculatedLeafAreaSinceDay1 =
                Number(
                    (
                        Number(leafArea || 0) -
                        day1LeafArea
                    ).toFixed(2)
                );


            // Growth percentage
            if (day1Height > 0) {

                calculatedGrowthSinceDay1 =
                    (
                        calculatedHeightSinceDay1 /
                        day1Height
                    ) * 100;

            }

        }


        // ---------------------------------------------
        // CREATE RECORD
        // ---------------------------------------------

        const cropGrowth =
            new CropGrowth({

                imageUrl:
                    imageUrl || "",


                date:
                    date || new Date(),


                time:
                    time ||
                    new Date().toLocaleTimeString(),


                dayNumber:
                    Number(dayNumber || 1),


                // -------------------------------------
                // HEIGHT
                // -------------------------------------

                plantHeight:
                    currentHeight,


                previousHeight:
                    oldHeight,


                heightGrowth:

                    heightGrowth !== undefined

                        ? Number(heightGrowth)

                        : calculatedHeightGrowth,


                growthRate:
                    Number(growthRate || 0),


                // -------------------------------------
                // LEAVES
                // -------------------------------------

                leafCount:
                    currentLeaves,


                previousLeafCount:
                    oldLeaves,


                newLeaves:

                    newLeaves !== undefined

                        ? Number(newLeaves)

                        : calculatedNewLeaves,


                // -------------------------------------
                // LEAF AREA
                // -------------------------------------

                leafArea:
                    Number(leafArea || 0),


                averageLeafSize:
                    Number(
                        averageLeafSize || 0
                    ),


                // -------------------------------------
                // GROWTH %
                // -------------------------------------

                growthPercentage:

                    growthPercentage !== undefined

                        ? Number(growthPercentage)

                        : Number(
                            calculatedGrowthPercentage
                                .toFixed(2)
                        ),


                // -------------------------------------
                // DAY 1 COMPARISON
                // -------------------------------------

                growthSinceDay1:

                    day1
                        ? Number(
                            calculatedGrowthSinceDay1
                                .toFixed(2)
                        )
                        : Number(
                            growthSinceDay1 || 0
                        ),


                heightSinceDay1:

                    day1
                        ? Number(
                            calculatedHeightSinceDay1
                                .toFixed(2)
                        )
                        : Number(
                            heightSinceDay1 || 0
                        ),


                leavesSinceDay1:

                    day1
                        ? Number(
                            calculatedLeavesSinceDay1
                        )
                        : Number(
                            leavesSinceDay1 || 0
                        ),


                leafAreaSinceDay1:

                    day1
                        ? Number(
                            calculatedLeafAreaSinceDay1
                        )
                        : Number(
                            leafAreaSinceDay1 || 0
                        ),


                // -------------------------------------
                // PLANT SIZE
                // -------------------------------------

                plantSize:
                    plantSize || "Small",


                previousPlantSize:
                    previousPlantSize || "Small",


                plantSizeChange:
                    plantSizeChange || "0%",


                // -------------------------------------
                // STAGE
                // -------------------------------------

                growthStage:
                    growthStage || "Seedling",


                growthHealth:
                    growthHealth || "Healthy Growth"

            });


        const saved =
            await cropGrowth.save();


        res.status(201).json({

            success: true,

            message:
                "Crop growth data saved successfully",

            data:
                saved

        });

    }
    catch (error) {

        console.error(
            "Crop growth POST error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to save crop growth data",

            error:
                error.message

        });

    }

});


// =====================================================
// UPDATE CROP GROWTH RECORD
// PUT /api/crop-growth/:id
// =====================================================

router.put("/:id", async (req, res) => {

    try {

        const updated =
            await CropGrowth.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!updated) {

            return res.status(404).json({

                success: false,

                message:
                    "Crop growth record not found"

            });

        }


        res.status(200).json({

            success: true,

            message:
                "Crop growth record updated successfully",

            data:
                updated

        });

    }
    catch (error) {

        console.error(
            "Crop growth PUT error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to update crop growth record",

            error:
                error.message

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

                message:
                    "Crop growth record not found"

            });

        }


        res.status(200).json({

            success: true,

            message:
                "Crop growth record deleted successfully"

        });

    }
    catch (error) {

        console.error(
            "Crop growth DELETE error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to delete crop growth record",

            error:
                error.message

        });

    }

});


// =====================================================
// PLANT IDENTIFICATION & CARE ROUTES
// =====================================================

const multer = require("multer");
const path = require("path");
const {
    identifyAndLogPlant,
    getLatestPlantIdentification,
    getPlantIdentificationHistory
} = require("../services/plantIdService");

const cropStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/crops"));
    },
    filename: function (req, file, cb) {
        const uniqueName = "plant-" + Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const uploadCrop = multer({ storage: cropStorage });

// POST /api/crop-growth/identify
router.post("/identify", uploadCrop.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided for plant identification"
            });
        }

        const result = await identifyAndLogPlant(req.file.path);
        res.status(200).json({
            success: true,
            message: "Plant identified successfully",
            data: result
        });
    } catch (error) {
        console.error("Plant identification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to identify plant",
            error: error.message
        });
    }
});

// GET /api/crop-growth/identification/latest
router.get("/identification/latest", async (req, res) => {
    try {
        const latest = await getLatestPlantIdentification();
        if (!latest) {
            return res.status(404).json({
                success: false,
                message: "No plant identification records found"
            });
        }
        res.status(200).json({
            success: true,
            data: latest
        });
    } catch (error) {
        console.error("Get latest plant identification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch latest plant identification",
            error: error.message
        });
    }
});

// GET /api/crop-growth/identification/history
router.get("/identification/history", async (req, res) => {
    try {
        const limit = req.query.limit || 30;
        const history = await getPlantIdentificationHistory(limit);
        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        console.error("Get plant identification history error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch plant identification history",
            error: error.message
        });
    }
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;