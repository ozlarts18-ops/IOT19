const thresholds = require("../config/thresholds");

const {
    startIrrigation,
    stopIrrigation
} = require("./irrigationService");


async function processSensorData(data) {

    const {
        soilMoisture,
        waterLevel
    } = data;

    if (soilMoisture === undefined) {
        return {
            action: "NONE",
            message: "Soil moisture not available"
        };
    }


    // Water tank too low
    if (
        waterLevel !== undefined &&
        waterLevel < thresholds.waterLevel.minimum
    ) {

        await stopIrrigation({
            soilMoisture
        });

        return {
            action: "STOP",
            message: "Water level too low"
        };
    }


    // Soil is dry
    if (
        soilMoisture <
        thresholds.soilMoisture.dry
    ) {

        await startIrrigation({
            soilMoisture,
            mode: "AUTO",
            reason: "Soil moisture below threshold"
        });

        return {
            action: "START",
            message: "Soil is dry. Irrigation started."
        };
    }


    // Soil sufficiently wet
    if (
        soilMoisture >=
        thresholds.soilMoisture.stopIrrigation
    ) {

        await stopIrrigation({
            soilMoisture
        });

        return {
            action: "STOP",
            message: "Soil moisture reached target."
        };
    }


    return {
        action: "NONE",
        message: "Soil moisture is normal"
    };
}


module.exports = {
    processSensorData
};