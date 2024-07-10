import fs from "fs";
import { configDotenv } from "dotenv";
configDotenv();

import { extractFull } from "node-7z-forall";
import path from "path";
import { fileURLToPath } from "url";

import { getDownloadLink, downloadFile, zipFiles } from "./util.js";
import { emulators } from "./emulators.js";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const downloadAndExtract = async (url, filePath, extractPath) => {
    try {
        console.log("Downloading file...");
        await downloadFile(url, filePath);
        console.log("File downloaded successfully.");

        if (filePath.endsWith(".zip")) {
            console.log("File is already .zip format. Skipping extraction.");
            return;
        }

        console.log("Extracting file...");
        const pathTo7za = process.env.USE_SYSTEM_7ZA ? "7za" : undefined;
        const extraction = extractFull(filePath, extractPath, {
            pathTo7za,
        });

        extraction
            .then(async function () {
                console.log("Extracting done!");
                console.log("File extracted successfully.");

                // Find the extracted folder (assuming there's only one)
                try {
                    const extractedFolders = await fs.promises.readdir(
                        extractPath
                    );
                    if (extractedFolders.length === 1) {
                        const extractedFolderPath = path.join(
                            extractPath,
                            extractedFolders[0]
                        );
                        // console.log(
                        //     `Moving contents of ${extractedFolderPath} to ${extractPath}`
                        // );
                        // await moveFiles(extractedFolderPath, extractPath);
                        console.log("Zipping Contents...");
                        await zipFiles(
                            extractedFolderPath,
                            `${extractPath}.zip`
                        );
                        console.log("Contents zipped successfully.");

                        await fs.promises.rmdir(extractedFolderPath);
                        console.log("Contents moved successfully.");
                    } else {
                        // console.log("Unexpected number of extracted folders.");
                        console.log("Zipping Contents...");
                        await zipFiles(extractPath, `${extractPath}.zip`);
                        console.log("Contents zipped successfully.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                }

                console.log("Deleting downloaded 7z file...");
                await fs.promises.unlink(filePath);
                console.log("Downloaded 7z file deleted successfully.");
                // console.log("Zipping Contents...");
                // await zipFiles(extractPath, `${extractPath}.zip`);
                // console.log("Contents zipped successfully.");
                console.log("Deleting extracted folder...");
                await fs.promises.rmdir(extractPath, { recursive: true });
                console.log("Extracted folder deleted successfully.");
            })
            .catch(function (err) {
                console.log(err);
            });
    } catch (error) {
        console.error("Error:", error);
    }
};

const main = async () => {
    console.log("Deleting old files...");
    let dir = path.join(__dirname, "emulators");
    fs.readdirSync(dir).forEach((f) =>
        !f.endsWith(".md") ? fs.rmSync(`${dir}/${f}`) : null
    );
    console.log("Old files deleted successfully.");
    Object.keys(emulators).forEach(async (emulator) => {
        const downloadLink = await getDownloadLink(emulators[emulator]);
        console.log(`Emulator: ${emulator}, URL: ${downloadLink}`);
        console.log(downloadLink);
        const filePath = path.join(
            __dirname,
            `emulators/${emulator}.${downloadLink.split(".").slice(-1)[0]}`
        );
        const extractPath = path.join(__dirname, `emulators/${emulator}`);
        await downloadAndExtract(downloadLink, filePath, extractPath);
        console.log(`Download and extraction for ${emulator} complete!`);
    });
};

main();
