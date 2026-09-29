// =====================================================
// PEST DETECTION (YOLO11s POWERED - best (1).pt)
// IOT19 SMART AGRICULTURE SYSTEM
// =====================================================

const PEST_API = "http://localhost:5000/api/pests";
let currentPestThreshold = 0.35;
let cachedPestClasses = [];
let lastAnnotatedImage = null;


// =====================================================
// DOM ELEMENT HELPERS (SUPPORT MULTIPLE IDS)
// =====================================================

function getEl(...ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

function getCurrentThreshold() {
    const slider = document.getElementById("pestThresholdSlider");
    if (slider) {
        const val = parseFloat(slider.value);
        if (!isNaN(val) && val > 0 && val < 1) {
            return val;
        }
    }
    return currentPestThreshold;
}


// =====================================================
// THREE-STATE CAMERA FRAME CONTROLLER
// =====================================================

function showLive() {
    const video = getEl("pestCameraVideo", "liveFeed");
    const resultImg = getEl("pestCapturedImage", "resultFrame");
    const placeholder = getEl("pestCameraOff", "camera-placeholder");
    const statusText = getEl("pestCameraStatus", "camera-status-badge");
    const liveBadge = getEl("pestLiveBadge");

    if (video) video.style.display = "block";
    if (resultImg) resultImg.style.display = "none";
    if (placeholder) placeholder.style.display = "none";
    if (statusText) statusText.textContent = "Camera On";
    if (liveBadge) liveBadge.style.display = "block";
}

function showResult(imageDataUrl) {
    const video = getEl("pestCameraVideo", "liveFeed");
    const resultImg = getEl("pestCapturedImage", "resultFrame");
    const placeholder = getEl("pestCameraOff", "camera-placeholder");
    const statusText = getEl("pestCameraStatus", "camera-status-badge");
    const liveBadge = getEl("pestLiveBadge");

    if (video) video.style.display = "none";
    if (resultImg) {
        resultImg.style.display = "block";
        resultImg.src = imageDataUrl;
    }
    if (placeholder) placeholder.style.display = "none";
    if (statusText) statusText.textContent = "Detection Ready";
    if (liveBadge) liveBadge.style.display = "none";

    lastAnnotatedImage = imageDataUrl;
    const downloadBtn = document.getElementById("downloadPestResultBtn");
    if (downloadBtn && imageDataUrl) {
        downloadBtn.style.display = "inline-flex";
    }
}

function showIdle() {
    const video = getEl("pestCameraVideo", "liveFeed");
    const resultImg = getEl("pestCapturedImage", "resultFrame");
    const placeholder = getEl("pestCameraOff", "camera-placeholder");
    const placeholderText = getEl("camera-placeholder-text");
    const statusText = getEl("pestCameraStatus", "camera-status-badge");
    const liveBadge = getEl("pestLiveBadge");

    if (video) video.style.display = "none";
    if (resultImg) resultImg.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (placeholderText) placeholderText.textContent = "N/A";
    if (statusText) statusText.textContent = "Camera Off";
    if (liveBadge) liveBadge.style.display = "none";
}


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🐛 Pest Detection module initialized (best (1).pt YOLO11s)");
    showIdle();
    loadPestModelInfo();
    loadPestDetection();
    setupPestCameraControls();
    setupPestThresholdControls();
    setupPestSampleButtons();
    setupPestClassesModal();
    setupDownloadButton();
});


// =====================================================
// LOAD MODEL METADATA (best (1).pt)
// =====================================================

async function loadPestModelInfo() {
    try {
        let modelData = null;
        if (typeof getPestModelInfo === "function") {
            const res = await getPestModelInfo();
            modelData = res.model || res.data || res;
        } else {
            const res = await fetch("http://localhost:5000/api/pests/model-info");
            const j = await res.json();
            modelData = j.model;
        }

        if (modelData) {
            const modelName = modelData.model_name || modelData.model_file || "best (1).pt";
            const classes = modelData.classes || [];
            const totalClasses = modelData.total_classes || classes.length || 102;
            cachedPestClasses = classes;

            // Update UI model tags
            const modelNameEls = document.querySelectorAll(".pest-active-model-name");
            modelNameEls.forEach(el => el.textContent = modelName);

            const modelBadge = document.getElementById("pestModelBadge");
            if (modelBadge) {
                modelBadge.textContent = `${modelName} • YOLO11s (${totalClasses} Classes)`;
            }

            const modelStatusDot = document.getElementById("pestModelStatusDot");
            if (modelStatusDot) {
                modelStatusDot.style.background = "#22c55e";
                modelStatusDot.title = `Active Model: ${modelName} (${totalClasses} classes)`;
            }

            const totalClassesEl = document.getElementById("pestTotalClassesCount");
            if (totalClassesEl) {
                totalClassesEl.textContent = totalClasses;
            }

            renderPestClassesDirectory(classes);
            console.log(`🤖 Pest model connected: ${modelName} (${totalClasses} classes)`);
        }
    } catch (e) {
        console.warn("Could not load pest model info directly:", e.message);
    }
}


