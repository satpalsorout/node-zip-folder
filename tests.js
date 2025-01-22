const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const unzipper = require('unzipper');
const zipFolder = require('./index'); // Ensure this function is correctly defined in your project

const txtFileName = 'file.txt';
const txtFileContents = 'this is a text file';

async function createTempDir() {
    const dirPath = path.join(os.tmpdir(), `tmp_test_${Date.now()}`);
    await fs.mkdir(dirPath);
    return dirPath;
}

async function createTempFile() {
    const filePath = path.join(os.tmpdir(), `tmp_file_${Date.now()}.zip`);
    await fs.writeFile(filePath, ''); // Create an empty file
    return filePath;
}

async function emptyDirectory(dirName) {
    const dirFiles = await fs.readdir(dirName);
    for (const file of dirFiles) {
        const entryPath = path.join(dirName, file);
        const fileStats = await fs.lstat(entryPath);
        if (fileStats.isFile()) {
            await fs.unlink(entryPath);
        } else if (fileStats.isDirectory()) {
            await emptyDirectory(entryPath);
            await fs.rmdir(entryPath);
        }
    }
}

module.exports = {
    async setUp(callback) {
		try {
			// Create temp source directory and add a file
			this.tmpSrcDir = await createTempDir();
			console.log('Temporary source directory created:', this.tmpSrcDir);
	
			const writePath = this.tmpSrcDir;
			const txtFilePath = path.join(writePath, txtFileName);
	
			await fs.writeFile(txtFilePath, txtFileContents);
			console.log('Text file created at path:', txtFilePath);
	
			// Create temp zip file and extraction directory
			this.tmpZipFile = await createTempFile();
			console.log('Temporary zip file created at path:', this.tmpZipFile);
	
			this.tmpZipExtractionDir = await createTempDir();
			console.log('Temporary extraction directory created:', this.tmpZipExtractionDir);
	
			zipFolder(writePath, this.tmpZipFile, (err) => {
				if (err) {
					console.error('Error during zipping:', err);
					callback(err);
				} else {
					console.log('Zip file created successfully.');
					callback();
				}
			});
		} catch (err) {
			console.error('Error during setup:', err.message);
			callback(err);
		}
	},

    async tearDown(callback) {
        if (this.tmpSrcDir) {
            await emptyDirectory(this.tmpSrcDir);
            await fs.rmdir(this.tmpSrcDir);
        }
        if (this.tmpZipExtractionDir) {
            await emptyDirectory(this.tmpZipExtractionDir);
            await fs.rmdir(this.tmpZipExtractionDir);
        }
        if (this.tmpZipFile) {
            await fs.unlink(this.tmpZipFile);
        }
        callback();
    },

    async itCreatesTheZipFile(test) {
        try {
            const exists = await fs.stat(this.tmpZipFile).then(() => true).catch(() => false);
            test.ok(exists, 'Zip file should exist');
        } catch (err) {
            test.fail('Error checking zip file existence: ' + err.message);
        }
        test.done();
    },

    async itCreatesTheZipFile(test) {
		try {
			const exists = await fs.stat(this.tmpZipFile).then(() => true).catch(() => false);
			if (!exists) {
				console.error('Zip file does not exist at path:', this.tmpZipFile);
			}
			test.ok(exists, 'Zip file should exist');
		} catch (err) {
			console.error('Error checking zip file existence:', err.message);
			test.fail('Error checking zip file existence: ' + err.message);
		}
		test.done();
	},
	async theZipFileContainsTheRightFiles(test) {
        const extractedFiles = {};
        try {
            // Extract files from the zip archive
            const directory = await unzipper.Open.file(this.tmpZipFile);

            // Iterate over entries and validate contents
            for (const file of directory.files) {
                if (file.type === 'File') {
                    const content = await file.buffer();
                    extractedFiles[file.path] = content.toString();
                }
            }

            // Check if the expected file exists
            test.ok(extractedFiles[txtFileName], 'The zip file should contain the expected text file');

            // Validate the file's contents
            test.equal(
                extractedFiles[txtFileName],
                txtFileContents,
                'The content of the text file should match the original'
            );
        } catch (err) {
            test.fail('Error verifying zip file contents: ' + err.message);
        }
        test.done();
    },
};