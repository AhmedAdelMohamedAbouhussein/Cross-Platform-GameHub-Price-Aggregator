// utils/cropImage.js
function getCroppedImg (imageSrc, pixelCrop)  
{
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = "anonymous"; // fix cross-origin issues for external images

        image.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Canvas is empty"));
                    return;
                }
                // create a File-like object
                const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
                resolve(file);
            }, "image/jpeg");
        };

        image.onerror = (err) => {
            reject(err);
        };
    });
};

export default getCroppedImg;