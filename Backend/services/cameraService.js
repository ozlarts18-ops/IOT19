const CropImage = require("../models/CropImage");


async function saveCropImage({
    filename,
    originalName,
    path,
    description = "",
    plantHeight = null,
    leafCount = null
}) {

    const image = await CropImage.create({
        filename,
        originalName,
        path,
        description,
        plantHeight,
        leafCount
    });

    return image;
}


async function getCropImages(limit = 20) {

    return CropImage.find()
        .sort({
            uploadedAt: -1
        })
        .limit(Number(limit));
}


module.exports = {
    saveCropImage,
    getCropImages
};