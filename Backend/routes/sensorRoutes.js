const express = require("express");
const router = express.Router();

const Sensor = require("../models/Sensor");
const IrrigationEvent = require("../models/IrrigationEvent");
const SensorHistory = require("../models/SensorHistory");
const LightHistory = require("../models/LightHistory");
const WaterHistory = require("../models/WaterHistory");

// =====================================================
// BOOLEAN HELPER
// =====================================================

function toBoolean(value, defaultValue = false) {

    if (value === undefined || value === null) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {

        return [
            "true",
            "1",
            "on",
            "yes"
        ].includes(value.toLowerCase());

    }

    return defaultValue;
}


// =====================================================
// NUMBER HELPER
// =====================================================

function number(value, defaultValue = 0) {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : defaultValue;
}


// =====================================================
// STATISTICS HELPER
// =====================================================

function calculateStats(values, ignoreZero = true) {

    let cleanValues = values
        .map(Number)
        .filter(Number.isFinite);

    if (ignoreZero) {

        cleanValues =
            cleanValues.filter(
                value => value > 0
            );

    }

    if (!cleanValues.length) {

        return {
            min: 0,
            max: 0,
            average: 0
        };

    }

    const min =
        Math.min(...cleanValues);

    const max =
        Math.max(...cleanValues);

    const average =
        cleanValues.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / cleanValues.length;

    return {

        min:
            Number(
                min.toFixed(1)
            ),

        max:
            Number(
                max.toFixed(1)
            ),

        average:
            Number(
                average.toFixed(1)
            )

    };

}


// =====================================================
// STATUS FUNCTIONS
// =====================================================

function temperatureStatus(value) {

    if (value > 35) {
        return "HIGH";
    }

    if (value < 15) {
        return "LOW";
    }

    return "NORMAL";
}


function humidityStatus(value) {

    if (value > 80) {
        return "HIGH";
    }

    if (value < 40) {
        return "LOW";
    }

    return "NORMAL";
}


function soilStatus(value) {

    if (value < 40) {
        return "DRY";
    }

    if (value > 70) {
        return "WET";
    }

    return "NORMAL";
}


function lightStatus(value, required = 700) {

    if (value < required) {
        return "LOW";
    }

    return "SUFFICIENT";
}


function waterStatus(value) {

    if (value < 10) {
        return "CRITICAL";
    }

    if (value < 20) {
        return "LOW";
    }

    return "NORMAL";
}


// =====================================================
// GET LATEST SENSOR
// GET /api/sensors/latest
// =====================================================

router.get("/latest", async (req, res) => {

    try {

        const sensor =
            await Sensor.findOne()
                .sort({
                    createdAt: -1
                });

        if (!sensor) {

            return res.status(404).json({

                success: false,

                message:
                    "No sensor data found"

            });

        }

        res.json({

            success: true,

            data:
                sensor

        });

    } catch (error) {

        console.error(
            "Latest sensor error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to fetch latest sensor data",

            error:
                error.message

        });

    }

});


// =====================================================
// GET SENSOR HISTORY
// GET /api/sensors/history
// =====================================================

router.get("/history", async (req, res) => {

    try {

        const sensors =
            await Sensor.find()
                .sort({
                    createdAt: -1
                })
                .limit(500);

        sensors.reverse();

        res.json({

            success: true,

            count:
                sensors.length,

            data:
                sensors

        });

    } catch (error) {

        console.error(
            "Sensor history error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to fetch sensor history",

            error:
                error.message

        });

    }

});


// =====================================================
// GET ALL SENSOR DATA
// GET /api/sensors
// =====================================================

router.get("/", async (req, res) => {

    try {

        const sensors =
            await Sensor.find()
                .sort({
                    createdAt: -1
                })
                .limit(500);

        res.json({

            success: true,

            count:
                sensors.length,

            data:
                sensors

        });

    } catch (error) {

        console.error(
            "All sensors error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to fetch sensors",

            error:
                error.message

        });

    }

});


// =====================================================
// COMPLETE SENSOR STATISTICS
// GET /api/sensors/statistics
// =====================================================

