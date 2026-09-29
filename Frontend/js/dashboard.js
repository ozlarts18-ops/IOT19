// =====================================================
// DASHBOARD CONTROLLER
// IOT19 SMART AGRICULTURE DASHBOARD
// =====================================================


// =====================================================
// API URLS
// =====================================================

const DASHBOARD_SYSTEM_STATUS_API =
    "http://localhost:5000/api/system/status";

const DASHBOARD_SYSTEM_HEALTH_API =
    "http://localhost:5000/api/system/health";


// Prevent multiple refreshes at the same time
let dashboardRefreshing = false;


// =====================================================
// DASHBOARD START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🌱 IOT19 Smart Agriculture Dashboard loaded"
        );

        initializeDashboard();

    }
);


// =====================================================
// INITIALIZE DASHBOARD
// =====================================================

async function initializeDashboard() {

    console.log(
        "🚀 Initializing dashboard..."
    );

    try {

        updateLastUpdate();


        // =================================================
        // USER
        // =================================================

        if (
            typeof loadUser === "function"
        ) {

            try {

                loadUser();

            } catch (error) {

                console.error(
                    "User loading error:",
                    error
                );

            }

        }


        // =================================================
        // SENSOR DATA
        // =================================================

        if (
            typeof fetchSensorData === "function"
        ) {

            try {

                await fetchSensorData();

            } catch (error) {

                console.error(
                    "Sensor data error:",
                    error
                );

            }

        }


        // =================================================
        // SENSOR STATISTICS
        // =================================================

        if (
            typeof loadSensorStatistics === "function"
        ) {

            try {

                await loadSensorStatistics();

            } catch (error) {

                console.error(
                    "Sensor statistics error:",
                    error
                );

            }

        }


        // =================================================
        // ENVIRONMENT STATISTICS
        // =================================================

        if (
            typeof loadEnvironmentalStatistics === "function"
        ) {

            try {

                await loadEnvironmentalStatistics();

            } catch (error) {

                console.error(
                    "Environment statistics error:",
                    error
                );

            }

        }


        // =================================================
        // LIGHT STATISTICS
        // =================================================

        if (
            typeof loadLightStatistics === "function"
        ) {

            try {

                await loadLightStatistics();

            } catch (error) {

                console.error(
                    "Light statistics error:",
                    error
                );

            }

        }


        // =================================================
        // HISTORY
        // =================================================

        if (
            typeof fetchHistory === "function"
        ) {

            try {

                await fetchHistory();

            } catch (error) {

                console.error(
                    "History error:",
                    error
                );

            }

        }


        // =================================================
        // IRRIGATION STATE
        // =================================================

        if (
            typeof loadIrrigationState === "function"
        ) {

            try {

                await loadIrrigationState();

            } catch (error) {

                console.error(
                    "Irrigation state error:",
                    error
                );

            }

        }


        // =================================================
        // IRRIGATION UI
        // =================================================

        if (
            typeof updateIrrigationUI === "function"
        ) {

            try {

                updateIrrigationUI();

            } catch (error) {

                console.error(
                    "Irrigation UI error:",
                    error
                );

            }

        }


        // =================================================
        // CROP GROWTH
        // =================================================

        if (
            typeof loadCropGrowthData === "function"
        ) {

            try {

                await loadCropGrowthData();

            } catch (error) {

                console.error(
                    "Crop growth error:",
                    error
                );

            }

        }


        // =================================================
        // CROP HEALTH
        // =================================================

        if (
            typeof loadCropHealth === "function"
        ) {

            try {

                await loadCropHealth();

            } catch (error) {

                console.error(
                    "Crop health error:",
                    error
                );

            }

        }


        // =================================================
        // PEST DETECTION
        // =================================================

        if (
            typeof loadPestDetection === "function"
        ) {

            try {

                await loadPestDetection();

            } catch (error) {

                console.error(
                    "Pest detection error:",
                    error
                );

            }

        }


        // =================================================
        // ALERTS
        // =================================================

        if (
            typeof loadAlerts === "function"
        ) {

            try {

                await loadAlerts();

            } catch (error) {

                console.error(
                    "Alerts error:",
                    error
                );

            }

        }


        // =================================================
        // SYSTEM STATUS
        // =================================================

        await loadDashboardSystemStatus();


        // =================================================
        // SYSTEM HEALTH
        // =================================================

        await loadSystemHealth();


        // =================================================
        // CHARTS
        // =================================================

        if (
            typeof loadDashboardCharts === "function"
        ) {

            try {

                await loadDashboardCharts();

            } catch (error) {

                console.error(
                    "Charts error:",
                    error
                );

            }

        }


        updateLastUpdate();


        console.log(
            "✅ All dashboard modules initialized"
        );


    } catch (error) {

        console.error(
            "❌ Dashboard initialization error:",
            error
        );

    }

}


