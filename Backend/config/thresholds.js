module.exports = {
    temperature: {
        min: 18,
        max: 35
    },

    humidity: {
        min: 40,
        max: 80
    },

    soilMoisture: {
        dry: 40,
        stopIrrigation: 65
    },

    waterLevel: {
        minimum: 20
        
    },

    light: {
        minimum: 300,
        maximum: 1200
    },

    irrigation: {
        minimumDuration: 1,
        maximumDuration: 30
    },

    pest: {
        warningConfidence: 60,
        criticalConfidence: 80
    }
};