router.get("/statistics", async (req, res) => {

    try {

        const sensors =
            await Sensor.find()
                .sort({
                    createdAt: 1
                });

        if (!sensors.length) {

            return res.json({

                success: true,

                data: {

                    temperature: {

                        current: 0,
                        min: 0,
                        max: 0,
                        average: 0,
                        status: "NORMAL"

                    },

                    humidity: {

                        current: 0,
                        min: 0,
                        max: 0,
                        average: 0,
                        status: "NORMAL"

                    },

                    soilMoisture: {

                        current: 0,
                        min: 0,
                        max: 0,
                        average: 0,
                        status: "NORMAL"

                    },

                    light: {

                        current: 0,
                        min: 0,
                        max: 0,
                        average: 0,
                        required: 700,
                        status: "LOW",
                        growLightStatus: false

                    },

                    water: {

                        current: 0,
                        min: 0,
                        max: 0,
                        average: 0,
                        height: 0,
                        status: "CRITICAL",
                        permission: "BLOCKED"

                    },

                    irrigation: {

                        status: false,
                        pumpStatus: false,
                        mode: "AUTO",
                        duration: 0,
                        waterUsed: 0

                    },

                    automation: {

                        fanStatus: false,
                        mode: "AUTO",
                        threshold: 30,
                        lastFanActivity: null,
                        growLightStatus: false

                    },

                    crop: {

                        plantHeight: 0,
                        leafCount: 0,
                        growthRate: 0

                    }

                }

            });

        }


        const latest =
            sensors[
                sensors.length - 1
            ];


        // =================================================
        // ARRAYS
        // =================================================

        const temperatures =
            sensors
                .map(
                    s =>
                        number(
                            s.temperature
                        )
                )
                .filter(
                    v => v > 0
                );


        const humidities =
            sensors
                .map(
                    s =>
                        number(
                            s.humidity
                        )
                )
                .filter(
                    v => v > 0
                );


        const soilMoistures =
            sensors
                .map(
                    s =>
                        number(
                            s.soilMoisture
                        )
                )
                .filter(
                    v => v > 0
                );


        const lights =
            sensors
                .map(
                    s =>
                        number(
                            s.lightIntensity ??
                            s.lightLevel
                        )
                )
                .filter(
                    v => v > 0
                );


        const waterLevels =
            sensors
                .map(
                    s =>
                        number(
                            s.waterLevel
                        )
                )
                .filter(
                    v => v > 0
                );


        // =================================================
        // CURRENT VALUES
        // =================================================

        const temperature =
            number(
                latest.temperature
            );


        const humidity =
            number(
                latest.humidity
            );


        const soilMoisture =
            number(
                latest.soilMoisture
            );


        const light =
            number(
                latest.lightIntensity ??
                latest.lightLevel
            );


        const lightRequirement =
            number(
                latest.lightRequirement,
                700
            );


        const waterLevel =
            number(
                latest.waterLevel
            );


        const waterHeight =
            number(
                latest.waterHeight
            );


        // =================================================
        // FAN ACTIVITY
        // =================================================

        const fanRecords =
            sensors
                .filter(
                    s =>
                        toBoolean(
                            s.fanStatus
                        )
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt
                        ) -
                        new Date(
                            a.createdAt
                        )
                );


        const lastFanActivity =
            fanRecords.length
                ? fanRecords[0].createdAt
                : null;


        // =================================================
        // RESPONSE
        // =================================================

        res.json({

            success: true,

            data: {

                temperature: {

                    current:
                        temperature,

                    ...calculateStats(
                        temperatures
                    ),

                    status:
                        temperatureStatus(
                            temperature
                        )

                },


                humidity: {

                    current:
                        humidity,

                    ...calculateStats(
                        humidities
                    ),

                    status:
                        humidityStatus(
                            humidity
                        )

                },


                soilMoisture: {

                    current:
                        soilMoisture,

                    ...calculateStats(
                        soilMoistures
                    ),

                    status:
                        soilStatus(
                            soilMoisture
                        )

                },


                light: {

                    current:
                        light,

                    ...calculateStats(
                        lights
                    ),

                    required:
                        lightRequirement,

                    status:
                        lightStatus(
                            light,
                            lightRequirement
                        ),

                    growLightStatus:
                        toBoolean(
                            latest.growLightStatus
                        )

                },


                water: {

                    current:
                        waterLevel,

                    ...calculateStats(
                        waterLevels
                    ),

                    height:
                        waterHeight,

                    tankStatus:
                        latest.tankStatus ||
                        waterStatus(
                            waterLevel
                        ),

                    permission:
                        waterLevel >= 20
                            ? "ALLOWED"
                            : "BLOCKED",

                    lowWaterStatus:
                        waterLevel < 20,

                    lastRefill:
                        latest.lastRefill ||
                        null

                },


                irrigation: {

                    status:
                        toBoolean(
                            latest.irrigation
                        ),

                    pumpStatus:
                        toBoolean(
                            latest.pumpStatus
                        ),

                    mode:
                        latest.irrigationMode ||
                        "AUTO",

                    duration:
                        number(
                            latest.irrigationDuration
                        ),

                    waterUsed:
                        number(
                            latest.waterUsage
                        )

                },


                automation: {

                    fanStatus:
                        toBoolean(
                            latest.fanStatus
                        ),

                    mode:
                        latest.automationMode ||
                        "AUTO",

                    threshold:
                        number(
                            latest.fanThreshold,
                            30
                        ),

                    lastFanActivity,

                    growLightStatus:
                        toBoolean(
                            latest.growLightStatus
                        )

                },


                crop: {

                    plantHeight:
                        number(
                            latest.plantHeight
                        ),

                    leafCount:
                        number(
                            latest.leafCount
                        ),

                    growthRate:
                        number(
                            latest.growthRate
                        )

                }

            }

        });

    } catch (error) {

        console.error(
            "Statistics error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to calculate sensor statistics",

            error:
                error.message

        });

    }

});


