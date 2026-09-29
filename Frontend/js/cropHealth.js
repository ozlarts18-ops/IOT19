// =====================================================
// AI CROP HEALTH & DISEASE DIAGNOSIS (plant_disease_model.pt)
// + LIVE CAMERA STUDIO & RASPBERRY PI GATEWAY MONITOR
// IOT19 SMART AGRICULTURE SYSTEM
// =====================================================

const CROP_HEALTH_API = "http://localhost:5000/api/crop-health/latest";
let cachedDiseaseClasses = [];
let diseaseStream = null;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🌱 AI Crop Health & Disease module initialized (plant_disease_model.pt ResNet-18)");
    loadCropHealth();
    loadDiseaseModelInfo();
    setupDiseaseCameraControls();
    setupDiseaseSampleButtons();
    setupDiseaseClassesModal();
    initGatewayTelemetryMonitor();
});


// =====================================================
// THREE-STATE CAMERA FRAME CONTROLLER (CROP DISEASE)
// =====================================================

function showDiseaseLive() {
    const video = document.getElementById("diseaseCameraVideo");
    const image = document.getElementById("diseaseCapturedImage");
    const placeholder = document.getElementById("diseaseCameraOff");
    const statusText = document.getElementById("diseaseCameraStatus");
    const liveBadge = document.getElementById("diseaseLiveBadge");

    if (video) video.style.display = "block";
    if (image) image.style.display = "none";
    if (placeholder) placeholder.style.display = "none";
    if (liveBadge) liveBadge.style.display = "inline-flex";
    if (statusText) {
        statusText.textContent = "● Live Streaming";
        statusText.style.background = "#dcfce7";
        statusText.style.color = "#15803d";
        statusText.style.borderColor = "#86efac";
    }
}

function showDiseaseResult(imageSrc) {
    const video = document.getElementById("diseaseCameraVideo");
    const image = document.getElementById("diseaseCapturedImage");
    const legacyPreview = document.getElementById("cropHealthImage");
    const placeholder = document.getElementById("diseaseCameraOff");
    const statusText = document.getElementById("diseaseCameraStatus");
    const liveBadge = document.getElementById("diseaseLiveBadge");

    if (video) video.style.display = "none";
    if (image) {
        image.src = imageSrc;
        image.style.display = "block";
    }
    if (legacyPreview) {
        legacyPreview.src = imageSrc;
        legacyPreview.style.display = "block";
    }
    if (placeholder) placeholder.style.display = "none";
    if (liveBadge) liveBadge.style.display = "none";
    if (statusText) {
        statusText.textContent = "Snapshot Captured";
        statusText.style.background = "#e0f2fe";
        statusText.style.color = "#0369a1";
        statusText.style.borderColor = "#7dd3fc";
    }
}

function showDiseaseIdle(message = "Camera is Offline") {
    const video = document.getElementById("diseaseCameraVideo");
    const image = document.getElementById("diseaseCapturedImage");
    const placeholder = document.getElementById("diseaseCameraOff");
    const placeholderText = document.getElementById("disease-placeholder-text");
    const statusText = document.getElementById("diseaseCameraStatus");
    const liveBadge = document.getElementById("diseaseLiveBadge");

    if (video) video.style.display = "none";
    if (image) image.style.display = "none";
    if (placeholder) placeholder.style.display = "flex";
    if (placeholderText && message) placeholderText.textContent = message;
    if (liveBadge) liveBadge.style.display = "none";
    if (statusText) {
        statusText.textContent = "Camera Off";
        statusText.style.background = "#f1f5f9";
        statusText.style.color = "#64748b";
        statusText.style.borderColor = "#cbd5e1";
    }
}


// =====================================================
// SETUP DISEASE CAMERA CONTROLS (LIVE STREAM & UPLOAD)
// =====================================================

