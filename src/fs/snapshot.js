import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspacePath = path.join(__dirname, 'workspace');
const snapshotPath = path.join(__dirname, 'snapshot.json');

const toPosixPath = (value) => value.split(path.sep).join('/');

const collectEntries = async (dirPath, rootPath, entries) => {
  const dirEntries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of dirEntries) {
    const absoluteEntryPath = path.join(dirPath, entry.name);
    const relativeEntryPath = toPosixPath(path.relative(rootPath, absoluteEntryPath));

    if (entry.isDirectory()) {
      entries.push({ path: relativeEntryPath, type: 'directory' });
      await collectEntries(absoluteEntryPath, rootPath, entries);
      continue;
    }

    if (entry.isFile()) {
      const content = await readFile(absoluteEntryPath);
      entries.push({
        path: relativeEntryPath,
        type: 'file',
        size: content.byteLength,
        content: content.toString('base64'),
      });
    }
  }
};

const snapshot = async () => {
  try {
    const workspaceStats = await stat(workspacePath);

    if (!workspaceStats.isDirectory()) {
      throw new Error(FS_ERROR_MESSAGE);
    }

    const entries = [];
    await collectEntries(workspacePath, workspacePath, entries);

    const snapshotData = {
      rootPath: path.resolve(workspacePath),
      entries,
    };

    await writeFile(snapshotPath, JSON.stringify(snapshotData, null, 2), 'utf8');
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await snapshot();
