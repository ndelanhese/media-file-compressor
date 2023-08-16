// const Compressor = require('compressorjs');

const imageCompressor = async (file, width, height) => {
    new Compressor(file, {
        quality: 0.7,
        width: width,
        maxWidth: 1920,
        height: height,
        maxHeight: 1080,
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
    const width = document.getElementById('width')?.value || 400;
    const height = document.getElementById('height')?.value || 400;
    const hasAudio = document.getElementById('hasAudio')?.target?.value;

    const file = inputFile.files[0]
    const mimeType = file.type;
    const fileIsAnImage = mimeType.match(/image.*/g)


    loadingLabel.replaceChildren('Loading...') 
    if (fileIsAnImage) {
        const [imageType] = fileIsAnImage

        if (imageType.includes('heif')) {
            const jpgFile = await convertHeifToJpg(file);
            await imageCompressor(jpgFile, width, height);
        }

        if (!imageType.includes('heif')) {
            console.log(file)
            await imageCompressor(file, width, height)
        }
    }

    if (!fileIsAnImage) {
        await videoCompressor(file, width, height, hasAudio)
    }

    loadingLabel.replaceChildren('') 
}





