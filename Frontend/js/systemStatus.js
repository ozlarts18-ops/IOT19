// =====================================================
// SYSTEM STATUS
// =====================================================

const SYSTEM_STATUS_API =
    "http://localhost:5000/api/devices";


// =====================================================
// GET SYSTEM DEVICES
// =====================================================

async function loadSystemStatus() {

    try {

        const response =
            await fetch(SYSTEM_STATUS_API);

        if (!response.ok) {

            throw new Error(
                `System status API failed: ${response.status}`
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Failed to load system status"
            );

        }


        const devices =
            result.data || [];


        updateSystemStatus(devices);


        return devices;

    }

    catch (error) {

        console.error(
            "System status error:",
            error
        );

        updateSystemStatusError();

        return [];

    }

}


// =====================================================
// UPDATE SYSTEM STATUS UI
// =====================================================

function updateSystemStatus(devices) {

    const deviceMap = {};


    devices.forEach(device => {

        if (!device || !device.deviceType) {
            return;
        }

        deviceMap[
            device.deviceType.toUpperCase()
        ] = device;

    });


    updateDeviceStatus(
        "PUMP",
        deviceMap.PUMP
    );


    updateDeviceStatus(
        "FAN",
        deviceMap.FAN
    );


    updateDeviceStatus(
        "GROW_LIGHT",
        deviceMap.GROW_LIGHT
    );


    updateDeviceStatus(
        "CAMERA",
        deviceMap.CAMERA
    );


    // Overall connection
    updateConnectionStatus(true);

}


// =====================================================
// UPDATE INDIVIDUAL DEVICE
// =====================================================

function updateDeviceStatus(
    deviceType,
    device
) {

    const selectors = [

        `[data-device="${deviceType}"]`,

        `[data-device-type="${deviceType}"]`,

        `#${deviceType.toLowerCase()}Status`,

        `#${deviceType.toLowerCase()}-status`

    ];


    let element = null;


    for (const selector of selectors) {

        try {

            element =
                document.querySelector(selector);

            if (element) {
                break;
            }

        }

        catch (error) {
            // Ignore invalid optional selectors
        }

    }


    if (!element) {
        return;
    }


    if (!device) {

        element.textContent =
            "Not configured";

        element.classList.remove(
            "status-good",
            "status-warning",
            "status-danger"
        );

        element.classList.add(
            "status-warning"
        );

        return;
    }


    const isOn =
        Boolean(device.state);

    const mode =
        device.mode || "AUTO";


    if (isOn) {

        element.textContent =
            `ON • ${mode}`;

        element.classList.remove(
            "status-warning",
            "status-danger"
        );

        element.classList.add(
            "status-good"
        );

    } else {

        element.textContent =
            `OFF • ${mode}`;

        element.classList.remove(
            "status-danger",
            "status-warning"
        );

        element.classList.add(
            "status-good"
        );

    }

}


// =====================================================
// CONNECTION STATUS
// =====================================================

function updateConnectionStatus(
    connected
) {

    const connectionText =
        document.querySelector(
            ".connection span"
        );


    const connectionDot =
        document.querySelector(
            ".connection-dot"
        );


    if (!connectionText) {
        return;
    }


    if (connected) {

        connectionText.textContent =
            "System Online";


        if (connectionDot) {

            connectionDot.style.background =
                "#28a45a";

        }

    } else {

        connectionText.textContent =
            "System Offline";


        if (connectionDot) {

            connectionDot.style.background =
                "#d64545";

        }

    }

}


// =====================================================
// ERROR STATE
// =====================================================

function updateSystemStatusError() {

    updateConnectionStatus(false);


    const statusElements =
        document.querySelectorAll(
            "[data-system-status]"
        );


    statusElements.forEach(element => {

        element.textContent =
            "Unavailable";

        element.classList.remove(
            "status-good",
            "status-warning"
        );

        element.classList.add(
            "status-danger"
        );

    });

}


// =====================================================
// AUTO LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSystemStatus();

        // Refresh every 10 seconds
        setInterval(
            loadSystemStatus,
            10000
        );

    }
);


// =====================================================
// EXPORT FOR OTHER DASHBOARD JS FILES
// =====================================================

window.loadSystemStatus =
    loadSystemStatus;

window.updateSystemStatus =
    updateSystemStatus;