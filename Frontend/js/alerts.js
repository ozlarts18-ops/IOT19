const ALERTS_API_URL = "http://localhost:5000/api/alerts";

let dashboardAlerts = [];


// =====================================================
// LOAD ALERTS
// =====================================================

async function loadAlerts() {

    try {

        const response =
            await fetch(ALERTS_API_URL);

        if (!response.ok) {
            throw new Error(
                `Alerts API failed: ${response.status}`
            );
        }

        const result =
            await response.json();

        if (!result.success) {
            throw new Error(
                result.message ||
                "Failed to load alerts"
            );
        }

        dashboardAlerts =
            result.alerts || result.data || [];

        renderAlerts(dashboardAlerts);

        updateAlertCount(dashboardAlerts);

        return dashboardAlerts;

    } catch (error) {

        console.error(
            "Alert loading error:",
            error
        );

        renderAlertError();

        return [];

    }
}


// =====================================================
// RENDER ALERTS
// =====================================================

function renderAlerts(alerts) {

    const container =
        document.querySelector(
            ".alert-list"
        );

    if (!container) {
        console.warn(
            "Alert container .alert-list not found"
        );

        return;
    }


    container.innerHTML = "";


    if (!alerts.length) {

        container.innerHTML = `
            <div class="alert-item">
                <div class="alert-icon">
                    ✓
                </div>

                <div>
                    <strong>No active alerts</strong>

                    <span>
                        Your smart agriculture system
                        is operating normally.
                    </span>
                </div>
            </div>
        `;

        return;
    }


    alerts.forEach(alert => {

        const item =
            createAlertElement(alert);

        container.appendChild(item);

    });
}


// =====================================================
// CREATE ALERT ELEMENT
// =====================================================

function createAlertElement(alert) {

    const item =
        document.createElement("div");

    item.className =
        "alert-item";


    const icon =
        getAlertIcon(
            alert.severity
        );


    const time =
        formatAlertTime(
            alert.createdAt
        );


    item.innerHTML = `

        <div class="alert-icon">
            ${icon}
        </div>

        <div style="flex:1">

            <strong>
                ${escapeHtml(
                    alert.type || "Alert"
                )}
            </strong>

            <span>
                ${escapeHtml(
                    alert.message || ""
                )}
            </span>

            <div style="
                margin-top:6px;
                font-size:10px;
                color:#8a938d;
            ">
                ${escapeHtml(time)}
                •
                ${escapeHtml(
                    alert.severity || "MEDIUM"
                )}
            </div>

        </div>

        ${
            alert.status === "ACTIVE"
                ? `
                    <button
                        type="button"
                        onclick="resolveDashboardAlert('${alert._id}')"
                        style="
                            border:none;
                            background:#e8f4eb;
                            color:#176b3a;
                            padding:6px 9px;
                            border-radius:7px;
                            cursor:pointer;
                            font-size:10px;
                        "
                    >
                        Resolve
                    </button>
                `
                : ""
        }

    `;


    return item;
}


// =====================================================
// ALERT ICON
// =====================================================

function getAlertIcon(severity) {

    switch (
        String(severity || "")
            .toUpperCase()
    ) {

        case "CRITICAL":
            return "🚨";

        case "HIGH":
            return "⚠️";

        case "MEDIUM":
            return "⚠";

        case "LOW":
            return "ℹ";

        default:
            return "⚠";
    }
}


// =====================================================
// ALERT COUNT
// =====================================================

function updateAlertCount(alerts) {

    const activeCount =
        alerts.filter(
            alert =>
                alert.status === "ACTIVE"
        ).length;


    const countElements =
        document.querySelectorAll(
            "[data-alert-count]"
        );


    countElements.forEach(element => {

        element.textContent =
            activeCount;

    });
}


// =====================================================
// RESOLVE ALERT
// =====================================================

async function resolveDashboardAlert(id) {

    if (!id) {
        return;
    }


    try {

        const response =
            await fetch(
                `${ALERTS_API_URL}/${id}/resolve`,
                {
                    method: "PUT"
                }
            );


        const result =
            await response.json();


        if (!response.ok ||
            !result.success) {

            throw new Error(
                result.message ||
                "Failed to resolve alert"
            );
        }


        await loadAlerts();


    } catch (error) {

        console.error(
            "Resolve alert error:",
            error
        );

        alert(
            "Unable to resolve alert."
        );

    }
}


// =====================================================
// MARK ALERT AS READ
// =====================================================

async function markDashboardAlertRead(id) {

    if (!id) {
        return;
    }


    try {

        const response =
            await fetch(
                `${ALERTS_API_URL}/${id}/read`,
                {
                    method: "PUT"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to mark alert as read"
            );
        }


        await loadAlerts();

    } catch (error) {

        console.error(
            "Mark alert read error:",
            error
        );

    }
}


// =====================================================
// ALERT ERROR
// =====================================================

function renderAlertError() {

    const container =
        document.querySelector(
            ".alert-list"
        );

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="alert-item">

            <div class="alert-icon">
                ⚠
            </div>

            <div>

                <strong>
                    Unable to load alerts
                </strong>

                <span>
                    Check that the backend server
                    is running.
                </span>

            </div>

        </div>

    `;
}


// =====================================================
// FORMAT TIME
// =====================================================

function formatAlertTime(dateValue) {

    if (!dateValue) {
        return "Unknown time";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(
        date.getTime()
    )) {
        return "Unknown time";
    }


    return date.toLocaleString();

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// AUTO LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAlerts();

        // Refresh alerts every 30 seconds.
        setInterval(
            loadAlerts,
            30000
        );

    }
);


// =====================================================
// EXPORT TO WINDOW
// =====================================================

window.loadAlerts =
    loadAlerts;

window.resolveDashboardAlert =
    resolveDashboardAlert;

window.markDashboardAlertRead =
    markDashboardAlertRead;