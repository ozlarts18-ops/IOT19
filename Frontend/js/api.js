// =====================================================
// API.JS
// IOT19 SMART AGRICULTURE DASHBOARD
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";


// =====================================================
// GENERIC API HELPER
// =====================================================

async function fetchAPI(endpoint) {

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`
    );

    if (!response.ok) {

        throw new Error(
            `API failed: ${response.status} ${response.statusText}`
        );

    }

    const result =
        await response.json();

    if (!result.success) {

        throw new Error(
            result.message || "API request failed"
        );

    }

    return result;

}


// =====================================================
// LATEST SENSOR
// =====================================================

async function getLatestSensor() {

    const result =
        await fetchAPI(
            "/sensors/latest"
        );

    return result.data;

}


// =====================================================
// SENSOR HISTORY
// =====================================================

async function getSensorHistory() {

    const result =
        await fetchAPI(
            "/sensors/history"
        );

    return result.data || [];

}


// =====================================================
// SENSOR STATISTICS
// =====================================================

async function getSensorStatistics() {

    const result =
        await fetchAPI(
            "/sensors/statistics"
        );

    return result.data;

}


// =====================================================
// DAILY SUMMARY
// =====================================================

async function getDailySummary() {

    const result =
        await fetchAPI(
            "/sensors/daily-summary"
        );

    return result.data || [];

}


// =====================================================
// LIGHT STATISTICS
// =====================================================

async function getLightStatistics() {

    const result =
        await fetchAPI(
            "/sensors/light-statistics"
        );

    return result.data;

}


// =====================================================
// WATER STATISTICS
// =====================================================

async function getWaterStatistics() {

    const result =
        await fetchAPI(
            "/sensors/water-statistics"
        );

    return result.data;

}


// =====================================================
// IRRIGATION STATISTICS
// =====================================================

async function getIrrigationStatistics() {

    const result =
        await fetchAPI(
            "/sensors/irrigation-statistics"
        );

    return result.data;

}


// =====================================================
// IRRIGATION STATE
// =====================================================

async function getIrrigationState() {

    const result =
        await fetchAPI(
            "/sensors/irrigation"
        );

    return result;

}


// =====================================================
// DASHBOARD ANALYTICS
// =====================================================

async function getDashboardAnalytics() {

    try {

        const [
            statistics,
            light,
            water,
            irrigation,
            daily
        ] = await Promise.all([

            getSensorStatistics(),

            getLightStatistics(),

            getWaterStatistics(),

            getIrrigationStatistics(),

            getDailySummary()

        ]);


        return {
            statistics,
            light,
            water,
            irrigation,
            daily
        };

    } catch (error) {

        console.error(
            "Dashboard analytics error:",
            error
        );

        throw error;

    }

}


// =====================================================
// PEST DETECTION API (YOLO11s best (1).pt)
// =====================================================

async function getPestModelInfo() {
    return fetchAPI("/pests/model-info");
}

async function detectPest(imageBlob, conf = 0.35) {
    const form = new FormData();
    form.append("image", imageBlob, "pest_capture.jpg");

    const confParam = conf !== undefined ? `?conf=${encodeURIComponent(conf)}` : "";
    const response = await fetch(`${API_BASE_URL}/pests/detect${confParam}`, {
        method: "POST",
        body: form
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Pest detection failed with status ${response.status}`);
    }

    return response.json();
}


// =====================================================
// PLANT IDENTIFICATION & CARE API
// =====================================================

async function identifyPlant(imageBlob) {
    const form = new FormData();
    form.append("image", imageBlob, "crop_capture.jpg");

    const response = await fetch(`${API_BASE_URL}/crop-growth/identify`, {
        method: "POST",
        body: form
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Plant identification failed with status ${response.status}`);
    }

    return response.json();
}

async function getLatestPlantIdentification() {
    const response = await fetch(`${API_BASE_URL}/crop-growth/identification/latest`);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result.data;
}

async function getPlantIdentificationHistory(limit = 30) {
    const response = await fetch(`${API_BASE_URL}/crop-growth/identification/history?limit=${limit}`);
    if (!response.ok) {
        return [];
    }
    const result = await response.json();
    return result.data || [];
}


// =====================================================
// PLANT DISEASE DIAGNOSIS API (plant_disease_model.pt)
// =====================================================

async function getDiseaseModelInfo() {
    return fetchAPI("/crop-health/model-info");
}

async function diagnoseCropDisease(imageBlob) {
    const form = new FormData();
    form.append("image", imageBlob, "disease_scan.jpg");

    const response = await fetch(`${API_BASE_URL}/crop-health/diagnose`, {
        method: "POST",
        body: form
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Crop disease diagnosis failed with status ${response.status}`);
    }

    return response.json();
}


// =====================================================
// RASPBERRY PI GATEWAY API
// =====================================================

async function getGatewayStatus() {
    return fetchAPI("/sensors/gateway/status");
}