// =====================================================
// LIGHT STATISTICS
// GET /api/sensors/light-statistics
// =====================================================

router.get(
    "/light-statistics",
    async (req, res) => {

        try {

            const sensors =
                await Sensor.find({

                    $or: [

                        {
                            lightIntensity: {
                                $gt: 0
                            }
                        },

                        {
                            lightLevel: {
                                $gt: 0
                            }
                        }

                    ]

                })
                .sort({
                    createdAt: 1
                });


            if (!sensors.length) {

                return res.json({

                    success: true,

                    data: {

                        current: 0,
                        min: 0,
                        max: 0,
                        average: 0,
                        required: 700,
                        status: "INSUFFICIENT",
                        growLightStatus: false,
                        dailyExposure: 0,
                        history: []

                    }

                });

            }


            const values =
                sensors
                    .map(
                        sensor =>
                            number(
                                sensor.lightIntensity ??
                                sensor.lightLevel
                            )
                    )
                    .filter(
                        v => v > 0
                    );


            const latest =
                sensors[
                    sensors.length - 1
                ];


            const current =
                number(
                    latest.lightIntensity ??
                    latest.lightLevel
                );


            const required =
                number(
                    latest.lightRequirement,
                    700
                );


            const history =
                sensors.map(
                    sensor => ({

                        createdAt:
                            sensor.createdAt,

                        lightIntensity:
                            number(
                                sensor.lightIntensity ??
                                sensor.lightLevel
                            ),

                        lightRequirement:
                            number(
                                sensor.lightRequirement,
                                700
                            ),

                        growLightStatus:
                            toBoolean(
                                sensor.growLightStatus
                            )

                    })
                );


            res.json({

                success: true,

                data: {

                    current:
                        Number(
                            current.toFixed(1)
                        ),

                    min:
                        Number(
                            Math.min(
                                ...values
                            ).toFixed(1)
                        ),

                    max:
                        Number(
                            Math.max(
                                ...values
                            ).toFixed(1)
                        ),

                    average:
                        Number(
                            (
                                values.reduce(
                                    (sum, value) =>
                                        sum + value,
                                    0
                                ) /
                                values.length
                            ).toFixed(1)
                        ),

                    required,

                    status:
                        lightStatus(
                            current,
                            required
                        ),

                    growLightStatus:
                        toBoolean(
                            latest.growLightStatus
                        ),

                    dailyExposure: 0,

                    history

                }

            });

        } catch (error) {

            console.error(
                "Light statistics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to calculate light statistics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// WATER STATISTICS
// GET /api/sensors/water-statistics
// =====================================================

router.get(
    "/water-statistics",
    async (req, res) => {

        try {

            const sensors =
                await Sensor.find()
                    .sort({
                        createdAt: 1
                    })
                    .limit(500);


            if (!sensors.length) {

                return res.json({

                    success: true,

                    data: {

                        current: 0,
                        height: 0,

                        levelStats: {

                            min: 0,
                            max: 0,
                            average: 0

                        },

                        heightStats: {

                            min: 0,
                            max: 0,
                            average: 0

                        },

                        status:
                            "CRITICAL",

                        permission:
                            "BLOCKED",

                        lowWater:
                            true,

                        lastRefill:
                            null,

                        history: [],
                        daily: [],
                        lowWaterEvents: []

                    }

                });

            }


            const latest =
                sensors[
                    sensors.length - 1
                ];


            const current =
                number(
                    latest.waterLevel
                );


            const height =
                number(
                    latest.waterHeight
                );


            // =================================================
            // WATER LEVEL
            // =================================================

            const levels =
                sensors
                    .map(
                        s =>
                            number(
                                s.waterLevel
                            )
                    )
                    .filter(
                        v => v > 0
                    );


            // =================================================
            // WATER HEIGHT
            // =================================================

            const heights =
                sensors
                    .map(
                        s =>
                            number(
                                s.waterHeight
                            )
                    )
                    .filter(
                        v => v > 0
                    );


            // =================================================
            // HISTORY
            // =================================================

            const history =
                sensors.map(
                    s => ({

                        createdAt:
                            s.createdAt,

                        waterLevel:
                            number(
                                s.waterLevel
                            ),

                        waterHeight:
                            number(
                                s.waterHeight
                            ),

                        tankStatus:
                            s.tankStatus ||
                            waterStatus(
                                number(
                                    s.waterLevel
                                )
                            ),

                        pumpPermission:
                            number(
                                s.waterLevel
                            ) >= 20

                    })
                );


            // =================================================
            // LOW WATER EVENTS
            // =================================================

            const lowWaterEvents =
                sensors
                    .filter(
                        s =>
                            number(
                                s.waterLevel
                            ) < 20
                    )
                    .map(
                        s => ({

                            createdAt:
                                s.createdAt,

                            waterLevel:
                                number(
                                    s.waterLevel
                                ),

                            status:
                                "LOW"

                        })
                    );


            // =================================================
            // DAILY
            // =================================================

            const days = {};


            sensors.forEach(
                sensor => {

                    const date =
                        new Date(
                            sensor.createdAt
                        )
                        .toISOString()
                        .split("T")[0];


                    if (!days[date]) {

                        days[date] = {

                            levels: [],
                            heights: [],
                            lowEvents: 0

                        };

                    }


                    const level =
                        number(
                            sensor.waterLevel
                        );


                    const sensorHeight =
                        number(
                            sensor.waterHeight
                        );


                    if (level > 0) {

                        days[date]
                            .levels
                            .push(level);

                    }


                    if (sensorHeight > 0) {

                        days[date]
                            .heights
                            .push(
                                sensorHeight
                            );

                    }


                    if (level < 20) {

                        days[date]
                            .lowEvents++;

                    }

                }
            );


            const daily =
                Object.entries(
                    days
                )
                .map(
                    ([date, values]) => {

                        const averageLevel =
                            values.levels.length
                                ? values.levels.reduce(
                                    (sum, value) =>
                                        sum + value,
                                    0
                                ) /
                                values.levels.length
                                : 0;


                        const averageHeight =
                            values.heights.length
                                ? values.heights.reduce(
                                    (sum, value) =>
                                        sum + value,
                                    0
                                ) /
                                values.heights.length
                                : 0;


                        return {

                            date,

                            waterLevel:
                                Number(
                                    averageLevel.toFixed(1)
                                ),

                            waterHeight:
                                Number(
                                    averageHeight.toFixed(1)
                                ),

                            lowWaterEvents:
                                values.lowEvents

                        };

                    }
                );


            res.json({

                success: true,

                data: {

                    current,

                    height,

                    levelStats:
                        calculateStats(
                            levels
                        ),

                    heightStats:
                        calculateStats(
                            heights
                        ),

                    status:
                        latest.tankStatus ||
                        waterStatus(
                            current
                        ),

                    permission:
                        current >= 20
                            ? "ALLOWED"
                            : "BLOCKED",

                    lowWater:
                        current < 20,

                    lastRefill:
                        latest.lastRefill ||
                        null,

                    history,

                    daily,

                    lowWaterEvents

                }

            });

        } catch (error) {

            console.error(
                "Water statistics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to calculate water statistics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// IRRIGATION STATISTICS
// GET /api/sensors/irrigation-statistics
// =====================================================

router.get(
    "/irrigation-statistics",
    async (req, res) => {

        try {

            const sensors =
                await Sensor.find()
                    .sort({
                        createdAt: 1
                    });


            const latest =
                sensors.length
                    ? sensors[
                        sensors.length - 1
                    ]
                    : null;


            const moistureValues =
                sensors
                    .map(
                        s =>
                            number(
                                s.soilMoisture
                            )
                    )
                    .filter(
                        v => v > 0
                    );


            let events = [];


            try {

                events =
                    await IrrigationEvent.find()
                        .sort({
                            startTime: 1
                        })
                        .limit(500);

            } catch (eventError) {

                console.warn(
                    "Irrigation events unavailable:",
                    eventError.message
                );

            }


            const totalDuration =
                events.reduce(
                    (sum, event) =>
                        sum +
                        number(
                            event.durationMinutes
                        ),
                    0
                );


            const totalWaterUsed =
                events.reduce(
                    (sum, event) =>
                        sum +
                        number(
                            event.waterUsedLitres
                        ),
                    0
                );


            res.json({

                success: true,

                data: {

                    current:
                        latest
                            ? number(
                                latest.soilMoisture
                            )
                            : 0,

                    moisture:
                        calculateStats(
                            moistureValues
                        ),

                    status:
                        latest
                            ? soilStatus(
                                number(
                                    latest.soilMoisture
                                )
                            )
                            : "NORMAL",

                    irrigation:
                        latest
                            ? toBoolean(
                                latest.irrigation
                            )
                            : false,

                    pumpStatus:
                        latest
                            ? toBoolean(
                                latest.pumpStatus
                            )
                            : false,

                    duration:
                        latest
                            ? number(
                                latest.irrigationDuration
                            )
                            : 0,

                    totalDuration,

                    waterUsed:
                        latest
                            ? number(
                                latest.waterUsage
                            )
                            : 0,

                    totalWaterUsed,

                    dryThreshold:
                        40,

                    pumpOffTarget:
                        65,

                    events

                }

            });

        } catch (error) {

            console.error(
                "Irrigation statistics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to calculate irrigation statistics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// DAILY SENSOR SUMMARY
// GET /api/sensors/daily-summary
// =====================================================

router.get(
    "/daily-summary",
    async (req, res) => {

        try {

            const sensors =
                await Sensor.find()
                    .sort({
                        createdAt: 1
                    });


            const days = {};


            sensors.forEach(
                sensor => {

                    const date =
                        new Date(
                            sensor.createdAt
                        )
                        .toISOString()
                        .split("T")[0];


                    if (!days[date]) {

                        days[date] = {

                            temperature: [],
                            humidity: [],
                            soilMoisture: [],
                            light: [],
                            waterLevel: [],
                            waterHeight: [],
                            waterUsage: [],
                            irrigationDuration: [],
                            plantHeight: [],
                            leafCount: []

                        };

                    }


                    days[date]
                        .temperature
                        .push(
                            number(
                                sensor.temperature
                            )
                        );


                    days[date]
                        .humidity
                        .push(
                            number(
                                sensor.humidity
                            )
                        );


                    days[date]
                        .soilMoisture
                        .push(
                            number(
                                sensor.soilMoisture
                            )
                        );


                    days[date]
                        .light
                        .push(
                            number(
                                sensor.lightIntensity ??
                                sensor.lightLevel
                            )
                        );


                    days[date]
                        .waterLevel
                        .push(
                            number(
                                sensor.waterLevel
                            )
                        );


                    days[date]
                        .waterHeight
                        .push(
                            number(
                                sensor.waterHeight
                            )
                        );


                    days[date]
                        .waterUsage
                        .push(
                            number(
                                sensor.waterUsage
                            )
                        );


                    days[date]
                        .irrigationDuration
                        .push(
                            number(
                                sensor.irrigationDuration
                            )
                        );


                    days[date]
                        .plantHeight
                        .push(
                            number(
                                sensor.plantHeight
                            )
                        );


                    days[date]
                        .leafCount
                        .push(
                            number(
                                sensor.leafCount
                            )
                        );

                }
            );


            function avg(values) {

                const valid =
                    values.filter(
                        value =>
                            Number.isFinite(
                                value
                            )
                    );


                if (!valid.length) {
                    return 0;
                }


                return Number(
                    (
                        valid.reduce(
                            (a, b) =>
                                a + b,
                            0
                        ) /
                        valid.length
                    ).toFixed(1)
                );

            }


            const result =
                Object.entries(
                    days
                )
                .map(
                    ([date, values]) => ({

                        date,

                        temperature:
                            avg(
                                values.temperature
                            ),

                        humidity:
                            avg(
                                values.humidity
                            ),

                        soilMoisture:
                            avg(
                                values.soilMoisture
                            ),

                        light:
                            avg(
                                values.light
                            ),

                        waterLevel:
                            avg(
                                values.waterLevel
                            ),

                        waterHeight:
                            avg(
                                values.waterHeight
                            ),

                        waterUsage:
                            Number(
                                values.waterUsage
                                    .reduce(
                                        (a, b) =>
                                            a + b,
                                        0
                                    )
                                    .toFixed(1)
                            ),

                        irrigationDuration:
                            Number(
                                values
                                    .irrigationDuration
                                    .reduce(
                                        (a, b) =>
                                            a + b,
                                        0
                                    )
                                    .toFixed(1)
                            ),

                        plantHeight:
                            values.plantHeight
                                .filter(
                                    v => v > 0
                                )
                                .pop() || 0,

                        leafCount:
                            values.leafCount
                                .filter(
                                    v => v > 0
                                )
                                .pop() || 0

                    })
                );


            res.json({

                success: true,

                count:
                    result.length,

                data:
                    result

            });

        } catch (error) {

            console.error(
                "Daily summary error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to calculate daily summary",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// RASPBERRY PI GATEWAY TELEMETRY RECEIVER
// POST /api/sensors/gateway
// =====================================================

let lastGatewayTelemetryTime = null;
let lastGatewayPayload = null;

router.post("/gateway", async (req, res) => {
    try {
        const body = req.body || {};

        // Parse light module
        const lux = number(body.lux ?? body.light?.lux ?? body.lightIntensity ?? 0);
        const lightStatus = (body.light_status || body.light?.light_status || "").toUpperCase();
        const growLightStatus = lightStatus === "ON" || toBoolean(body.growLightStatus);
        const naturalLight = body.natural_light || body.light?.natural_light || (lux >= 600 ? "Sufficient" : "Insufficient");

        // Parse climate module
        const temperature = number(body.climate?.temperature ?? body.temperature ?? 25.0);
        const humidity = number(body.climate?.humidity ?? body.humidity ?? 60.0);
        const fanStatus = (body.climate?.fan || "").toUpperCase() === "ON" || toBoolean(body.fanStatus);

        // Parse soil module
        const soilRaw = body.soil?.raw !== undefined ? number(body.soil.raw) : null;
        const soilVoltage = body.soil?.voltage !== undefined ? number(body.soil.voltage) : null;
        const soilStatus = body.soil?.soil || "UNKNOWN";
        const pumpStatus = (body.soil?.pump || "").toUpperCase() === "ON" || toBoolean(body.pumpStatus);

        // Convert ADS1115 raw values (4000 wet, 18000 dry) to moisture %
        let soilMoisture = body.soilMoisture !== undefined ? number(body.soilMoisture) : null;
        if (soilMoisture === null) {
            if (soilRaw !== null) {
                soilMoisture = Math.max(0, Math.min(100, Math.round(100 - ((soilRaw - 4000) / 14000) * 100)));
            } else if (soilStatus === "DRY") {
                soilMoisture = 28;
            } else {
                soilMoisture = 65;
            }
        }

        // Parse water tank distance (5cm full, 35cm empty)
        const distanceCm = body.tank?.distance_cm !== undefined 
            ? number(body.tank.distance_cm) 
            : (body.distance_cm !== undefined ? number(body.distance_cm) : null);

        let waterLevel = body.waterLevel !== undefined ? number(body.waterLevel) : null;
        let waterHeight = body.waterHeight !== undefined ? number(body.waterHeight) : 0;

        if (waterLevel === null && distanceCm !== null) {
            waterLevel = Math.max(0, Math.min(100, Math.round(100 - ((distanceCm - 5) / 30) * 100)));
            waterHeight = Math.max(0, Math.round((35 - distanceCm) * 10) / 10);
        } else if (waterLevel === null) {
            waterLevel = 75;
        }

        const tankMotor = (body.tank?.motor || "").toUpperCase() === "ON";
        const tankStatus = waterLevel < 10 ? "CRITICAL" : waterLevel < 20 ? "LOW" : "NORMAL";
        const pumpPermission = waterLevel >= 20;

        const normalizedData = {
            temperature,
            humidity,
            soilMoisture,
            airQuality: number(body.airQuality, 48),
            waterLevel,
            waterHeight,
            waterUsage: pumpStatus ? 2 : 0,
            tankStatus,
            pumpPermission,
            lowWaterStatus: waterLevel < 20,
            lightIntensity: lux,
            lightLevel: lux,
            growLightStatus,
            fanStatus,
            pumpStatus,
            irrigation: pumpStatus
        };

        // Update live database sensor document
        let latest = await Sensor.findOne().sort({ createdAt: -1 });
        if (latest) {
            Object.assign(latest, normalizedData);
            await latest.save();
        } else {
            latest = await Sensor.create(normalizedData);
        }

        // Record history snapshot
        await SensorHistory.create({
            ...normalizedData,
            timestamp: new Date()
        }).catch(() => {});

        lastGatewayTelemetryTime = new Date();
        lastGatewayPayload = {
            lux,
            temperature,
            humidity,
            soilMoisture,
            waterLevel,
            growLightStatus,
            fanStatus,
            pumpStatus,
            tankMotor
        };

        return res.status(200).json({
            success: true,
            message: "Raspberry Pi telemetry ingested successfully",
            source: "RASPBERRY_PI_GATEWAY",
            receivedAt: lastGatewayTelemetryTime.toISOString(),
            data: normalizedData
        });

    } catch (err) {
        console.error("POST /api/sensors/gateway error:", err);
        return res.status(500).json({
            success: false,
            message: "Gateway telemetry ingestion failed",
            error: err.message
        });
    }
});


// GET /api/sensors/gateway/status
router.get("/gateway/status", (req, res) => {
    return res.status(200).json({
        success: true,
        gateway: {
            status: "ONLINE",
            endpoint: "/api/sensors/gateway",
            method: "POST",
            lastSeen: lastGatewayTelemetryTime ? lastGatewayTelemetryTime.toISOString() : null,
            lastPayload: lastGatewayPayload,
            activeConnection: lastGatewayTelemetryTime ? (Date.now() - lastGatewayTelemetryTime.getTime() < 30000) : false
        }
    });
});


// =====================================================
// ADD SENSOR DATA
// POST /api/sensors
// =====================================================

router.post("/", async (req, res) => {

    try {

        const body =
            req.body || {};


        // =================================================
        // REQUIRED
        // =================================================

        const requiredFields = [

            "temperature",
            "humidity",
            "soilMoisture",
            "waterLevel"

        ];


        const missingFields =
            requiredFields.filter(
                field =>
                    body[field] === undefined ||
                    body[field] === null ||
                    body[field] === ""
            );


        if (missingFields.length) {

            return res.status(400).json({

                success: false,

                message:
                    "Required sensor data is missing",

                missingFields

            });

        }


        // =================================================
        // SENSOR DATA
        // =================================================

        const sensorData = {

            temperature:
                number(
                    body.temperature
                ),

            humidity:
                number(
                    body.humidity
                ),

            soilMoisture:
                number(
                    body.soilMoisture
                ),

            airQuality:
                number(
                    body.airQuality
                ),

            waterLevel:
                number(
                    body.waterLevel
                ),

            waterHeight:
                number(
                    body.waterHeight
                ),

            waterUsage:
                number(
                    body.waterUsage
                ),

            tankStatus:
                body.tankStatus ||
                undefined,

            pumpPermission:
                body.pumpPermission !== undefined
                    ? toBoolean(
                        body.pumpPermission
                    )
                    : number(
                        body.waterLevel
                    ) >= 20,

            lowWaterStatus:
                number(
                    body.waterLevel
                ) < 20,

            lastRefill:
                body.lastRefill ||
                null,

            lightIntensity:
                number(
                    body.lightIntensity ??
                    body.lightLevel
                ),

            lightLevel:
                number(
                    body.lightLevel ??
                    body.lightIntensity
                ),

            lightRequirement:
                number(
                    body.lightRequirement,
                    700
                ),

            growLightStatus:
                toBoolean(
                    body.growLightStatus
                ),

            plantHeight:
                number(
                    body.plantHeight
                ),

            leafCount:
                number(
                    body.leafCount
                ),

            growthRate:
                number(
                    body.growthRate
                ),

            irrigation:
                toBoolean(
                    body.irrigation
                ),

            pumpStatus:
                toBoolean(
                    body.pumpStatus
                ),

            irrigationDuration:
                number(
                    body.irrigationDuration
                ),

            irrigationMode:
                body.irrigationMode ||
                "AUTO",

            fanStatus:
                toBoolean(
                    body.fanStatus
                ),

            fanThreshold:
                number(
                    body.fanThreshold,
                    30
                ),

            automationMode:
                body.automationMode ||
                "AUTO"

        };


        // =================================================
        // WATER STATUS
        // =================================================

        const waterLevel =
            sensorData.waterLevel;


        if (!sensorData.tankStatus) {

            if (waterLevel < 10) {

                sensorData.tankStatus =
                    "CRITICAL";

            } else if (waterLevel < 20) {

                sensorData.tankStatus =
                    "LOW";

            } else {

                sensorData.tankStatus =
                    "NORMAL";

            }

        }


        // =================================================
        // WATER SAFETY
        // =================================================

        if (waterLevel < 20) {

            sensorData.pumpPermission =
                false;

            sensorData.lowWaterStatus =
                true;

            sensorData.irrigation =
                false;

            sensorData.pumpStatus =
                false;

        }


        // =================================================
        // VALIDATE
        // =================================================

        for (
            const [key, value]
            of Object.entries(
                sensorData
            )
        ) {

            if (
                typeof value === "number" &&
                !Number.isFinite(value)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `${key} must be a valid number`

                });

            }

        }


        // =================================================
        // SAVE SENSOR
        // =================================================

        const sensor =
            new Sensor(
                sensorData
            );


        await sensor.save();


        const recordedAt =
            sensor.createdAt ||
            new Date();


        // =================================================
        // SENSOR HISTORY
        // =================================================

        await SensorHistory.create({

            ...sensorData,

            recordedAt

        });


        // =================================================
        // LIGHT HISTORY
        // =================================================

        await LightHistory.create({

            lightIntensity:
                sensorData.lightIntensity,

            lightRequirement:
                sensorData.lightRequirement,

            requiredLight:
                sensorData.lightRequirement,

            growLight:
                sensorData.growLightStatus,

            mode:
                sensorData.automationMode === "MANUAL"
                    ? "MANUAL"
                    : "AUTO",

            recordedAt

        });


        // =================================================
        // WATER HISTORY
        // =================================================

        await WaterHistory.create({

            waterLevel:
                sensorData.waterLevel,

            waterHeight:
                sensorData.waterHeight,

            waterUsed:
                sensorData.waterUsage,

            waterUsedLitres:
                sensorData.waterUsage,

            pumpAllowed:
                sensorData.pumpPermission,

            recordedAt

        });


        res.status(201).json({

            success: true,

            message:
                "Sensor data saved successfully",

            data:
                sensor

        });

    } catch (error) {

        console.error(
            "Save sensor error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to save sensor data",

            error:
                error.message

        });

    }

});


// =====================================================
// IRRIGATION ON
// PUT /api/sensors/irrigation/on
// =====================================================

router.put(
    "/irrigation/on",
    async (req, res) => {

        try {

            const sensor =
                await Sensor.findOne()
                    .sort({
                        createdAt: -1
                    });


            if (!sensor) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No sensor data available"

                });

            }


            // =================================================
            // WATER SAFETY
            // =================================================

            if (
                number(
                    sensor.waterLevel
                ) < 20
            ) {

                sensor.irrigation =
                    false;

                sensor.pumpStatus =
                    false;

                sensor.pumpPermission =
                    false;


                await sensor.save();


                return res.status(400).json({

                    success: false,

                    message:
                        "Water level below 20%. Irrigation disabled.",

                    data:
                        sensor

                });

            }


            // =================================================
            // TURN ON
            // =================================================

            sensor.irrigation =
                true;

            sensor.pumpStatus =
                true;

            sensor.pumpPermission =
                true;


            await sensor.save();


            // =================================================
            // SAVE SENSOR HISTORY
            // =================================================

            const historyData = sensor.toObject();
            delete historyData._id;
            delete historyData.__v;

            await SensorHistory.create({

                ...historyData,

                recordedAt:
                    new Date()

            });


            res.json({

                success: true,

                message:
                    "Irrigation turned ON",

                data:
                    sensor

            });

        } catch (error) {

            console.error(
                "Irrigation ON error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to turn irrigation ON",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// IRRIGATION OFF
// PUT /api/sensors/irrigation/off
// =====================================================

router.put(
    "/irrigation/off",
    async (req, res) => {

        try {

            const sensor =
                await Sensor.findOne()
                    .sort({
                        createdAt: -1
                    });


            if (!sensor) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No sensor data available"

                });

            }


            // =================================================
            // TURN OFF
            // =================================================

            sensor.irrigation =
                false;

            sensor.pumpStatus =
                false;


            await sensor.save();


            // =================================================
            // SAVE SENSOR HISTORY
            // =================================================

            const historyData = sensor.toObject();
            delete historyData._id;
            delete historyData.__v;

            await SensorHistory.create({

                ...historyData,

                recordedAt:
                    new Date()

            });


            res.json({

                success: true,

                message:
                    "Irrigation turned OFF",

                data:
                    sensor

            });

        } catch (error) {

            console.error(
                "Irrigation OFF error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to turn irrigation OFF",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// MANUAL IRRIGATION
// PUT /api/sensors/irrigation
// =====================================================

router.put(
    "/irrigation",
    async (req, res) => {

        try {

            const irrigation =
                toBoolean(
                    req.body?.irrigation
                );


            const sensor =
                await Sensor.findOne()
                    .sort({
                        createdAt: -1
                    });


            if (!sensor) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No sensor data available"

                });

            }


            // =================================================
            // WATER SAFETY
            // =================================================

            if (
                irrigation === true &&
                number(
                    sensor.waterLevel
                ) < 20
            ) {

                sensor.irrigation =
                    false;

                sensor.pumpStatus =
                    false;

                sensor.pumpPermission =
                    false;


                await sensor.save();


                return res.status(400).json({

                    success: false,

                    message:
                        "Water level below 20%. Irrigation disabled.",

                    data:
                        sensor

                });

            }


            // =================================================
            // UPDATE STATE
            // =================================================

            sensor.irrigation =
                irrigation;

            sensor.pumpStatus =
                irrigation;

            sensor.pumpPermission =
                number(
                    sensor.waterLevel
                ) >= 20;


            await sensor.save();


            // =================================================
            // SAVE SENSOR HISTORY
            // =================================================

            const historyData = sensor.toObject();
            delete historyData._id;
            delete historyData.__v;

            await SensorHistory.create({

                ...historyData,

                recordedAt:
                    new Date()

            });


            res.json({

                success: true,

                message:
                    irrigation
                        ? "Irrigation turned ON"
                        : "Irrigation turned OFF",

                data:
                    sensor

            });

        } catch (error) {

            console.error(
                "Irrigation control error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to control irrigation",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// GET IRRIGATION STATE
// GET /api/sensors/irrigation
// =====================================================

router.get(
    "/irrigation",
    async (req, res) => {

        try {

            const sensor =
                await Sensor.findOne()
                    .sort({
                        createdAt: -1
                    });


            if (!sensor) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No sensor data available"

                });

            }


            const waterLevel =
                number(
                    sensor.waterLevel
                );


            res.json({

                success: true,

                irrigation:
                    toBoolean(
                        sensor.irrigation
                    ),

                pumpStatus:
                    toBoolean(
                        sensor.pumpStatus
                    ),

                waterLevel,

                pumpPermission:
                    waterLevel >= 20

            });

        } catch (error) {

            console.error(
                "Irrigation state error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to get irrigation state",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;