// =====================================================
// 📷 IOT19 SMART CAMERA
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("📷 Smart Camera initialized");

    initializeCamera();

});


// =====================================================
// CAMERA VARIABLES
// =====================================================

let cameraStream = null;

let cameraRunning = false;

let lastCapturedImage = null;


// =====================================================
// INITIALIZE CAMERA
// =====================================================

function initializeCamera() {

    const startButton =
        document.getElementById(
            "startCameraBtn"
        );

    const stopButton =
        document.getElementById(
            "stopCameraBtn"
        );

    const captureButton =
        document.getElementById(
            "captureCameraBtn"
        );

    const uploadButton =
        document.getElementById(
            "uploadImageBtn"
        );

    const fileInput =
        document.getElementById(
            "cameraFileInput"
        );


    if (!startButton) {

        console.warn(
            "⚠️ Start Camera button not found"
        );

        return;

    }


    // =================================================
    // BUTTON EVENTS
    // =================================================

    startButton.addEventListener(
        "click",
        startCamera
    );


    stopButton.addEventListener(
        "click",
        stopCamera
    );


    captureButton.addEventListener(
        "click",
        captureImage
    );


    uploadButton.addEventListener(
        "click",
        () => {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        handleImageUpload
    );


    // =================================================
    // INITIAL STATE
    // =================================================

    setCameraOffState();


    console.log(
        "✅ Camera controls ready"
    );

}


// =====================================================
// START CAMERA
// =====================================================

async function startCamera() {

    console.log(
        "📷 Starting camera..."
    );


    try {

        // Check browser support

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            alert(
                "Your browser does not support camera access."
            );

            return;

        }


        // Stop existing stream first

        if (cameraStream) {

            stopCameraStream();

        }


        // Request camera

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    },

                    facingMode: "environment"

                },

                audio: false

            });


        const video =
            document.getElementById(
                "cameraVideo"
            );


        // Assign stream

        video.srcObject =
            cameraStream;


        // Show video

        video.style.display =
            "block";


        // Hide captured image

        const image =
            document.getElementById(
                "capturedImage"
            );


        image.style.display =
            "none";


        // Hide placeholder

        const placeholder =
            document.getElementById(
                "cameraPlaceholder"
            );


        placeholder.style.display =
            "none";


        cameraRunning =
            true;


        // Update UI

        setCameraOnState();


        console.log(
            "✅ Camera started"
        );

    }

    catch (error) {

        console.error(
            "❌ Camera error:",
            error
        );


        cameraRunning =
            false;


        setCameraOffState();


        if (
            error.name ===
            "NotAllowedError"
        ) {

            alert(
                "Camera permission was denied. Please allow camera access in your browser."
            );

        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            alert(
                "No camera was found on this device."
            );

        }

        else if (
            error.name ===
            "NotReadableError"
        ) {

            alert(
                "The camera is already being used by another application."
            );

        }

        else {

            alert(
                "Unable to start camera: " +
                error.message
            );

        }

    }

}


// =====================================================
// STOP CAMERA
// =====================================================

function stopCamera() {

    console.log(
        "🛑 Stopping camera..."
    );


    stopCameraStream();


    const video =
        document.getElementById(
            "cameraVideo"
        );


    video.srcObject =
        null;


    video.style.display =
        "none";


    cameraRunning =
        false;


    setCameraOffState();


    console.log(
        "✅ Camera stopped"
    );

}


// =====================================================
// STOP CAMERA STREAM
// =====================================================

function stopCameraStream() {

    if (!cameraStream) {

        return;

    }


    cameraStream
        .getTracks()
        .forEach(
            track => {

                track.stop();

            }
        );


    cameraStream =
        null;

}


// =====================================================
// CAPTURE IMAGE
// =====================================================

function captureImage() {

    console.log(
        "📸 Capturing image..."
    );


    if (
        !cameraRunning ||
        !cameraStream
    ) {

        alert(
            "Please start the camera first."
        );

        return;

    }


    const video =
        document.getElementById(
            "cameraVideo"
        );


    const canvas =
        document.getElementById(
            "cameraCanvas"
        );


    const image =
        document.getElementById(
            "capturedImage"
        );


    // =================================================
    // CANVAS SIZE
    // =================================================

    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;


    // =================================================
    // DRAW VIDEO FRAME
    // =================================================

    const context =
        canvas.getContext(
            "2d"
        );


    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    // =================================================
    // CONVERT IMAGE
    // =================================================

    const imageData =
        canvas.toDataURL(
            "image/jpeg",
            0.9
        );


    lastCapturedImage =
        imageData;


    // =================================================
    // DISPLAY IMAGE
    // =================================================

    image.src =
        imageData;


    image.style.display =
        "block";


    video.style.display =
        "none";


    // =================================================
    // SHOW INFORMATION
    // =================================================

    const now =
        new Date();


    updateCameraInfo(
        "Captured Image",
        now
    );


    // =================================================
    // STATUS
    // =================================================

    updateCameraStatus(
        "Image Captured",
        "active"
    );


    console.log(
        "✅ Image captured"
    );


    // =================================================
    // OPTIONAL CALLBACKS
    // =================================================

    handleCapturedImage(
        imageData
    );

}


// =====================================================
// HANDLE UPLOADED IMAGE
// =====================================================