function setupDiseaseCameraControls() {
    const startBtn = document.getElementById("startDiseaseCamera");
    const stopBtn = document.getElementById("stopDiseaseCamera");
    const captureBtn = document.getElementById("captureDiseaseCamera");
    const uploadBtn = document.getElementById("uploadDiseaseBtn");
    const fileInput = document.getElementById("diseaseFileInput");
    const video = document.getElementById("diseaseCameraVideo");

    // 1. Start live webcam stream
    if (startBtn) {
        startBtn.addEventListener("click", async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Camera access is not supported by your browser environment.");
                return;
            }

            try {
                startBtn.disabled = true;
                startBtn.innerHTML = "⌛ Connecting...";

                diseaseStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "environment"
                    },
                    audio: false
                });

                if (video) {
                    video.srcObject = diseaseStream;
                    await video.play();
                }

                showDiseaseLive();

                if (stopBtn) stopBtn.disabled = false;
                if (captureBtn) captureBtn.disabled = false;
                startBtn.innerHTML = "▶ Camera Active";

                console.log("📷 Live disease camera stream started.");
            } catch (err) {
                console.error("Disease camera start error:", err);
                alert("Could not start disease camera: " + err.message);
                startBtn.disabled = false;
                startBtn.innerHTML = "▶ Start Camera";
                showDiseaseIdle("Camera Access Denied or Unavailable");
            }
        });
    }

    // 2. Stop live camera stream
    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            if (diseaseStream) {
                diseaseStream.getTracks().forEach(track => track.stop());
                diseaseStream = null;
            }
            if (video) {
                video.srcObject = null;
            }

            showDiseaseIdle("Camera Stopped");

            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = "▶ Start Camera";
            }
            stopBtn.disabled = true;
            if (captureBtn) captureBtn.disabled = true;

            console.log("🛑 Live disease camera stream stopped.");
        });
    }

    // 3. Capture frame from live video and diagnose
    if (captureBtn) {
        captureBtn.addEventListener("click", () => {
            if (!video || !diseaseStream) {
                alert("Please start the live camera before capturing a leaf photo.");
                return;
            }

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
            showDiseaseResult(dataUrl);

            canvas.toBlob((blob) => {
                if (blob) {
                    handleDiseaseImage(blob);
                }
            }, "image/jpeg", 0.92);
        });
    }

    // 4. File upload trigger & file selection
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    showDiseaseResult(re.target.result);
                };
                reader.readAsDataURL(file);

                handleDiseaseImage(file);
            }
        });
    }
}


// =====================================================
// LOAD DISEASE MODEL METADATA (plant_disease_model.pt)
// =====================================================

async function loadDiseaseModelInfo() {
    try {
        let modelData = null;
        if (typeof getDiseaseModelInfo === "function") {
            const res = await getDiseaseModelInfo();
            modelData = res.model || res.data || res;
        } else {
            const res = await fetch("http://localhost:5000/api/crop-health/model-info");
            const j = await res.json();
            modelData = j.model;
        }

        if (modelData) {
            const modelName = modelData.model_name || "plant_disease_model.pt";
            const classes = modelData.classes_parsed || modelData.classes || [];
            const totalClasses = modelData.total_classes || classes.length || 38;
            cachedDiseaseClasses = classes;

            // Update UI elements
            const modelNameEls = document.querySelectorAll(".disease-active-model-name");
            modelNameEls.forEach(el => el.textContent = modelName);

            const badge = document.getElementById("diseaseModelBadge");
            if (badge) {
                badge.textContent = `${modelName} • ResNet-18 (${totalClasses} Classes)`;
            }

            const statusDot = document.getElementById("diseaseModelStatusDot");
            if (statusDot) {
                statusDot.style.background = "#22c55e";
                statusDot.title = `Active Model: ${modelName} (ResNet-18, ${totalClasses} classes)`;
            }

            renderDiseaseClassesDirectory(classes);
            console.log(`🌿 Disease model connected: ${modelName} (${totalClasses} classes)`);
        }
    } catch (e) {
        console.warn("Could not load disease model info directly:", e.message);
    }
}


// =====================================================
// LOAD LATEST AI CROP HEALTH RECORD
// =====================================================

