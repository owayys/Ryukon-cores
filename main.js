// const axios = require("axios");
// const fs = require("fs");
// const { fullArchive } = require("node-7z-archive");
// const path = require("path");

import axios from "axios";
import fs from "fs";
import { extractFull } from "node-7z-forall";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

// URL of the 7z file
const url =
    "https://github.com/mgba-emu/mgba/releases/download/0.10.3/mGBA-0.10.3-win64.7z";
// Path where the 7z file will be saved
const filePath = path.join(__dirname, "mGBA.7z");
// Path where the contents of the 7z file will be extracted
const extractPath = path.join(__dirname, "mGBA");

// Function to download the file
const downloadFile = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};

const moveFiles = async (sourceDir, destDir) => {
    const files = await fs.promises.readdir(sourceDir);
    for (const file of files) {
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        await fs.promises.rename(srcPath, destPath);
    }
};

// Main function to download and extract the file
const main = async () => {
    try {
        console.log("Downloading file...");
        await downloadFile(url, filePath);
        console.log("File downloaded successfully.");

        console.log("Extracting file...");
        // extractFull(filePath, extractPath);
        const extraction = extractFull(filePath, extractPath);

        extraction.progress(function (files) {
            console.log("Some files are extracted: %s", files);
        });

        extraction
            .then(async function () {
                console.log("Extracting done!");
                console.log("File extracted successfully.");

                // Find the extracted folder (assuming there's only one)
                const extractedFolders = await fs.promises.readdir(extractPath);
                if (extractedFolders.length === 1) {
                    const extractedFolderPath = path.join(
                        extractPath,
                        extractedFolders[0]
                    );
                    console.log(
                        `Moving contents of ${extractedFolderPath} to ${extractPath}`
                    );
                    await moveFiles(extractedFolderPath, extractPath);

                    // Optionally remove the empty folder
                    await fs.promises.rmdir(extractedFolderPath);
                    console.log("Contents moved successfully.");
                    await fs.promises.unlink(filePath);
                    console.log("Downloaded 7z file deleted successfully.");
                } else {
                    console.log("Unexpected number of extracted folders.");
                }
            })
            .catch(function (err) {
                console.error(err);
            });
    } catch (error) {
        console.error("Error:", error);
    }
};

main();
