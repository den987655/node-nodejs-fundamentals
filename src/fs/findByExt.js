import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspacePath = path.join(__dirname, 'workspace');

const toPosixPath = (value) => value.split(path.sep).join('/');

const parseExtension = () => {
  const extFlagIndex = process.argv.indexOf('--ext');
  if (extFlagIndex === -1 || !process.argv[extFlagIndex + 1]) {
    return '.txt';
  }

  const inputExt = process.argv[extFlagIndex + 1].trim();
  return inputExt.startsWith('.') ? inputExt : `.${inputExt}`;
};

const collectMatchingFiles = async (dirPath, rootPath, extension, result) => {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const absoluteEntryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await collectMatchingFiles(absoluteEntryPath, rootPath, extension, result);
      continue;
    }

    if (entry.isFile() && path.extname(entry.name) === extension) {
      const relativePath = toPosixPath(path.relative(rootPath, absoluteEntryPath));
      result.push(relativePath);
    }
  }
};

const findByExt = async () => {
  try {
    const workspaceStats = await stat(workspacePath);
    if (!workspaceStats.isDirectory()) {
      throw new Error(FS_ERROR_MESSAGE);
    }

    const extension = parseExtension();
    const matchedFiles = [];
    await collectMatchingFiles(workspacePath, workspacePath, extension, matchedFiles);

    matchedFiles.sort((a, b) => a.localeCompare(b));

    for (const filePath of matchedFiles) {
      console.log(filePath);
    }
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await findByExt();