async function loadCropHealth() {
    try {
        console.log("🤖 Loading latest AI Crop Health...");

        const response = await fetch(CROP_HEALTH_API);
        if (!response.ok) {
            throw new Error("Crop health API error: " + response.status);
        }

        const result = await response.json();
        const data = result.data || {};

        updateCropHealthUI(data);

    } catch (error) {
        console.error("❌ Crop Health error:", error);
        updateCropHealthElement("healthScore", "0%");
        updateCropHealthElement("healthStatus", "UNKNOWN");
        updateCropHealthElement("healthMessage", "System ready for crop health analysis.");
        updateCropHealthElement("healthBadge", "READY");
    }
}


// =====================================================
// UPDATE DOM WITH CROP HEALTH & DISEASE DATA
// =====================================================

function updateCropHealthUI(data) {
    const health = Number(data.healthScore ?? data.health ?? 0);
    const status = data.status || "UNKNOWN";
    const diagnosis = data.diagnosis || "ANALYZING";
    const crop = data.crop || "";
    const disease = data.disease || "";
    const confidence = Number(data.confidence || 0);
    const treatment = data.treatment || "";
    const imageUrl = data.imageUrl || "";
    const top5 = data.topDetections || data.top5_predictions || [];

    // Health Score
    const scoreElement = document.getElementById("healthScore");
    if (scoreElement) {
        scoreElement.textContent = health > 0 ? `${Math.round(health)}%` : "0%";
        scoreElement.style.color = health >= 80 ? "#15803d" : health >= 60 ? "#d97706" : "#dc2626";
    }

    // Status label
    const statusElement = document.getElementById("healthStatus");
    if (statusElement) {
        statusElement.textContent = status === "HEALTHY" 
            ? "Healthy Foliage" 
            : status === "INFECTED" 
                ? "Pathogen Detected" 
                : status;
        statusElement.style.color = status === "HEALTHY" ? "#15803d" : status === "INFECTED" ? "#dc2626" : "#0f172a";
    }

    // Message / Diagnosis
    const messageElement = document.getElementById("healthMessage");
    if (messageElement) {
        messageElement.textContent = diagnosis;
    }

    // Badge
    const badgeElement = document.getElementById("healthBadge");
    if (badgeElement) {
        badgeElement.textContent = status.toUpperCase();
        badgeElement.className = `health-badge ${status === "HEALTHY" ? "badge-healthy" : status === "INFECTED" ? "badge-infected" : ""}`;
        if (status === "HEALTHY") {
            badgeElement.style.background = "#dcfce7";
            badgeElement.style.color = "#15803d";
        } else if (status === "INFECTED") {
            badgeElement.style.background = "#fee2e2";
            badgeElement.style.color = "#b91c1c";
        }
    }

    // Specific crop and disease tags
    const cropEl = document.getElementById("diseaseCropName");
    if (cropEl) cropEl.textContent = crop || "General Crop";

    const diseaseEl = document.getElementById("diseaseName");
    if (diseaseEl) diseaseEl.textContent = disease || (status === "HEALTHY" ? "None (Optimal)" : "Analyzing");

    const confEl = document.getElementById("diseaseConfidenceVal");
    if (confEl) confEl.textContent = confidence > 0 ? `${confidence}%` : "--";

    // Treatment Card
    const treatmentCard = document.getElementById("diseaseTreatmentCard");
    const treatmentText = document.getElementById("diseaseTreatmentText");
    if (treatmentCard && treatmentText) {
        if (treatment && treatment.trim().length > 0) {
            treatmentText.textContent = treatment;
            treatmentCard.style.display = "block";
        } else {
            treatmentCard.style.display = "none";
        }
    }

    // Image preview
    if (imageUrl) {
        const fullSrc = imageUrl.startsWith("data:") ? imageUrl : `http://localhost:5000${imageUrl}`;
        showDiseaseResult(fullSrc);
    }

    // Render Top-5 Predictions
    renderDiseaseTop5(top5);
}


