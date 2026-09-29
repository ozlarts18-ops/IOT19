
// =====================================================
// CHARTS.JS
// IOT19 SMART AGRICULTURE DASHBOARD
// =====================================================

// IMPORTANT:
// API_BASE_URL must already exist in api.js.
// DO NOT declare it again here.


// =====================================================
// CHART INSTANCES
// =====================================================

let temperatureChartInstance = null;
let humidityChartInstance = null;
let environmentChartInstance = null;
let dailyTemperatureChartInstance = null;
let dailyHumidityChartInstance = null;

let lightChartInstance = null;
let lightRequirementChartInstance = null;
let dailyLightChartInstance = null;
let growLightChartInstance = null;

let waterLevelChartInstance = null;
let waterHeightChartInstance = null;
let dailyWaterLevelChartInstance = null;
let lowWaterChartInstance = null;

let soilMoistureChartInstance = null;
let soilThresholdChartInstance = null;
let dailySoilChartInstance = null;
let irrigationDurationChartInstance = null;
let waterUsageChartInstance = null;
let pumpActivityChartInstance = null;
let growthPercentageChartInstance = null;



// =====================================================
// COMMON OPTIONS
// =====================================================

const commonChartOptions = {

    responsive: true,

    maintainAspectRatio: false,

    interaction: {
        mode: "index",
        intersect: false
    },

    plugins: {

        legend: {
            display: true
        }

    },

    scales: {

        x: {

            ticks: {
                maxRotation: 45,
                minRotation: 0
            }

        },

        y: {

            beginAtZero: true

        }

    }

};


// =====================================================
// GET CANVAS
// =====================================================

function getCanvas(id) {

    const canvas =
        document.getElementById(id);

    if (!canvas) {

        console.warn(
            "Canvas not found:",
            id
        );

        return null;
    }

    return canvas;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        [],
        {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}
// =====================================================
// DESTROY CHART
// =====================================================

function destroyChart(chart) {

    if (chart && typeof chart.destroy === "function") {
        chart.destroy();
    }

    return null;
}
// =====================================================
// 1. TEMPERATURE TREND
// =====================================================

function createTemperatureChart(data) {

    const canvas =
        getCanvas(
            "temperatureChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.temperature
                ) || 0
        );

    temperatureChartInstance =
        destroyChart(
            temperatureChartInstance
        );

    temperatureChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Temperature (°C)",

                        data: values,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 2. HUMIDITY TREND
// =====================================================

function createHumidityChart(data) {

    const canvas =
        getCanvas(
            "humidityChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.humidity
                ) || 0
        );

    humidityChartInstance =
        destroyChart(
            humidityChartInstance
        );

    humidityChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Humidity (%)",

                        data: values,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 3. TEMPERATURE VS HUMIDITY
// =====================================================

function createEnvironmentChart(data) {

    const canvas =
        getCanvas(
            "environmentChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const temperatures =
        data.map(
            item =>
                Number(
                    item.temperature
                ) || 0
        );

    const humidity =
        data.map(
            item =>
                Number(
                    item.humidity
                ) || 0
        );

    environmentChartInstance =
        destroyChart(
            environmentChartInstance
        );

    environmentChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Temperature (°C)",

                        data: temperatures,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    },

                    {
                        label:
                            "Humidity (%)",

                        data: humidity,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 4. DAILY TEMPERATURE
// =====================================================

function createDailyTemperatureChart(data) {

    const canvas =
        getCanvas("dailyTemperatureChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(item.temperature) || 0
        );

    dailyTemperatureChartInstance =
        destroyChart(
            dailyTemperatureChartInstance
        );

    dailyTemperatureChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Average Temperature (°C)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}

// =====================================================
// 5. DAILY HUMIDITY
// =====================================================

function createDailyHumidityChart(data) {

    const canvas =
        getCanvas("dailyHumidityChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(item.humidity) || 0
        );

    dailyHumidityChartInstance =
        destroyChart(
            dailyHumidityChartInstance
        );

    dailyHumidityChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Average Humidity (%)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 6. LIGHT INTENSITY
// =====================================================

function createLightChart(data) {

    const canvas =
        getCanvas(
            "lightChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.lightIntensity ??
                    item.lightLevel
                ) || 0
        );

    lightChartInstance =
        destroyChart(
            lightChartInstance
        );

    lightChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Light Intensity (lux)",

                        data: values,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 7. LIGHT REQUIREMENT VS ACTUAL
// =====================================================

function createLightRequirementChart(data) {

    const canvas = getCanvas("lightRequirementChart");
    if (!canvas) return;

    if (!Array.isArray(data)) data = [];

    const labels = data.map(item =>
        formatDate(item.createdAt || item.recordedAt || item.date)
    );

    const actual = data.map(item =>
        Number(item.lightIntensity ?? item.lightLevel ?? 0) || 0
    );

    const required = data.map(item =>
        Number(item.lightRequirement ?? 700) || 700
    );

    lightRequirementChartInstance = destroyChart(
        lightRequirementChartInstance
    );

    lightRequirementChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Actual Light (lux)",
                    data: actual,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: "Required Light (lux)",
                    data: required,
                    borderWidth: 2,
                    borderDash: [6, 6],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: commonChartOptions
    });
}


// =====================================================
// 8. DAILY LIGHT EXPOSURE
// =====================================================

function createDailyLightChart(data) {

    const canvas =
        getCanvas("lightExposureChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(item.light) || 0
        );

    dailyLightChartInstance =
        destroyChart(
            dailyLightChartInstance
        );

    dailyLightChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Daily Light (lux)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}

// =====================================================
// 9. GROW LIGHT ACTIVITY
// =====================================================

function createGrowLightChart(data) {

    const canvas = getCanvas("growLightChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels = data.map(item =>
        formatDate(
            item.createdAt ||
            item.date
        )
    );

    const values = data.map(item =>
        item.growLightStatus === true ||
        item.growLightStatus === 1 ||
        item.growLightStatus === "true"
            ? 1
            : 0
    );

    growLightChartInstance =
        destroyChart(
            growLightChartInstance
        );

    growLightChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label: "Grow Light Activity",

                        data: values,

                        borderWidth: 1
                    }

                ]
            },

            options: {

                ...commonChartOptions,

                scales: {

                    x:
                        commonChartOptions.scales.x,

                    y: {

                        min: 0,

                        max: 1,

                        ticks: {

                            stepSize: 1,

                            callback: function(value) {

                                return value === 1
                                    ? "ON"
                                    : "OFF";

                            }

                        }

                    }

                }

            }

        });

}