// =====================================================
// LOAD EXISTING PEST HISTORY
// =====================================================

async function loadPestDetection() {
    try {
        const response = await fetch(PEST_API);
        if (!response.ok) {
            throw new Error(`Pest API failed: ${response.status}`);
        }

        const result = await response.json();
        const pests = result.pests || result.data || [];
        updatePestDetection(pests);
        return pests;
    } catch (error) {
        console.error("Pest detection load error:", error);
        return [];
    }
}


// =====================================================
// HANDLE REAL INFERENCE ON CAPTURED / UPLOADED IMAGE
// =====================================================

async function handlePestImage(imageSource) {
    console.log("🔍 Running YOLO11 Pest Detection on image using best (1).pt...");

    // UI feedback while analyzing
    const video = getEl("pestCameraVideo", "liveFeed");
    const resultImg = getEl("pestCapturedImage", "resultFrame");
    const placeholder = getEl("pestCameraOff", "camera-placeholder");
    const placeholderText = getEl("camera-placeholder-text");
    const statusText = getEl("pestCameraStatus", "camera-status-badge");

    if (video) video.style.display = "none";
    if (resultImg) resultImg.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (placeholderText) placeholderText.textContent = "Analyzing with best (1).pt...";
    if (statusText) statusText.textContent = "Analyzing...";

    setPestValue("detectedPest", "Analyzing...");
    setPestValue("detected-pest", "Analyzing...");
    setPestValue("pestConfidence", "...");
    setPestValue("detection-confidence", "...");
    setPestValue("pestSeverity", "ANALYZING");
    setPestValue("pest-severity", "ANALYZING");

    try {
        let blob = imageSource;

        // If data URL string, convert to Blob
        if (typeof imageSource === "string" && imageSource.startsWith("data:")) {
            blob = dataURLtoBlob(imageSource);
        } else if (typeof imageSource === "string") {
            // URL to photo
            const imgRes = await fetch(imageSource);
            blob = await imgRes.blob();
        }

        const threshold = getCurrentThreshold();
        const response = await detectPest(blob, threshold);

        if (!response || !response.success) {
            showIdle();
            setPestValue("detectedPest", "Detection Error");
            setPestValue("detected-pest", "Detection Error");
            setPestValue("pestConfidence", "0%");
            setPestValue("detection-confidence", "0%");
            setPestValue("pestSeverity", "NONE");
            setPestValue("pest-severity", "NONE");
            return;
        }

        const data = response.data || {};
        const detectedPest = data.detectedPest || "None";
        const confidence = Number(data.confidence || 0);
        const severity = data.severity || "NONE";
        const allDetections = data.allDetections || [];
        const annotatedImage = data.annotatedImage || null;
        const modelUsed = data.modelName || response.model || "best (1).pt";
        const inferenceMs = data.inferenceMs || 0;

        const displayConf = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);

        // Show annotated image in the smart camera box itself
        if (annotatedImage) {
            showResult(annotatedImage);
        } else if (typeof imageSource === "string") {
            showResult(imageSource);
        } else {
            showIdle();
        }

        // Update main KPI cards
        setPestValue("detectedPest", detectedPest);
        setPestValue("detected-pest", detectedPest);
        setPestValue("pestConfidence", `${displayConf}%`);
        setPestValue("detection-confidence", `${displayConf}%`);
        setPestValue("pestSeverity", severity);
        setPestValue("pest-severity", severity);

        // Style severity indicator
        updateSeverityBadge(severity);

        // Render top class counters
        renderTopClassCounts(allDetections);

        // Render detailed detections breakdown panel
        renderDetailedDetections(allDetections, modelUsed, inferenceMs, displayConf);

        // Refresh charts
        if (typeof window.refreshPestCharts === "function") {
            window.refreshPestCharts();
        }

        console.log(`✅ YOLO11 [${modelUsed}] Detection complete: ${detectedPest} (${displayConf}%, ${severity}) in ${inferenceMs}ms`);

    } catch (error) {
        console.error("❌ handlePestImage error:", error);
        showIdle();
        setPestValue("detectedPest", "Error");
        setPestValue("detected-pest", "Error");
        setPestValue("pestConfidence", "0%");
        setPestValue("detection-confidence", "0%");
        setPestValue("pestSeverity", "ERROR");
        setPestValue("pest-severity", "ERROR");
    }
}


