const fs = require('fs');
const archiver = require('archiver');

/**
 * Zips a folder and writes it to a specified destination.
 * @param {string} srcFolder - The source folder to zip.
 * @param {string} zipFilePath - The path to save the zip file.
 * @param {function} callback - Callback function to handle success or error.
 */
function zipFolder(srcFolder, zipFilePath, callback) {
    const output = fs.createWriteStream(zipFilePath);
    const zipArchive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression level
    });

    output.on('close', () => {
        callback(null);
    });

    output.on('error', (err) => {
        console.error('Error writing archive:', err);
        callback(err);
    });

    zipArchive.on('error', (err) => {
        console.error('Error during archiving:', err);
        callback(err);
    });

    zipArchive.pipe(output);

    // Add the source folder to the archive
    zipArchive.directory(srcFolder, false);

    zipArchive.finalize().catch((err) => {
        callback(err);
    });
}

module.exports = zipFolder;