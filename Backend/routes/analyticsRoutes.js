const express = require("express");

const router = express.Router();

const {
    getTemperatureHumidityDaily,
    getLightDaily,
    getWaterDaily,
    getIrrigationDaily,
    getPestDaily,
    getDashboardAnalytics
} = require("../services/analyticsService");


// =====================================================
// COMPLETE DASHBOARD ANALYTICS
// GET /api/analytics
// =====================================================

router.get("/", async (req, res) => {

    try {

        const data =
            await getDashboardAnalytics();

        res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "Dashboard analytics error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard analytics",

            error:
                error.message

        });

    }

});


// =====================================================
// DASHBOARD ANALYTICS ALIAS
// GET /api/analytics/dashboard
// =====================================================

router.get("/dashboard", async (req, res) => {

    try {
        const data = await getDashboardAnalytics();

        res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Dashboard analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard analytics",
            error: error.message
        });
    }

});


// =====================================================
// TEMPERATURE + HUMIDITY
// GET /api/analytics/temperature-humidity
// =====================================================

router.get(
    "/temperature-humidity",
    async (req, res) => {

        try {

            const data =
                await getTemperatureHumidityDaily();

            res.json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "Temperature humidity analytics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load temperature and humidity analytics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// LIGHT
// GET /api/analytics/light
// =====================================================

router.get(
    "/light",
    async (req, res) => {

        try {

            const data =
                await getLightDaily();

            res.json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "Light analytics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load light analytics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// WATER
// GET /api/analytics/water
// =====================================================

router.get(
    "/water",
    async (req, res) => {

        try {

            const data =
                await getWaterDaily();

            res.json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "Water analytics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load water analytics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// IRRIGATION
// GET /api/analytics/irrigation
// =====================================================

router.get(
    "/irrigation",
    async (req, res) => {

        try {

            const data =
                await getIrrigationDaily();

            res.json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "Irrigation analytics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load irrigation analytics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// PESTS
// GET /api/analytics/pests
// =====================================================

router.get(
    "/pests",
    async (req, res) => {

        try {

            const data =
                await getPestDaily();

            res.json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "Pest analytics error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load pest analytics",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;