// Wire global callback for camera.js
window.onPestImageCaptured = function (imageData) {
    handlePestImage(imageData);
};


// =====================================================
// RENDER DYNAMIC TOP DETECTED CLASSES
// =====================================================

function renderTopClassCounts(detections) {
    const container = document.getElementById("pest-class-counters");
    if (!container) return;

    if (!detections || !detections.length) {
        container.innerHTML = `
            <div class="pest-card" style="grid-column: 1 / -1; text-align: center; padding: 18px;">
                <span style="font-size: 13px; color: #166534; font-weight: 600;">🌿 YOLO11 [best (1).pt] Evaluation</span>
                <strong style="color: #15803d; font-size: 16px; margin-top: 4px; display: block;">Clean Crop — No Pest Activity Detected</strong>
                <small style="color: #64748b;">No agricultural pests matched above the threshold.</small>
            </div>
        `;
        return;
    }

    const counts = {};
    detections.forEach(d => {
        const name = d.class_name || `Class ${d.class_id}`;
        counts[name] = (counts[name] || 0) + 1;
    });

    const topClasses = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    container.innerHTML = topClasses.map(([name, count]) => `
        <div class="pest-card">
            <span title="${name}">${name}</span>
            <strong>${count}</strong>
        </div>
    `).join("");
}


// =====================================================
// RENDER DETAILED DETECTION BREAKDOWN
// =====================================================

function renderDetailedDetections(detections, modelName, inferenceMs, displayConf) {
    const panel = document.getElementById("pestDetailedResults");
    if (!panel) return;

    panel.style.display = "block";

    const metaEl = document.getElementById("pestDetectionMeta");
    if (metaEl) {
        metaEl.innerHTML = `
            <div class="pest-meta-badge">Model: <strong>${modelName}</strong></div>
            <div class="pest-meta-badge">Speed: <strong>${inferenceMs} ms</strong></div>
            <div class="pest-meta-badge">Detections: <strong>${detections ? detections.length : 0}</strong></div>
            <div class="pest-meta-badge">Primary Confidence: <strong>${displayConf}%</strong></div>
        `;
    }

    const listEl = document.getElementById("pestDetectionsList");
    if (!listEl) return;

    if (!detections || detections.length === 0) {
        listEl.innerHTML = `
            <div style="padding: 16px; text-align: center; color: #15803d; background: #f0fdf4; border-radius: 8px;">
                ✓ <strong>Crop is Clean</strong>: No pest instances detected in this frame.
            </div>
        `;
        return;
    }

    listEl.innerHTML = detections.map((d, idx) => {
        const confPct = Math.round((d.confidence || 0) * 100);
        const bbox = d.bbox ? `[${d.bbox.join(", ")}]` : "N/A";
        return `
            <div class="pest-detection-item">
                <div class="pest-item-header">
                    <span class="pest-item-rank">#${idx + 1}</span>
                    <strong class="pest-item-name">${d.class_name || "Pest"}</strong>
                    <span class="pest-item-conf">${confPct}%</span>
                </div>
                <div class="pest-item-meter-bg">
                    <div class="pest-item-meter-fill" style="width: ${confPct}%;"></div>
                </div>
                <div class="pest-item-coords">Bounding Box: ${bbox} (Class ID: ${d.class_id})</div>
            </div>
        `;
    }).join("");
}


// =====================================================
// THRESHOLD SLIDER CONTROLS
// =====================================================

function setupPestThresholdControls() {
    const slider = document.getElementById("pestThresholdSlider");
    const label = document.getElementById("pestThresholdVal");
    if (slider && label) {
        slider.addEventListener("input", (e) => {
            const pct = Math.round(e.target.value * 100);
            label.textContent = `${pct}%`;
            currentPestThreshold = parseFloat(e.target.value);
        });
    }
}


// =====================================================
// QUICK TEST SAMPLES BAR
// =====================================================

function setupPestSampleButtons() {
    const buttons = document.querySelectorAll("[data-pest-sample]");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const samplePath = btn.getAttribute("data-pest-sample");
            if (samplePath) {
                console.log("Loading pest sample:", samplePath);
                handlePestImage(samplePath);
            }
        });
    });
}


// =====================================================
// 102 PEST CLASSES DIRECTORY MODAL
// =====================================================

