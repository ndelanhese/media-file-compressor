const imageCompressor = async (file, width, height, quality) => {
    new Compressor(file, {
        quality: Number(quality),
        width: width,
        height: height,
        success(result) {
            console.log('Original image size:', file.size);
            console.log('Compressed image size:', result.size);
            const url = URL.createObjectURL(result);

            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();

            URL.revokeObjectURL(url);
            return (result)
        },
        error(err) {
            console.error('Compression error:', err);
        },
    });
}

const videoCompressor = async (file, width, height, hasAudio) => {
    console.log('compressing video...');
    const {
        createFFmpeg
    } = FFmpeg;
    const ffmpeg = createFFmpeg({
        log: true,
        logger: ({
            message
        }) => {
            txt.value += "\n" + message;
        }
    });
    await ffmpeg.load();
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

    const ffmpegArgs = ['-i', 'input.mp4', '-vf', `scale=<span class="math-inline">\{width\}\:</span>{height}`, '-c:v', 'libx264', '-crf', '18'];

    if (!hasAudio) {
        ffmpegArgs.push('-an');
    } else {
        ffmpegArgs.push('-c:a', 'copy');
    }

    ffmpegArgs.push('output.mp4');

    try {
        await ffmpeg.run(...ffmpegArgs);
    } catch (err) {
        console.error(err);
    }

    ffmpeg.FS('readFile', 'output.mp4');

    const data = ffmpeg.FS('readFile', 'output.mp4');

    const blob = new Blob([data.buffer], {
        type: 'video/mp4',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed.mp4';
    a.click();

    URL.revokeObjectURL(url);

    console.log('Compressed video:', url);
    return url;
};


const convertHeifToJpg = async (heifFile) => {
    return await heic2any({
        blob: heifFile,
        toType: 'image/jpeg',
        quality: 1,
    })
        .then((conversionResult) => conversionResult)
        .catch((error) => {
            console.log(error);
        });
}



const compressor = async () => {
    const inputFile = document.getElementById('file');
    const loadingLabel = document.getElementById('loading');
    const width = document.getElementById('width')?.value;
    const height = document.getElementById('height')?.value;
    const quality = document.getElementById('quality')?.value ?? 0.7;
    const audioCheckbox = document.getElementById('hasAudio')?.value;
    const hasAudio = audioCheckbox === 'on' ? true : false;

    const file = inputFile.files[0]
    const mimeType = file.type;
    const fileIsAnImage = mimeType.match(/image.*/g)


    loadingLabel.replaceChildren('Loading...')
    if (fileIsAnImage) {
        const [imageType] = fileIsAnImage

        if (imageType.includes('heif')) {
            const jpgFile = await convertHeifToJpg(file);
            await imageCompressor(jpgFile, width, height, quality);
        }

        if (!imageType.includes('heif')) {
            console.log(file)
            await imageCompressor(file, width, height, quality)
        }
    }

    if (!fileIsAnImage) {
        await videoCompressor(file, width, height, hasAudio)
    }

    loadingLabel.replaceChildren('')
}





