const Alert = require("../models/Alert");

// =====================================================
// CREATE ALERT
// =====================================================

async function createAlert({
    type,
    message,
    severity = "MEDIUM",
    sensorValue = null,
    sensorType = null,
    pestType = null,
    confidence = null,
    pestCount = null
}) {

    const alert = await Alert.create({

        type,

        message,

        severity,

        sensorValue,

        sensorType,

        pestType,

        confidence,

        pestCount,

        status: "ACTIVE",

        read: false

    });

    return alert;
}


// =====================================================
// GET ACTIVE ALERTS
// =====================================================

async function getActiveAlerts(limit = 20) {

    return Alert.find({
        status: "ACTIVE"
    })
        .sort({
            createdAt: -1
        })
        .limit(Number(limit));
}


// =====================================================
// GET ALL ALERTS
// =====================================================

async function getAlerts(limit = 50) {

    return Alert.find()
        .sort({
            createdAt: -1
        })
        .limit(Number(limit));
}


// =====================================================
// GET UNREAD ALERTS
// =====================================================

async function getUnreadAlerts(limit = 20) {

    return Alert.find({
        read: false
    })
        .sort({
            createdAt: -1
        })
        .limit(Number(limit));
}


// =====================================================
// GET ALERT BY ID
// =====================================================

async function getAlertById(id) {

    return Alert.findById(id);
}


// =====================================================
// MARK ALERT AS READ
// =====================================================

async function markAlertAsRead(id) {

    return Alert.findByIdAndUpdate(
        id,
        {
            read: true
        },
        {
            new: true
        }
    );
}


// =====================================================
// MARK ALL ALERTS AS READ
// =====================================================

async function markAllAlertsAsRead() {

    return Alert.updateMany(
        {
            read: false
        },
        {
            $set: {
                read: true
            }
        }
    );
}


// =====================================================
// RESOLVE ALERT
// =====================================================

async function resolveAlert(id) {

    return Alert.findByIdAndUpdate(
        id,
        {
            status: "RESOLVED",
            resolvedAt: new Date()
        },
        {
            new: true
        }
    );
}


// =====================================================
// RESOLVE ALL ACTIVE ALERTS
// =====================================================

async function resolveAllAlerts() {

    return Alert.updateMany(
        {
            status: "ACTIVE"
        },
        {
            $set: {
                status: "RESOLVED",
                resolvedAt: new Date()
            }
        }
    );
}


// =====================================================
// DELETE ALERT
// =====================================================

async function deleteAlert(id) {

    return Alert.findByIdAndDelete(id);
}


// =====================================================
// COUNT ALERTS
// =====================================================

async function getAlertCounts() {

    const [

        total,

        active,

        unread,

        critical

    ] = await Promise.all([

        Alert.countDocuments(),

        Alert.countDocuments({
            status: "ACTIVE"
        }),

        Alert.countDocuments({
            read: false
        }),

        Alert.countDocuments({
            status: "ACTIVE",
            severity: "CRITICAL"
        })

    ]);


    return {

        total,

        active,

        unread,

        critical

    };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    createAlert,

    getActiveAlerts,

    getAlerts,

    getUnreadAlerts,

    getAlertById,

    markAlertAsRead,

    markAllAlertsAsRead,

    resolveAlert,

    resolveAllAlerts,

    deleteAlert,

    getAlertCounts

};