// =====================================================
// 10. WATER LEVEL
// =====================================================

function createWaterLevelChart(data) {

    const canvas =
        getCanvas(
            "waterLevelChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.waterLevel
                ) || 0
        );

    waterLevelChartInstance =
        destroyChart(
            waterLevelChartInstance
        );

    waterLevelChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Water Level (%)",

                        data: values,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 11. WATER HEIGHT
// =====================================================

function createWaterHeightChart(data) {

    const canvas =
        getCanvas(
            "waterHeightChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.waterHeight
                ) || 0
        );

    waterHeightChartInstance =
        destroyChart(
            waterHeightChartInstance
        );

    waterHeightChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Water Height (cm)",

                        data: values,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 12. DAILY WATER LEVEL
// =====================================================

function createDailyWaterLevelChart(data) {

    const canvas =
        getCanvas("dailyWaterChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(item.waterLevel) || 0
        );

    dailyWaterLevelChartInstance =
        destroyChart(
            dailyWaterLevelChartInstance
        );

    dailyWaterLevelChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Daily Water Level (%)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}
// =====================================================
// 13. LOW WATER EVENTS
// =====================================================

function createLowWaterChart(data) {

    const canvas =
        getCanvas(
            "lowWaterChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.waterLevel
                ) < 20
                    ? 1
                    : 0
        );

    lowWaterChartInstance =
        destroyChart(
            lowWaterChartInstance
        );

    lowWaterChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Low Water Event",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 14. SOIL MOISTURE
// =====================================================

function createSoilMoistureChart(data) {

    const canvas =
        getCanvas(
            "soilChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt
                )
        );

    const values =
        data.map(
            item =>
                Number(
                    item.soilMoisture
                ) || 0
        );

    soilMoistureChartInstance =
        destroyChart(
            soilMoistureChartInstance
        );

    soilMoistureChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Soil Moisture (%)",

                        data: values,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 15. SOIL MOISTURE + THRESHOLDS