function setupPestClassesModal() {
    const openBtn = document.getElementById("viewPestClassesBtn");
    const modal = document.getElementById("pestClassesModal");
    const closeBtn = document.getElementById("closePestClassesModal");
    const searchInput = document.getElementById("pestClassesSearchInput");

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "flex";
            if (searchInput) searchInput.focus();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = cachedPestClasses.filter(c => c.toLowerCase().includes(q));
            renderPestClassesDirectory(filtered);
        });
    }
}

function renderPestClassesDirectory(classes) {
    const container = document.getElementById("pestClassesGrid");
    if (!container) return;

    if (!classes || !classes.length) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">No matching classes found.</div>`;
        return;
    }

    container.innerHTML = classes.map((c, i) => `
        <div class="pest-class-pill">
            <span class="pill-id">#${i + 1}</span>
            <span class="pill-name">${c}</span>
        </div>
    `).join("");
}


// =====================================================
// DOWNLOAD RESULT BUTTON
// =====================================================

function setupDownloadButton() {
    const btn = document.getElementById("downloadPestResultBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            if (!lastAnnotatedImage) return;
            const a = document.createElement("a");
            a.href = lastAnnotatedImage;
            a.download = `best1_pest_detection_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}


// =====================================================
// SETUP PEST CAMERA CONTROLS (PEST SECTION SPECIFIC)
// =====================================================

function setupPestCameraControls() {
    let pestStream = null;

    const startBtn = getEl("startPestCamera", "startCameraBtn");
    const stopBtn = getEl("stopPestCamera", "stopCameraBtn");
    const captureBtn = getEl("capturePestCamera", "captureBtn");
    const uploadBtn = getEl("uploadPestCamera", "uploadBtn");
    const fileInput = getEl("pestCameraFileInput", "pestFileInput");
    const video = getEl("pestCameraVideo", "liveFeed");

    if (startBtn) {
        startBtn.addEventListener("click", async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    alert("Camera access is not supported on this browser.");
                    return;
                }

                pestStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
                    audio: false
                });

                if (video) {
                    video.srcObject = pestStream;
                }

                showLive();

                startBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                if (captureBtn) captureBtn.disabled = false;

            } catch (err) {
                console.error("Pest camera error:", err);
                alert("Could not start pest camera: " + err.message);
                showIdle();
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            if (pestStream) {
                pestStream.getTracks().forEach(t => t.stop());
                pestStream = null;
            }
            if (video) {
                video.srcObject = null;
            }

            showIdle();

            if (startBtn) startBtn.disabled = false;
            stopBtn.disabled = true;
            if (captureBtn) captureBtn.disabled = true;
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener("click", () => {
            if (!video || !pestStream) return;

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (!blob) return;
                handlePestImage(blob);
            }, "image/jpeg", 0.9);
        });
    }

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Trigger YOLO detection with the uploaded file
            handlePestImage(file);
        });
    }
}


// =====================================================
// UI HELPERS
// =====================================================

function setPestValue(idOrClass, text) {
    const el = document.getElementById(idOrClass) ||
               document.getElementById(idOrClass.replace(/([A-Z])/g, "-$1").toLowerCase()) ||
               document.querySelector(`[data-pest-value='${idOrClass}']`);
    if (el) {
        el.textContent = text;
    }
}

function updateSeverityBadge(severity) {
    const el = getEl("pestSeverity", "pest-severity");
    if (!el) return;

    el.className = "big-status-value";
    const sev = String(severity).toUpperCase();
    if (sev === "HIGH" || sev === "CRITICAL") {
        el.style.color = "#dc2626";
    } else if (sev === "MEDIUM") {
        el.style.color = "#d97706";
    } else if (sev === "LOW") {
        el.style.color = "#16a34a";
    } else {
        el.style.color = "#64748b";
    }
}

function updatePestDetection(pests) {
    if (!Array.isArray(pests) || !pests.length) {
        return;
    }
    const latest = pests[0];
    const name = latest.topPest || latest.pestType || "None";
    const conf = Number(latest.confidence || 0);
    const sev = latest.severity || (conf >= 80 ? "HIGH" : conf >= 60 ? "MEDIUM" : "LOW");

    setPestValue("detectedPest", name);
    setPestValue("detected-pest", name);
    setPestValue("pestConfidence", `${conf}%`);
    setPestValue("detection-confidence", `${conf}%`);
    setPestValue("pestSeverity", sev);
    setPestValue("pest-severity", sev);
    updateSeverityBadge(sev);

    if (latest.detections && latest.detections.length) {
        renderTopClassCounts(latest.detections);
        renderDetailedDetections(latest.detections, latest.modelName || "best (1).pt", 0, conf);
    }
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}