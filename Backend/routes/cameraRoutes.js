const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    saveCropImage,
    getCropImages
} = require("../services/cameraService");

const router = express.Router();


const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            path.join(
                __dirname,
                "../uploads/crops"
            )
        );
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1E9
            ) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});


const upload =
    multer({
        storage
    });


// Upload crop image
router.post(
    "/upload",
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message: "No image uploaded"
                });
            }


            const image =
                await saveCropImage({

                    filename:
                        req.file.filename,

                    originalName:
                        req.file.originalname,

                    path:
                        "/uploads/crops/" +
                        req.file.filename,

                    description:
                        req.body.description || "",

                    plantHeight:
                        req.body.plantHeight || null,

                    leafCount:
                        req.body.leafCount || null
                });


            res.status(201).json({

                success: true,

                message:
                    "Crop image uploaded",

                data: image
            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message: error.message

            });
        }
    }
);


// Get crop images
router.get(
    "/images",
    async (req, res) => {

        try {

            const images =
                await getCropImages(
                    req.query.limit
                );

            res.json({

                success: true,

                data: images

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