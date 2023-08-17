// import { FFmpeg } from "@ffmpeg/ffmpeg";
// import { fetchFile, toBlobURL } from "@ffmpeg/util";
// import Compressor from "compressorjs";
// import heic2any from "heic2any";

const imageCompressor = async (file, width, height, quality) => {
    try {
        new Compressor(file, {
            quality: Number(quality),
            width,
            height,
            success(result) {
                console.log('Original image size:', file.size);
                console.log('Compressed image size:', result.size);
                const url = URL.createObjectURL(result);
                downloadFile(url, file.name);
            },
            error(err) {
                console.error("Compression error:", err);
            },
        });
    } catch (error) {
        console.error("Image compression error:", error);
    }
};

const videoCompressor = async (file, width, height, hasAudio, quality) => {
    try {
        const ffmpeg = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd";

        ffmpeg.on("progress", ({ progress }) => {
            const roundedProgress = Math.round(progress * 100);
            console.log(`${roundedProgress}%`);
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        await ffmpeg.writeFile("input.mp4", await fetchFile(file));

        const ffmpegArgs = [
            "-i", "input.mp4",
            "-vf", `scale=${width}:${height}`,
            "-c:v", "libx264", "-crf", "18",
            "-b:v", `${quality}M`,
            ...(hasAudio ? ["-c:a", "copy"] : ["-an"]),
            "output.mp4",
        ];

        try {
            await ffmpeg.exec(ffmpegArgs);
        } catch (err) {
            console.error("FFmpeg execution error:", err);
        }

        const data = await ffmpeg.readFile("output.mp4");

        const blob = new Blob([data.buffer], {
            type: "video/mp4",
        });

        downloadFile(URL.createObjectURL(blob), "compressed.mp4");
    } catch (error) {
        console.error("Video compression error:", error);
    }
};


const convertHeifToJpg = async (heifFile) => {
    try {
        const conversionResult = await heic2any({
            blob: heifFile,
            toType: "image/jpeg",
            quality: 1,
        });
        return conversionResult;
    } catch (error) {
        console.error("HEIF to JPEG conversion error:", error);
    }
};

const downloadFile = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const handleCompression = async () => {
    const inputFile = document.getElementById("file");
    const loadingLabel = document.getElementById("loading");
    const width = Number(document.getElementById("width")?.value) || 1920;
    const height = Number(document.getElementById("height")?.value) || 1080;
    const quality = Number(document.getElementById("quality")?.value) || 0.7;
    const audioCheckbox = document.getElementById("hasAudio");
    const hasAudio = audioCheckbox?.checked || false;

    loadingLabel.textContent = "Loading...";

    const file = inputFile?.files[0];
    const mimeType = file.type;
    const isImage = mimeType.startsWith("image");

    try {
        if (isImage) {
            const imageType = mimeType.split("/")[1];

            if (imageType === "heif") {
                const jpgFile = await convertHeifToJpg(file);
                await imageCompressor(jpgFile, width, height, quality);
            } else {
                await imageCompressor(file, width, height, quality);
            }
        } else {
            await videoCompressor(file, width, height, hasAudio, quality);
        }
    } catch (error) {
        console.error("Compression error:", error);
    }

    loadingLabel.textContent = "";
};