const compressor = () => {
    const inputFile = document.getElementById('file');
    const fileName = document.getElementById('fileName');
    fileName.replaceChildren(inputFile.files[0].name)
}