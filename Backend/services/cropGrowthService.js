const CropImage = require("../models/CropImage");
const CropGrowth = require("../models/CropGrowth");


// =====================================================
// CALCULATE CROP GROWTH
// =====================================================

async function calculateGrowth() {

    const images = await CropImage
        .find()
        .sort({ uploadedAt: -1 })
        .limit(2);

    if (images.length < 2) {

        return {
            success: false,
            message: "Not enough crop records",
            growthRate: 0
        };
    }

    const latest = images[0];
    const previous = images[1];

    const latestHeight =
        Number(latest.plantHeight || 0);

    const previousHeight =
        Number(previous.plantHeight || 0);

    const latestLeaves =
        Number(latest.leafCount || 0);

    const previousLeaves =
        Number(previous.leafCount || 0);

    const latestLeafArea =
        Number(latest.leafArea || 0);

    const previousLeafArea =
        Number(previous.leafArea || 0);


    // =================================================
    // HEIGHT
    // =================================================

    const heightDifference =
        latestHeight - previousHeight;


    const timeDifference =
        (
            new Date(latest.uploadedAt) -
            new Date(previous.uploadedAt)
        ) / 86400000;


    const growthRate =
        timeDifference > 0
            ? heightDifference / timeDifference
            : 0;


    // =================================================
    // LEAVES
    // =================================================

    const leafDifference =
        latestLeaves - previousLeaves;


    const newLeaves =
        Math.max(0, leafDifference);


    // =================================================
    // LEAF AREA
    // =================================================

    const leafAreaDifference =
        latestLeafArea - previousLeafArea;


    // =================================================
    // GROWTH PERCENTAGE
    // =================================================

    const growthPercentage =
        previousHeight > 0
            ? (
                (heightDifference /
                    previousHeight) *
                100
            )
            : 0;


    // =================================================
    // PLANT SIZE
    // =================================================

    let plantSize = "Small";

    if (latestHeight >= 50) {

        plantSize = "Large";

    } else if (latestHeight >= 25) {

        plantSize = "Medium";

    }


    // =================================================
    // GROWTH HEALTH
    // =================================================

    let growthHealth =
        "Healthy Growth";

    if (growthRate < 0) {

        growthHealth =
            "Critical";

    } else if (growthRate === 0) {

        growthHealth =
            "Poor Growth";

    } else if (growthRate < 1) {

        growthHealth =
            "Moderate Growth";

    }


    // =================================================
    // GROWTH STAGE
    // =================================================

    let growthStage =
        latest.growthStage ||
        "Seedling";


    if (latestHeight >= 60) {

        growthStage = "Fruiting";

    } else if (latestHeight >= 40) {

        growthStage = "Flowering";

    } else if (latestHeight >= 20) {

        growthStage = "Vegetative";

    }


    // =================================================
    // DAY 1 BASELINE
    // =================================================

    const dayOne =
        await CropImage
            .findOne()
            .sort({
                uploadedAt: 1
            });


    const dayOneHeight =
        Number(
            dayOne?.plantHeight || 0
        );


    const dayOneLeaves =
        Number(
            dayOne?.leafCount || 0
        );


    const dayOneLeafArea =
        Number(
            dayOne?.leafArea || 0
        );


    const growthSinceDay1 =
        dayOneHeight > 0
            ? (
                (
                    latestHeight -
                    dayOneHeight
                ) /
                dayOneHeight
            ) * 100
            : 0;


    const heightSinceDay1 =
        latestHeight -
        dayOneHeight;


    const leavesSinceDay1 =
        latestLeaves -
        dayOneLeaves;


    const leafAreaSinceDay1 =
        latestLeafArea -
        dayOneLeafArea;


    // =================================================
    // RESULT
    // =================================================

    return {

        success: true,

        latestHeight,

        previousHeight,

        latestLeaves,

        previousLeaves,

        heightDifference,

        leafDifference,

        newLeaves,

        growthRate,

        growthPercentage,

        growthSinceDay1,

        heightSinceDay1,

        leavesSinceDay1,

        leafAreaSinceDay1,

        plantSize,

        growthStage,

        growthHealth

    };
}


// =====================================================
// GET GROWTH HISTORY
// =====================================================

async function getGrowthHistory() {

    const records =
        await CropGrowth
            .find()
            .sort({
                createdAt: 1
            });

    return records;
}


// =====================================================
// GET LATEST GROWTH
// =====================================================

async function getLatestGrowth() {

    const record =
        await CropGrowth
            .findOne()
            .sort({
                createdAt: -1
            });

    return record;
}


module.exports = {

    calculateGrowth,

    getGrowthHistory,

    getLatestGrowth

};