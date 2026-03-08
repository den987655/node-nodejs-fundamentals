import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'data.json');
const workerPath = path.join(__dirname, 'worker.js');

const splitIntoChunks = (numbers, chunkCount) => {
  const chunkSize = Math.ceil(numbers.length / chunkCount) || 1;
  return Array.from({ length: chunkCount }, (_, index) => {
    const start = index * chunkSize;
    return numbers.slice(start, start + chunkSize);
  });
};

const mergeSortedChunks = (chunks) => {
  const positions = chunks.map(() => 0);
  const merged = [];

  while (true) {
    let minChunkIndex = -1;
    let minValue = Infinity;

    for (let index = 0; index < chunks.length; index += 1) {
      const value = chunks[index][positions[index]];

      if (value !== undefined && value < minValue) {
        minValue = value;
        minChunkIndex = index;
      }
    }

    if (minChunkIndex === -1) {
      break;
    }

    merged.push(minValue);
    positions[minChunkIndex] += 1;
  }

  return merged;
};

const runWorker = (chunk) => new Promise((resolve, reject) => {
  const worker = new Worker(workerPath);

  worker.once('message', (sortedChunk) => {
    resolve(sortedChunk);
  });

  worker.once('error', reject);
  worker.once('exit', (code) => {
    if (code !== 0) {
      reject(new Error(`Worker exited with code ${code}`));
    }
  });

  worker.postMessage(chunk);
});

const main = async () => {
  const rawData = await readFile(dataPath, 'utf8');
  const numbers = JSON.parse(rawData);
  const workerCount = availableParallelism();
  const chunks = splitIntoChunks(numbers, workerCount);
  const sortedChunks = await Promise.all(chunks.map((chunk) => runWorker(chunk)));
  const merged = mergeSortedChunks(sortedChunks);

  console.log(merged);
};

await main();
