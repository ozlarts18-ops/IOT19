const IrrigationEvent =
    require("../models/IrrigationEvent");

const DeviceConfig =
    require("../models/DeviceConfig");

const thresholds =
    require("../config/thresholds");


// =====================================================
// START IRRIGATION
// =====================================================

async function startIrrigation({
    soilMoisture = null,
    waterLevel = null,
    mode = "AUTO",
    reason = "Manual irrigation"
} = {}) {

    // =================================================
    // WATER SAFETY
    // =================================================

    if (
        waterLevel !== null &&
        Number(waterLevel) <
            thresholds.waterLevel.minimum
    ) {

        return {

            success: false,

            message:
                "Water level is too low. Irrigation cannot start.",

            event: null

        };
    }


    // =================================================
    // FIND / CREATE PUMP
    // =================================================

    let pump =
        await DeviceConfig.findOne({
            deviceType: "PUMP"
        });


    if (!pump) {

        pump =
            await DeviceConfig.create({

                deviceName:
                    "Water Pump",

                deviceType:
                    "PUMP",

                state:
                    false,

                mode:
                    mode

            });
    }


    // =================================================
    // ALREADY RUNNING
    // =================================================

    if (pump.state) {

        return {

            success: true,

            message:
                "Irrigation already running",

            event: null

        };
    }


    // =================================================
    // SOIL MOISTURE SAFETY
    // =================================================

    if (
        soilMoisture !== null &&
        Number(soilMoisture) >=
            thresholds.soilMoisture.stopIrrigation
    ) {

        return {

            success: false,

            message:
                "Soil already has enough moisture",

            event: null

        };
    }


    // =================================================
    // START PUMP
    // =================================================

    pump.state = true;

    pump.mode = mode;

    pump.lastChanged =
        new Date();

    await pump.save();


    // =================================================
    // CREATE IRRIGATION EVENT
    // =================================================

    const event =
        await IrrigationEvent.create({

            soilMoistureBefore:
                soilMoisture,

            mode,

            reason,

            startTime:
                new Date(),

            status:
                "RUNNING"

        });


    return {

        success: true,

        message:
            "Irrigation started",

        event

    };
}


// =====================================================
// STOP IRRIGATION
// =====================================================

async function stopIrrigation({
    soilMoisture = null,
    waterUsedLitres = 0
} = {}) {

    const pump =
        await DeviceConfig.findOne({
            deviceType: "PUMP"
        });


    if (
        !pump ||
        !pump.state
    ) {

        return {

            success: true,

            message:
                "Irrigation already stopped"

        };
    }


    pump.state = false;

    pump.lastChanged =
        new Date();

    await pump.save();


    // =================================================
    // COMPLETE RUNNING EVENT
    // =================================================

    const event =
        await IrrigationEvent
            .findOne({
                status: "RUNNING"
            })
            .sort({
                startTime: -1
            });


    if (event) {

        event.endTime =
            new Date();


        event.durationMinutes =
            Math.max(
                0,
                (
                    event.endTime -
                    event.startTime
                ) / 60000
            );


        event.soilMoistureAfter =
            soilMoisture;


        event.waterUsedLitres =
            Number(
                waterUsedLitres || 0
            );


        event.status =
            "COMPLETED";


        await event.save();
    }


    return {

        success: true,

        message:
            "Irrigation stopped",

        event

    };
}


// =====================================================
// GET IRRIGATION STATUS
// =====================================================

async function getIrrigationStatus() {

    const pump =
        await DeviceConfig.findOne({
            deviceType: "PUMP"
        });


    return {

        state:
            pump
                ? pump.state
                : false,

        mode:
            pump
                ? pump.mode
                : "AUTO"

    };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    startIrrigation,

    stopIrrigation,

    getIrrigationStatus

};