// =====================================================
// HANDLE DIAGNOSIS ON AN IMAGE
// =====================================================

async function handleDiseaseImage(imageSource) {
    console.log("🔬 Diagnosing plant disease using plant_disease_model.pt (ResNet-18)...");

    // UI feedback while analyzing
    updateCropHealthElement("healthStatus", "Scanning foliage...");
    updateCropHealthElement("healthMessage", "Analyzing plant leaf with PyTorch ResNet-18 [plant_disease_model.pt]...");
    updateCropHealthElement("healthBadge", "ANALYZING");

    const statusText = document.getElementById("diseaseCameraStatus");
    if (statusText) {
        statusText.textContent = "Analyzing Leaf...";
        statusText.style.background = "#fef3c7";
        statusText.style.color = "#b45309";
    }

    try {
        let blob = imageSource;

        if (typeof imageSource === "string" && imageSource.startsWith("data:")) {
            blob = dataURLtoBlob(imageSource);
            showDiseaseResult(imageSource);
        } else if (typeof imageSource === "string") {
            showDiseaseResult(imageSource);
            const res = await fetch(imageSource);
            blob = await res.blob();
        } else if (blob instanceof Blob) {
            showDiseaseResult(URL.createObjectURL(blob));
        }

        const response = await diagnoseCropDisease(blob);

        if (!response || !response.success) {
            throw new Error(response ? response.message : "Diagnosis returned empty response");
        }

        const data = response.data || {};
        updateCropHealthUI(data);

        console.log(`✅ Disease diagnosis complete: ${data.diagnosis} (${data.confidence}%)`);

    } catch (err) {
        console.error("❌ handleDiseaseImage error:", err);
        updateCropHealthElement("healthStatus", "Diagnosis Error");
        updateCropHealthElement("healthMessage", "Could not complete diagnosis: " + err.message);
        updateCropHealthElement("healthBadge", "ERROR");
    }
}


// =====================================================
// RENDER TOP-5 PREDICTIONS
// =====================================================