// =====================================================
// LAST UPDATE
// =====================================================

function updateLastUpdate() {

    const element =
        document.getElementById(
            "lastUpdate"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "Last update: " +
        new Date().toLocaleTimeString();

}


// =====================================================
// SYSTEM STATUS
// =====================================================

async function loadDashboardSystemStatus() {

    try {

        const response =
            await fetch(
                DASHBOARD_SYSTEM_STATUS_API
            );


        if (!response.ok) {

            throw new Error(
                "System status API error: " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "🖥️ System status:",
            result
        );


        const data =
            result?.data ||
            result?.system ||
            result ||
            {};


        // =================================================
        // MAIN SYSTEM STATUS
        // =================================================

        const systemStatus =
            data.system?.status ||
            data.status ||
            "Connected";


        updateElement(
            "systemStatus",
            systemStatus
        );


        // =================================================
        // RASPBERRY PI
        // =================================================

        let raspberryStatus =
            "Connected";


        if (
            typeof data.raspberryPi === "object" &&
            data.raspberryPi !== null
        ) {

            raspberryStatus =
                data.raspberryPi.status ||
                "Connected";

        } else if (
            data.raspberryPi
        ) {

            raspberryStatus =
                data.raspberryPi;

        }


        updateElement(
            "raspberryPiStatus",
            raspberryStatus
        );


        // =================================================
        // SENSOR NETWORK
        // =================================================

        let sensorConnected =
            false;


        if (
            data.sensors &&
            typeof data.sensors.connected !== "undefined"
        ) {

            sensorConnected =
                Boolean(
                    data.sensors.connected
                );

        }


        updateElement(
            "sensorNetworkStatus",
            sensorConnected
                ? "Active"
                : "Offline"
        );


        // =================================================
        // BACKEND
        // =================================================

        updateElement(
            "backendStatus",
            data.system?.backend ||
            "Online"
        );


        // =================================================
        // DATABASE
        // =================================================

        updateElement(
            "databaseStatus",
            data.system?.database ||
            "Connected"
        );


        // =================================================
        // HEADER CONNECTION
        // =================================================

        updateElement(
            "connectionStatus",
            "System Online"
        );


        console.log(
            "✅ System status updated"
        );


    } catch (error) {

        console.error(
            "❌ System status error:",
            error
        );


        updateElement(
            "connectionStatus",
            "System Offline"
        );

    }

}


// =====================================================
// SYSTEM HEALTH
// =====================================================

async function loadSystemHealth() {

    try {

        const response =
            await fetch(
                DASHBOARD_SYSTEM_HEALTH_API
            );


        if (!response.ok) {

            throw new Error(
                "System health API error: " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "🩺 System health:",
            result
        );


        if (
            result?.success &&
            (
                result?.status === "OK" ||
                result?.data?.status === "OK"
            )
        ) {

            updateElement(
                "systemHealth",
                "NORMAL"
            );

        } else {

            updateElement(
                "systemHealth",
                "WARNING"
            );

        }


    } catch (error) {

        console.error(
            "System health error:",
            error
        );


        updateElement(
            "systemHealth",
            "OFFLINE"
        );

    }

}


// =====================================================
// SAFE DOM UPDATE
// =====================================================

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "--";

}


// =====================================================
// REFRESH DASHBOARD
// =====================================================

async function refreshDashboard() {

    // Prevent overlapping refreshes
    if (dashboardRefreshing) {

        console.log(
            "⏳ Dashboard refresh already running..."
        );

        return;

    }


    dashboardRefreshing = true;


    console.log(
        "🔄 Refreshing dashboard..."
    );


    try {


        // =================================================
        // SENSOR DATA
        // =================================================

        if (
            typeof fetchSensorData === "function"
        ) {

            try {

                await fetchSensorData();

            } catch (error) {

                console.error(
                    "Refresh sensor error:",
                    error
                );

            }

        }


        // =================================================
        // SENSOR STATISTICS
        // =================================================

        if (
            typeof loadSensorStatistics === "function"
        ) {

            try {

                await loadSensorStatistics();

            } catch (error) {

                console.error(
                    "Refresh statistics error:",
                    error
                );

            }

        }


        // =================================================
        // ENVIRONMENT
        // =================================================

        if (
            typeof loadEnvironmentalStatistics === "function"
        ) {

            try {

                await loadEnvironmentalStatistics();

            } catch (error) {

                console.error(
                    "Refresh environment error:",
                    error
                );

            }

        }


        // =================================================
        // LIGHT
        // =================================================

        if (
            typeof loadLightStatistics === "function"
        ) {

            try {

                await loadLightStatistics();

            } catch (error) {

                console.error(
                    "Refresh light error:",
                    error
                );

            }

        }


        // =================================================
        // HISTORY
        // =================================================

        if (
            typeof fetchHistory === "function"
        ) {

            try {

                await fetchHistory();

            } catch (error) {

                console.error(
                    "Refresh history error:",
                    error
                );

            }

        }


        // =================================================
        // IRRIGATION STATE
        // =================================================

        if (
            typeof loadIrrigationState === "function"
        ) {

            try {

                await loadIrrigationState();

            } catch (error) {

                console.error(
                    "Refresh irrigation error:",
                    error
                );

            }

        }


        // =================================================
        // IRRIGATION UI
        // =================================================

        if (
            typeof updateIrrigationUI === "function"
        ) {

            try {

                updateIrrigationUI();

            } catch (error) {

                console.error(
                    "Refresh irrigation UI error:",
                    error
                );

            }

        }


        // =================================================
        // CROP GROWTH
        // =================================================

        if (
            typeof loadCropGrowthData === "function"
        ) {

            try {

                await loadCropGrowthData();

            } catch (error) {

                console.error(
                    "Refresh crop growth error:",
                    error
                );

            }

        }


        // =================================================
        // CROP HEALTH
        // =================================================

        if (
            typeof loadCropHealth === "function"
        ) {

            try {

                await loadCropHealth();

            } catch (error) {

                console.error(
                    "Refresh crop health error:",
                    error
                );

            }

        }


        // =================================================
        // PEST
        // =================================================

        if (
            typeof loadPestDetection === "function"
        ) {

            try {

                await loadPestDetection();

            } catch (error) {

                console.error(
                    "Refresh pest error:",
                    error
                );

            }

        }


        // =================================================
        // ALERTS
        // =================================================

        if (
            typeof loadAlerts === "function"
        ) {

            try {

                await loadAlerts();

            } catch (error) {

                console.error(
                    "Refresh alerts error:",
                    error
                );

            }

        }


        // =================================================
        // SYSTEM STATUS
        // =================================================

        await loadDashboardSystemStatus();


        // =================================================
        // SYSTEM HEALTH
        // =================================================

        await loadSystemHealth();


        // =================================================
        // CHARTS
        // =================================================

        if (
            typeof loadDashboardCharts === "function"
        ) {

            try {

                await loadDashboardCharts();

            } catch (error) {

                console.error(
                    "Refresh charts error:",
                    error
                );

            }

        }


        // =================================================
        // TIME
        // =================================================

        updateLastUpdate();


        console.log(
            "✅ Dashboard refreshed successfully"
        );


    } catch (error) {

        console.error(
            "❌ Dashboard refresh error:",
            error
        );

    } finally {

        dashboardRefreshing = false;

    }

}


// =====================================================
// AUTO UPDATE TIME
// =====================================================

setInterval(
    updateLastUpdate,
    30000
);


// =====================================================
// AUTO REFRESH DASHBOARD
// =====================================================

setInterval(
    refreshDashboard,
    60000
);