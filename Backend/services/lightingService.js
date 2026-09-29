const DeviceConfig = require("../models/DeviceConfig");
const LightHistory = require("../models/LightHistory");
const thresholds = require("../config/thresholds");


async function processLightData(
    lightIntensity,
    mode = "AUTO"
) {

    let light = await DeviceConfig.findOne({
        deviceType: "GROW_LIGHT"
    });

    if (!light) {

        light = await DeviceConfig.create({
            deviceName: "Grow Light",
            deviceType: "GROW_LIGHT",
            state: false,
            mode: mode
        });
    }


    let shouldTurnOn = false;

    if (
        mode === "AUTO" &&
        lightIntensity <
        thresholds.light.minimum
    ) {
        shouldTurnOn = true;
    }


    if (
        mode === "AUTO" &&
        lightIntensity >=
        thresholds.light.minimum
    ) {
        shouldTurnOn = false;
    }


    light.state = shouldTurnOn;
    light.mode = mode;
    light.lastChanged = new Date();

    await light.save();


    await LightHistory.create({
        lightIntensity,
        requiredLight:
            thresholds.light.minimum,
        growLight: shouldTurnOn,
        mode
    });


    return {
        lightIntensity,
        growLight: shouldTurnOn,
        mode
    };
}


async function setGrowLight(state, mode = "MANUAL") {

    let light = await DeviceConfig.findOne({
        deviceType: "GROW_LIGHT"
    });

    if (!light) {

        light = await DeviceConfig.create({
            deviceName: "Grow Light",
            deviceType: "GROW_LIGHT"
        });
    }

    light.state = Boolean(state);
    light.mode = mode;
    light.lastChanged = new Date();

    await light.save();

    return light;
}


module.exports = {
    processLightData,
    setGrowLight
};