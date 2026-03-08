import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const snapshotPath = path.join(__dirname, 'snapshot.json');
const restoredPath = path.join(__dirname, 'workspace_restored');

const restore = async () => {
  try {
    await access(snapshotPath);

    try {
      await access(restoredPath);
      throw new Error(FS_ERROR_MESSAGE);
    } catch (error) {
      if (error.message === FS_ERROR_MESSAGE) {
        throw error;
      }
    }

    const rawSnapshot = await readFile(snapshotPath, 'utf8');
    const snapshot = JSON.parse(rawSnapshot);
    const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];

    await mkdir(restoredPath, { recursive: true });

    for (const entry of entries) {
      const targetPath = path.join(restoredPath, entry.path);

      if (entry.type === 'directory') {
        await mkdir(targetPath, { recursive: true });
        continue;
      }

      if (entry.type === 'file') {
        const parentDir = path.dirname(targetPath);
        await mkdir(parentDir, { recursive: true });
        const content = Buffer.from(entry.content ?? '', 'base64');
        await writeFile(targetPath, content);
      }
    }

    const restoredStats = await stat(restoredPath);
    if (!restoredStats.isDirectory()) {
      throw new Error(FS_ERROR_MESSAGE);
    }
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await restore();
