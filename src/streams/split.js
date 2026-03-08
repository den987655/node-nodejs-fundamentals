import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, 'source.txt');

const parseLineLimit = () => {
  const linesIndex = process.argv.indexOf('--lines');
  if (linesIndex === -1 || !process.argv[linesIndex + 1]) {
    return 10;
  }

  const parsedValue = Number(process.argv[linesIndex + 1]);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 10;
};

const split = async () => {
  const maxLinesPerChunk = parseLineLimit();
  let remainder = '';
  let chunkIndex = 0;
  let lineCountInChunk = 0;
  let currentStream = null;

  const openChunk = () => {
    chunkIndex += 1;
    lineCountInChunk = 0;
    currentStream = createWriteStream(path.join(__dirname, `chunk_${chunkIndex}.txt`));
  };

  const writeLine = async (line) => {
    if (!currentStream || lineCountInChunk >= maxLinesPerChunk) {
      if (currentStream) {
        await new Promise((resolve) => currentStream.end(resolve));
      }

      openChunk();
    }

    lineCountInChunk += 1;
    await new Promise((resolve, reject) => {
      currentStream.write(`${line}\n`, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  };

  await mkdir(__dirname, { recursive: true });

  await pipeline(
    createReadStream(sourcePath),
    new Transform({
      transform(chunk, encoding, callback) {
        const data = remainder + chunk.toString();
        const lines = data.split('\n');
        remainder = lines.pop() ?? '';
        callback(null, lines);
      },
      flush(callback) {
        callback(null, remainder.length > 0 ? [remainder] : []);
      },
      readableObjectMode: true,
    }),
    new Transform({
      objectMode: true,
      async transform(lines, encoding, callback) {
        try {
          for (const line of lines) {
            await writeLine(line);
          }

          callback();
        } catch (error) {
          callback(error);
        }
      },
      async flush(callback) {
        try {
          if (currentStream) {
            await new Promise((resolve) => currentStream.end(resolve));
          }

          callback();
        } catch (error) {
          callback(error);
        }
      },
    }),
  );
};

await split();
