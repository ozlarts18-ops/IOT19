async function sendWhatsAppMessage(
    phoneNumber,
    message
) {

    console.log(
        "WhatsApp message:",
        phoneNumber,
        message
    );

    // Later you can connect:
    // Twilio WhatsApp
    // Meta WhatsApp Cloud API
    return {
        success: true,
        message: "WhatsApp notification queued"
    };
}


async function sendWhatsAppAlert(alert) {
    const phoneNumber =
        process.env.WHATSAPP_RECIPIENT ||
        "Default";

    const alertText =
        `🚨 IOT19 Alert [${alert.severity || "INFO"}]: ${alert.type || "UNKNOWN"} - ${alert.message || "No details"}`;

    return sendWhatsAppMessage(
        phoneNumber,
        alertText
    );
}


module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppAlert
};