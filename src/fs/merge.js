import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspacePath = path.join(__dirname, 'workspace');
const partsPath = path.join(workspacePath, 'parts');
const mergedPath = path.join(workspacePath, 'merged.txt');

const parseRequestedFiles = () => {
  const filesFlagIndex = process.argv.indexOf('--files');
  if (filesFlagIndex === -1 || !process.argv[filesFlagIndex + 1]) {
    return null;
  }

  return process.argv[filesFlagIndex + 1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const merge = async () => {
  try {
    const partsStats = await stat(partsPath);
    if (!partsStats.isDirectory()) {
      throw new Error(FS_ERROR_MESSAGE);
    }

    const requestedFiles = parseRequestedFiles();
    const partsEntries = await readdir(partsPath, { withFileTypes: true });
    const filesSet = new Set(partsEntries.filter((entry) => entry.isFile()).map((entry) => entry.name));

    let filesToMerge = [];

    if (requestedFiles !== null) {
      if (requestedFiles.length === 0) {
        throw new Error(FS_ERROR_MESSAGE);
      }

      for (const fileName of requestedFiles) {
        if (!filesSet.has(fileName)) {
          throw new Error(FS_ERROR_MESSAGE);
        }
      }

      filesToMerge = requestedFiles;
    } else {
      filesToMerge = Array.from(filesSet)
        .filter((fileName) => path.extname(fileName) === '.txt')
        .sort((a, b) => a.localeCompare(b));

      if (filesToMerge.length === 0) {
        throw new Error(FS_ERROR_MESSAGE);
      }
    }

    const chunks = [];
    for (const fileName of filesToMerge) {
      const filePath = path.join(partsPath, fileName);
      const content = await readFile(filePath, 'utf8');
      chunks.push(content);
    }

    await writeFile(mergedPath, chunks.join(''), 'utf8');
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await merge();