// =====================================================

function createSoilThresholdChart(data) {

    const canvas =
        getCanvas(
            "soilThresholdChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt
                )
        );

    const moisture =
        data.map(
            item =>
                Number(
                    item.soilMoisture
                ) || 0
        );

    const dryThreshold =
        data.map(
            () => 40
        );

    const offTarget =
        data.map(
            () => 65
        );

    soilThresholdChartInstance =
        destroyChart(
            soilThresholdChartInstance
        );

    soilThresholdChartInstance =
        new Chart(canvas, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Soil Moisture (%)",

                        data: moisture,

                        borderWidth: 2,

                        tension: 0.3,

                        fill: false

                    },

                    {
                        label:
                            "Irrigation ON - 40%",

                        data: dryThreshold,

                        borderWidth: 1,

                        borderDash: [6, 6],

                        pointRadius: 0,

                        fill: false

                    },

                    {
                        label:
                            "Irrigation OFF - 65%",

                        data: offTarget,

                        borderWidth: 1,

                        borderDash: [6, 6],

                        pointRadius: 0,

                        fill: false

                    }

                ]

            },

            options:
                commonChartOptions

        });

}


// =====================================================
// 16. DAILY SOIL MOISTURE
// =====================================================

function createDailySoilChart(data) {

    const canvas =
        getCanvas("dailySoilChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(item.soilMoisture) || 0
        );

    dailySoilChartInstance =
        destroyChart(
            dailySoilChartInstance
        );

    dailySoilChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Daily Soil Moisture (%)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}
// =====================================================
// 17. IRRIGATION DURATION
// =====================================================

function createIrrigationDurationChart(data) {

    const canvas =
        getCanvas("irrigationDurationChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(
                item.irrigationDuration
            ) || 0
        );

    irrigationDurationChartInstance =
        destroyChart(
            irrigationDurationChartInstance
        );

    irrigationDurationChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Irrigation Duration (min)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}
// =====================================================
// 18. WATER USAGE
// =====================================================

function createWaterUsageChart(data) {

    const canvas =
        getCanvas("waterUsageChart");

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(item =>
            item.date || ""
        );

    const values =
        data.map(item =>
            Number(
                item.waterUsage
            ) || 0
        );

    waterUsageChartInstance =
        destroyChart(
            waterUsageChartInstance
        );

    waterUsageChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Water Used (L)",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options:
                commonChartOptions

        });

}

// =====================================================
// 19. PUMP ACTIVITY
// =====================================================

function createPumpActivityChart(data) {

    const canvas =
        getCanvas(
            "pumpActivityChart"
        );

    if (!canvas) return;

    if (!Array.isArray(data)) {
        data = [];
    }

    const labels =
        data.map(
            item =>
                formatDate(
                    item.createdAt ||
                    item.date
                )
        );

    const values =
        data.map(
            item =>
                item.pumpStatus === true ||
                item.pumpStatus === 1 ||
                item.pumpStatus === "true"
                    ? 1
                    : 0
        );

    pumpActivityChartInstance =
        destroyChart(
            pumpActivityChartInstance
        );

    pumpActivityChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Pump Activity",

                        data: values,

                        borderWidth: 1

                    }

                ]

            },

            options: {

                ...commonChartOptions,

                scales: {

                    x:
                        commonChartOptions.scales.x,

                    y: {

                        min: 0,

                        max: 1,

                        ticks: {

                            stepSize: 1,

                            callback:
                                value =>
                                    value === 1
                                        ? "ON"
                                        : "OFF"

                        }

                    }

                }

            }

        });

}


// =====================================================
// LOAD SENSOR HISTORY
// =====================================================

async function loadSensorHistory() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/sensors/history`
        );

        if (!response.ok) {
            throw new Error(
                `History API failed: ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message || "Failed to load sensor history"
            );
        }

        return Array.isArray(result.data)
            ? result.data
            : [];

    } catch (error) {

        console.error(
            "Sensor history error:",
            error
        );

        return [];
    }
}
// =====================================================
// LOAD DAILY SUMMARY
// =====================================================