function handleImageUpload(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    console.log(
        "📁 Image selected:",
        file.name
    );


    // =================================================
    // VALIDATE FILE
    // =================================================

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please select a valid image file."
        );

        event.target.value =
            "";

        return;

    }


    // =================================================
    // STOP CAMERA IF RUNNING
    // =================================================

    if (cameraRunning) {

        stopCameraStream();

        cameraRunning =
            false;

    }


    // =================================================
    // READ IMAGE
    // =================================================

    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            const imageData =
                e.target.result;


            lastCapturedImage =
                imageData;


            const image =
                document.getElementById(
                    "capturedImage"
                );


            const video =
                document.getElementById(
                    "cameraVideo"
                );


            const placeholder =
                document.getElementById(
                    "cameraPlaceholder"
                );


            // =================================================
            // DISPLAY IMAGE
            // =================================================

            image.src =
                imageData;


            image.style.display =
                "block";


            video.style.display =
                "none";


            placeholder.style.display =
                "none";


            // =================================================
            // INFORMATION
            // =================================================

            updateCameraInfo(
                file.name,
                new Date()
            );


            // =================================================
            // STATUS
            // =================================================

            updateCameraStatus(
                "Image Ready",
                "active"
            );


            console.log(
                "✅ Image uploaded successfully"
            );


            // =================================================
            // OPTIONAL CALLBACK
            // =================================================

            handleCapturedImage(
                imageData
            );

        };


    reader.onerror =
        function () {

            console.error(
                "❌ Unable to read image"
            );


            alert(
                "Unable to read the selected image."
            );

        };


    reader.readAsDataURL(
        file
    );

}


// =====================================================
// HANDLE CAPTURED IMAGE
// =====================================================

function handleCapturedImage(
    imageData
) {

    console.log(
        "🌱 Crop image available"
    );


    /*
       IMPORTANT:

       This function does NOT automatically
       send the image to the backend.

       It makes the image available for:

       - Crop Growth
       - Crop Health
       - Pest Detection
       - AI Analysis
    */


    // Make image available globally

    window.latestCropImage =
        imageData;


    // =================================================
    // CROP GROWTH CALLBACK
    // =================================================

    if (
        typeof window.onCropImageCaptured ===
        "function"
    ) {

        window.onCropImageCaptured(
            imageData
        );

    }


    // =================================================
    // CROP HEALTH CALLBACK
    // =================================================

    if (
        typeof window.onCropHealthImage ===
        "function"
    ) {

        window.onCropHealthImage(
            imageData
        );

    }


    // =================================================
    // PEST DETECTION CALLBACK
    // =================================================

    if (
        typeof window.onPestImageCaptured ===
        "function"
    ) {

        window.onPestImageCaptured(
            imageData
        );

    }

}


// =====================================================
// CAMERA ON UI
// =====================================================

function setCameraOnState() {

    updateCameraStatus(
        "Camera On",
        "on"
    );


    updateElement(
        "cameraMessage",
        "Camera is on"
    );


    updateElement(
        "cameraSubMessage",
        "Live monitoring is active"
    );

}


// =====================================================
// CAMERA OFF UI
// =====================================================

function setCameraOffState() {

    updateCameraStatus(
        "Camera Off",
        "off"
    );


    const video =
        document.getElementById(
            "cameraVideo"
        );


    const placeholder =
        document.getElementById(
            "cameraPlaceholder"
        );


    if (video) {

        video.style.display =
            "none";

    }


    if (placeholder) {

        placeholder.style.display =
            "flex";

    }


    updateElement(
        "cameraMessage",
        "Camera is off"
    );


    updateElement(
        "cameraSubMessage",
        'Click "Start Camera" to begin monitoring'
    );

}


// =====================================================
// UPDATE CAMERA STATUS
// =====================================================

function updateCameraStatus(
    text,
    status
) {

    const element =
        document.getElementById(
            "cameraStatus"
        );


    if (!element) {

        return;

    }


    element.textContent =
        text;


    element.className =
        "camera-status " +
        status;

}


// =====================================================
// UPDATE CAMERA INFORMATION
// =====================================================

function updateCameraInfo(
    fileName,
    date
) {

    const info =
        document.getElementById(
            "cameraInfo"
        );


    const name =
        document.getElementById(
            "cameraImageName"
        );


    const time =
        document.getElementById(
            "cameraCaptureTime"
        );


    if (info) {

        info.style.display =
            "flex";

    }


    if (name) {

        name.textContent =
            fileName;

    }


    if (time) {

        time.textContent =
            date.toLocaleString();

    }

}


// =====================================================
// SAFE ELEMENT UPDATE
// =====================================================

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        value ?? "--";

}


// =====================================================
// GET CURRENT CAMERA IMAGE
// =====================================================

function getLatestCropImage() {

    return lastCapturedImage;

}


// =====================================================
// CLEAR CAMERA IMAGE
// =====================================================

function clearCameraImage() {

    const image =
        document.getElementById(
            "capturedImage"
        );


    const info =
        document.getElementById(
            "cameraInfo"
        );


    if (image) {

        image.src =
            "";

        image.style.display =
            "none";

    }


    if (info) {

        info.style.display =
            "none";

    }


    lastCapturedImage =
        null;


    window.latestCropImage =
        null;


    setCameraOffState();


    console.log(
        "🗑️ Camera image cleared"
    );

}


// =====================================================
// PAGE EXIT
// =====================================================

window.addEventListener(
    "beforeunload",
    () => {

        stopCameraStream();

    }
);


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.startCamera =
    startCamera;

window.stopCamera =
    stopCamera;

window.captureImage =
    captureImage;

window.getLatestCropImage =
    getLatestCropImage;

window.clearCameraImage =
    clearCameraImage;