import axios from "axios";
import fs from "fs";
import archiver from "archiver";

// Function to get the download link from the GitHub API
export const getDownloadLink = async (url) => {
    try {
        const response = await axios.get(url);
        let latest = response.data[0].assets
            .filter(
                (obj) =>
                    obj.name.includes("win") &&
                    (obj.name.endsWith(".7z") || obj.name.endsWith(".zip")) &&
                    !obj.name.includes("symbols")
            )
            .map((asset) => asset.browser_download_url);

        let output = latest.filter((obj) => obj.includes("64"))[0];

        if (output.length === 0 && latest.length > 0) {
            output = latest[0];
        } else if (output.length === 0) {
            output = null;
        }

        return output;
    } catch (error) {
        console.log(error);
        return null;
    }
};

// Function to download the file
export const downloadFile = async (url, outputPath) => {
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

// Function to zip the extracted file contents
export const zipFiles = (sourceDir, outputZipPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Sets the compression level.
        });

        output.on("close", () => resolve());
        archive.on("error", (err) => reject(err));

        archive.pipe(output);

        archive.directory(sourceDir, false);

        archive.finalize();
    });
};