function renderDiseaseTop5(top5) {
    const container = document.getElementById("diseaseTop5List");
    if (!container) return;

    if (!top5 || !top5.length) {
        container.innerHTML = `<div style="text-align: center; color: #64748b; padding: 12px; font-size: 13px;">No recent diagnosis breakdown available.</div>`;
        return;
    }

    container.innerHTML = top5.map((item, i) => {
        const prob = item.probabilityPercent ?? (item.probability ? Math.round(item.probability * 100) : 0);
        const name = item.disease ? `${item.crop} — ${item.disease}` : (item.className || "Class");
        const isHealthy = item.isHealthy ?? (name.toLowerCase().includes("healthy"));
        const color = isHealthy ? "#16a34a" : "#ea580c";

        return `
            <div class="disease-top-item">
                <div class="disease-top-meta">
                    <span class="disease-top-rank">#${i + 1}</span>
                    <strong class="disease-top-name">${name}</strong>
                    <span class="disease-top-pct" style="color: ${color};">${prob}%</span>
                </div>
                <div class="disease-bar-bg">
                    <div class="disease-bar-fill" style="width: ${prob}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }).join("");
}


// =====================================================
// QUICK TEST SAMPLES
// =====================================================

function setupDiseaseSampleButtons() {
    const sampleBtns = document.querySelectorAll("[data-disease-sample]");
    sampleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const path = btn.getAttribute("data-disease-sample");
            if (path) {
                console.log("Testing disease sample:", path);
                handleDiseaseImage(path);
            }
        });
    });
}


// =====================================================
// 38 PLANT DISEASE CLASSES DIRECTORY MODAL
// =====================================================

function setupDiseaseClassesModal() {
    const openBtn = document.getElementById("viewDiseaseClassesBtn");
    const modal = document.getElementById("diseaseClassesModal");
    const closeBtn = document.getElementById("closeDiseaseClassesModal");
    const searchInput = document.getElementById("diseaseClassesSearchInput");

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
            const filtered = cachedDiseaseClasses.filter(c => {
                const text = typeof c === "string" ? c : `${c.crop} ${c.disease} ${c.raw_class}`;
                return text.toLowerCase().includes(q);
            });
            renderDiseaseClassesDirectory(filtered);
        });
    }
}

function renderDiseaseClassesDirectory(classes) {
    const container = document.getElementById("diseaseClassesGrid");
    if (!container) return;

    if (!classes || !classes.length) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">No matching disease classes found.</div>`;
        return;
    }

    container.innerHTML = classes.map((c, i) => {
        const crop = typeof c === "object" ? c.crop : c.split("___")[0].replace(/_/g, " ");
        const disease = typeof c === "object" ? c.disease : (c.split("___")[1] || "Healthy").replace(/_/g, " ");
        const isHealthy = typeof c === "object" ? c.is_healthy : disease.toLowerCase().includes("healthy");

        return `
            <div class="disease-class-pill ${isHealthy ? 'pill-healthy' : ''}">
                <span class="pill-id">#${i + 1}</span>
                <div class="pill-content">
                    <strong class="pill-crop">${crop}</strong>
                    <span class="pill-disease ${isHealthy ? 'text-healthy' : ''}">${disease}</span>
                </div>
            </div>
        `;
    }).join("");
}


// =====================================================
// RASPBERRY PI GATEWAY MONITOR
// =====================================================

function initGatewayTelemetryMonitor() {
    updateGatewayStatusUI();
    setInterval(updateGatewayStatusUI, 3000);
}

async function updateGatewayStatusUI() {
    try {
        const res = await fetch("http://localhost:5000/api/sensors/gateway/status");
        if (!res.ok) return;
        const json = await res.json();
        const gateway = json.gateway || {};

        const badge = document.getElementById("rpiGatewayBadge");
        const lastSeenEl = document.getElementById("rpiLastSeen");
        const lightPill = document.getElementById("rpiLightStatusPill");
        const tankPill = document.getElementById("rpiTankStatusPill");
        const soilPill = document.getElementById("rpiSoilStatusPill");
        const fanPill = document.getElementById("rpiFanStatusPill");

        if (badge) {
            if (gateway.activeConnection) {
                badge.textContent = "● ONLINE (Streaming)";
                badge.className = "rpi-badge rpi-badge-online";
            } else if (gateway.lastSeen) {
                badge.textContent = "○ STANDBY (Last seen)";
                badge.className = "rpi-badge rpi-badge-standby";
            } else {
                badge.textContent = "○ WAITING FOR PI";
                badge.className = "rpi-badge rpi-badge-offline";
            }
        }

        if (lastSeenEl) {
            if (gateway.lastSeen) {
                const diffSec = Math.round((Date.now() - new Date(gateway.lastSeen).getTime()) / 1000);
                lastSeenEl.textContent = diffSec < 5 ? "Just now" : `${diffSec}s ago (${new Date(gateway.lastSeen).toLocaleTimeString()})`;
            } else {
                lastSeenEl.textContent = "No telemetry received yet";
            }
        }

        if (gateway.lastPayload) {
            const p = gateway.lastPayload;
            if (lightPill) lightPill.textContent = `Lux: ${p.lux} | Light: ${p.growLightStatus ? 'ON' : 'OFF'}`;
            if (tankPill) tankPill.textContent = `Water: ${p.waterLevel}% | Motor: ${p.tankMotor ? 'ON' : 'OFF'}`;
            if (soilPill) soilPill.textContent = `Soil: ${p.soilMoisture}% | Pump: ${p.pumpStatus ? 'ON' : 'OFF'}`;
            if (fanPill) fanPill.textContent = `Temp: ${p.temperature}°C | Fan: ${p.fanStatus ? 'ON' : 'OFF'}`;
        }
    } catch (e) {
        // Silently handle offline gateway polling
    }
}


// =====================================================
// UTILS
// =====================================================

function updateCropHealthElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value ?? "--";
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