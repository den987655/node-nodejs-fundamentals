import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createBrotliCompress } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspacePath = path.join(__dirname, 'workspace');
const sourceRoot = path.join(workspacePath, 'toCompress');
const compressedDir = path.join(workspacePath, 'compressed');
const archivePath = path.join(compressedDir, 'archive.br');

const toPosixPath = (value) => value.split(path.sep).join('/');

const readFileBase64 = async (filePath) => {
  const chunks = [];

  await pipeline(
    createReadStream(filePath),
    new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    }),
  );

  return Buffer.concat(chunks).toString('base64');
};

const collectEntries = async (dirPath, rootPath, entries) => {
  const dirEntries = await readdir(dirPath, { withFileTypes: true });
  dirEntries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of dirEntries) {
    const absolutePath = path.join(dirPath, entry.name);
    const relativePath = toPosixPath(path.relative(rootPath, absolutePath));

    if (entry.isDirectory()) {
      entries.push({ path: relativePath, type: 'directory' });
      await collectEntries(absolutePath, rootPath, entries);
      continue;
    }

    if (entry.isFile()) {
      entries.push({
        path: relativePath,
        type: 'file',
        content: await readFileBase64(absolutePath),
      });
    }
  }
};

const compressDir = async () => {
  try {
    const stats = await stat(sourceRoot);
    if (!stats.isDirectory()) {
      throw new Error(FS_ERROR_MESSAGE);
    }

    const entries = [];
    await collectEntries(sourceRoot, sourceRoot, entries);
    await mkdir(compressedDir, { recursive: true });

    const archivePayload = JSON.stringify({ entries });

    await pipeline(
      Readable.from([archivePayload]),
      createBrotliCompress(),
      createWriteStream(archivePath),
    );
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await compressDir();
