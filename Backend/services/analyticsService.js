const SensorHistory =
    require("../models/SensorHistory");

const LightHistory =
    require("../models/LightHistory");

const WaterHistory =
    require("../models/WaterHistory");

const IrrigationEvent =
    require("../models/IrrigationEvent");

const PestDetection =
    require("../models/PestDetection");


// =====================================================
// HELPER
// =====================================================

function average(values) {

    if (!values.length) {
        return 0;
    }

    return (
        values.reduce(
            (sum, value) => sum + value,
            0
        ) / values.length
    );
}


// =====================================================
// DAY KEY
// =====================================================

function getDayKey(date) {

    return new Date(date)
        .toISOString()
        .split("T")[0];
}


// =====================================================
// TEMPERATURE + HUMIDITY DAILY
// =====================================================

async function getTemperatureHumidityDaily() {

    const records =
        await SensorHistory
            .find()
            .sort({ recordedAt: 1 })
            .lean();


    const grouped = {};


    records.forEach(record => {

        const dateValue =
            record.recordedAt ||
            record.createdAt;

        if (!dateValue) {
            return;
        }


        const day =
            getDayKey(dateValue);


        if (!grouped[day]) {

            grouped[day] = {

                temperature: [],

                humidity: []

            };
        }


        const temperature =
            Number(record.temperature);


        const humidity =
            Number(record.humidity);


        if (Number.isFinite(temperature)) {

            grouped[day]
                .temperature
                .push(temperature);

        }


        if (Number.isFinite(humidity)) {

            grouped[day]
                .humidity
                .push(humidity);

        }

    });


    return Object.entries(grouped)
        .map(([date, data]) => ({

            date,

            temperature:
                Number(
                    average(
                        data.temperature
                    ).toFixed(2)
                ),

            humidity:
                Number(
                    average(
                        data.humidity
                    ).toFixed(2)
                )

        }));

}


// =====================================================
// LIGHT DAILY
// =====================================================

async function getLightDaily() {

    const records =
        await LightHistory
            .find()
            .sort({ recordedAt: 1 })
            .lean();


    const grouped = {};


    records.forEach(record => {

        const dateValue =
            record.recordedAt ||
            record.createdAt;

        if (!dateValue) {
            return;
        }


        const day =
            getDayKey(dateValue);


        if (!grouped[day]) {

            grouped[day] = [];

        }


        const value =
            Number(
                record.lightIntensity ??
                record.lightLevel ??
                record.lux ??
                0
            );


        if (Number.isFinite(value)) {

            grouped[day].push(value);

        }

    });


    return Object.entries(grouped)
        .map(([date, values]) => ({

            date,

            averageLight:
                Number(
                    average(values)
                        .toFixed(2)
                ),

            minimumLight:
                values.length
                    ? Math.min(...values)
                    : 0,

            maximumLight:
                values.length
                    ? Math.max(...values)
                    : 0

        }));

}


// =====================================================
// WATER DAILY
// =====================================================

async function getWaterDaily() {

    const records =
        await WaterHistory
            .find()
            .sort({
                recordedAt: 1
            })
            .lean();


    const grouped = {};


    records.forEach(record => {

        const dateValue =
            record.recordedAt ||
            record.timestamp ||
            record.createdAt;

        if (!dateValue) {
            return;
        }


        const day =
            getDayKey(dateValue);


        if (!grouped[day]) {

            grouped[day] = [];

        }


        const value =
            Number(
                record.waterLevel ??
                record.level ??
                0
            );


        if (Number.isFinite(value)) {

            grouped[day].push(value);

        }

    });


    return Object.entries(grouped)
        .map(([date, values]) => ({

            date,

            averageWaterLevel:
                Number(
                    average(values)
                        .toFixed(2)
                ),

            endingWaterLevel:
                values.length
                    ? values[values.length - 1]
                    : 0

        }));

}


// =====================================================
// IRRIGATION DAILY
// =====================================================

async function getIrrigationDaily() {

    const records =
        await IrrigationEvent
            .find()
            .sort({
                startTime: 1
            })
            .lean();


    const grouped = {};


    records.forEach(record => {

        const dateValue =
            record.startTime ||
            record.createdAt;

        if (!dateValue) {
            return;
        }


        const day =
            getDayKey(dateValue);


        if (!grouped[day]) {

            grouped[day] = {

                duration: 0,

                waterUsed: 0,

                events: 0

            };

        }


        // IrrigationEvent uses durationMinutes

        const duration =
            Number(
                record.durationMinutes || 0
            );


        // IrrigationEvent uses waterUsedLitres

        const waterUsed =
            Number(
                record.waterUsedLitres ??
                record.waterUsed ??
                0
            );


        grouped[day].duration +=
            Number.isFinite(duration)
                ? duration
                : 0;


        grouped[day].waterUsed +=
            Number.isFinite(waterUsed)
                ? waterUsed
                : 0;


        grouped[day].events += 1;

    });


    return Object.entries(grouped)
        .map(([date, data]) => ({

            date,

            irrigationDuration:
                Number(
                    data.duration
                        .toFixed(2)
                ),

            waterUsed:
                Number(
                    data.waterUsed
                        .toFixed(2)
                ),

            pumpEvents:
                data.events

        }));

}


// =====================================================
// PEST DAILY
// =====================================================

async function getPestDaily() {

    const records =
        await PestDetection
            .find()
            .sort({
                detectedAt: 1
            })
            .lean();


    const grouped = {};


    records.forEach(record => {

        const dateValue =
            record.detectedAt ||
            record.createdAt;

        if (!dateValue) {
            return;
        }


        const day =
            getDayKey(dateValue);


        if (!grouped[day]) {

            grouped[day] = {

                detections: 0,

                types: {}

            };

        }


        grouped[day].detections += 1;


        // PestDetection uses pestName

        const pestType =
            record.pestType ||
            record.pestName ||
            "Unknown";


        grouped[day]
            .types[pestType] =
            (
                grouped[day]
                    .types[pestType] || 0
            ) + 1;

    });


    return Object.entries(grouped)
        .map(([date, data]) => ({

            date,

            detections:
                data.detections,

            pestTypes:
                data.types

        }));

}


// =====================================================
// COMPLETE DASHBOARD ANALYTICS
// =====================================================

async function getDashboardAnalytics() {

    const [

        temperatureHumidity,

        light,

        water,

        irrigation,

        pests

    ] = await Promise.all([

        getTemperatureHumidityDaily(),

        getLightDaily(),

        getWaterDaily(),

        getIrrigationDaily(),

        getPestDaily()

    ]);


    return {

        temperatureHumidity,

        light,

        water,

        irrigation,

        pests

    };

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    getTemperatureHumidityDaily,

    getLightDaily,

    getWaterDaily,

    getIrrigationDaily,

    getPestDaily,

    getDashboardAnalytics

};