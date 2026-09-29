const express = require("express");

const router = express.Router();

const DeviceConfig =
    require("../models/DeviceConfig");

const {
    setGrowLight
} = require("../services/lightingService");


// Get all devices
router.get("/", async (req, res) => {

    try {

        const devices =
            await DeviceConfig.find()
                .sort({
                    deviceType: 1
                });

        res.json({

            success: true,

            data: devices

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
});


// Change device
router.put(
    "/:deviceType",
    async (req, res) => {

        try {

            const deviceType =
                req.params.deviceType
                    .toUpperCase();


            const {
                state,
                mode
            } = req.body;


            if (
                deviceType ===
                "GROW_LIGHT"
            ) {

                const device =
                    await setGrowLight(
                        state,
                        mode || "MANUAL"
                    );

                return res.json({

                    success: true,

                    data: device

                });
            }


            let device =
                await DeviceConfig.findOne({
                    deviceType
                });


            if (!device) {

                device =
                    await DeviceConfig.create({

                        deviceName:
                            deviceType,

                        deviceType,

                        state:
                            Boolean(state),

                        mode:
                            mode || "MANUAL"

                    });

            } else {

                if (
                    state !== undefined
                ) {
                    device.state =
                        Boolean(state);
                }

                if (mode) {
                    device.mode = mode;
                }

                device.lastChanged =
                    new Date();

                await device.save();
            }


            res.json({

                success: true,

                data: device

            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message: error.message

            });
        }
    }
);


module.exports = router;