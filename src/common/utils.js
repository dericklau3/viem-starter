import fs from "fs";
import path from "path"

export function createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
            console.error('Failed to create directory:', err);
        }
    }
}

export function readDirJson(dirPath) {
    const files = fs.readdirSync(dirPath);
    const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
    return jsonFiles;
}

export function writeFileSync(filePath, content) {
    fs.writeFileSync(filePath, content);
}

export function readFileSync(filePath) {
    return fs.readFileSync(filePath, "utf-8");
}

export function writeJson(filePath, content) {
    const jsonContent = JSON.stringify(content, null, "\t");
    writeFileSync(filePath, jsonContent);
}

export function readJson(filePath) {
    const rawdata = readFileSync(filePath);
    const json = JSON.parse(rawdata);
    return json;
}