async function loadDailySummary() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/sensors/daily-summary`
        );

        if (!response.ok) {
            throw new Error(
                `Daily summary API failed: ${response.status}`
            );
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(
                result.message || "Failed to load daily summary"
            );
        }

        return Array.isArray(result.data)
            ? result.data
            : [];

    } catch (error) {

        console.error(
            "Daily summary error:",
            error
        );

        return [];
    }
}
// =====================================================
// LOAD ALL CHARTS
// =====================================================

async function loadDashboardCharts() {

    try {

        console.log(
            "Loading IOT19 dashboard charts..."
        );


        // =================================================
        // SENSOR HISTORY
        // =================================================

        const [history, daily] =
            await Promise.all([
                loadSensorHistory(),
                loadDailySummary()
            ]);


        // =================================================
        // ENVIRONMENT
        // =================================================

        createTemperatureChart(
            history
        );

        createHumidityChart(
            history
        );

        createEnvironmentChart(
            history
        );

        createDailyTemperatureChart(
            daily
        );

        createDailyHumidityChart(
            daily
        );


        // =================================================
        // LIGHT
        // =================================================

        createLightChart(
            history
        );

        createLightRequirementChart(
            history
        );

        createDailyLightChart(
            daily
        );

        createGrowLightChart(
            history
        );


        // =================================================
        // WATER
        // =================================================

        createWaterLevelChart(
            history
        );

        createWaterHeightChart(
            history
        );

        createDailyWaterLevelChart(
            daily
        );

        createLowWaterChart(
            history
        );


        // =================================================
        // SOIL / IRRIGATION
        // =================================================

        createSoilMoistureChart(
            history
        );

        createSoilThresholdChart(
            history
        );

        createDailySoilChart(
            daily
        );

        createIrrigationDurationChart(
            daily
        );

        createWaterUsageChart(
            daily
        );

        createPumpActivityChart(
            history
        );


        // =================================================
        // CROP GROWTH / GREEN INDEX
        // =================================================

        try {
            const plantHistory = await getPlantIdentificationHistory(30);
            createGrowthPercentageChart(plantHistory);
        } catch (e) {
            console.warn("Could not load plant identification history for chart:", e);
        }


        console.log(
            "IOT19 charts loaded successfully."
        );

    }
    catch (error) {

        console.error(
            "Dashboard charts error:",
            error
        );

    }

}


// =====================================================
// GROWTH PERCENTAGE / GREEN GROWTH INDEX CHART
// =====================================================

function createGrowthPercentageChart(data) {
    const canvas = getCanvas("growthPercentageChart");
    if (!canvas) return;

    if (!Array.isArray(data) || data.length === 0) {
        // Fallback sample points if empty
        data = [
            { timestamp: new Date(Date.now() - 86400000 * 4), greenIndex: 45.2 },
            { timestamp: new Date(Date.now() - 86400000 * 3), greenIndex: 52.8 },
            { timestamp: new Date(Date.now() - 86400000 * 2), greenIndex: 58.1 },
            { timestamp: new Date(Date.now() - 86400000 * 1), greenIndex: 64.6 },
            { timestamp: new Date(), greenIndex: 69.1 }
        ];
    }

    const labels = data.map(item => formatDate(item.timestamp || item.createdAt || item.date));
    const values = data.map(item => Number(item.greenIndex !== undefined ? item.greenIndex : item.growthPercentage) || 0);

    growthPercentageChartInstance = destroyChart(growthPercentageChartInstance);

    growthPercentageChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Green Growth Index (%)",
                    data: values,
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22, 163, 74, 0.15)",
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    pointBackgroundColor: "#16a34a",
                    pointRadius: 4
                }
            ]
        },
        options: {
            ...commonChartOptions,
            scales: {
                ...commonChartOptions.scales,
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + "%";
                        }
                    }
                }
            }
        }
    });
}

window.createGrowthPercentageChart = createGrowthPercentageChart;
window.refreshCropGrowthCharts = async function() {
    try {
        const plantHistory = await getPlantIdentificationHistory(30);
        createGrowthPercentageChart(plantHistory);
    } catch (err) {
        console.error("Failed to refresh crop growth chart:", err);
    }
};


// Charts are initialized by js/dashboard.js after dashboard data loads.


