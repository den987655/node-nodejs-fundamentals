import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const FS_ERROR_MESSAGE = 'FS operation failed';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const checksumsPath = path.join(__dirname, 'checksums.json');

const calculateSha256 = async (filePath) => {
  const hash = createHash('sha256');

  await pipeline(
    createReadStream(filePath),
    new Writable({
      write(chunk, encoding, callback) {
        hash.update(chunk);
        callback();
      },
    }),
  );

  return hash.digest('hex');
};

const verify = async () => {
  try {
    await access(checksumsPath);

    const rawChecksums = await readFile(checksumsPath, 'utf8');
    const checksums = JSON.parse(rawChecksums);

    for (const [fileName, expectedHash] of Object.entries(checksums)) {
      const filePath = path.join(__dirname, fileName);
      let status = 'FAIL';

      try {
        const actualHash = await calculateSha256(filePath);
        status = actualHash === expectedHash ? 'OK' : 'FAIL';
      } catch {
        status = 'FAIL';
      }

      console.log(`${fileName} — ${status}`);
    }
  } catch {
    throw new Error(FS_ERROR_MESSAGE);
  }
};

await verify();
