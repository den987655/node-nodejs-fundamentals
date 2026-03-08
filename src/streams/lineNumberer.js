import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const createLineTransform = (mapLine) => {
  let remainder = '';

  return new Transform({
    transform(chunk, encoding, callback) {
      const data = remainder + chunk.toString();
      const lines = data.split('\n');
      remainder = lines.pop() ?? '';

      for (const line of lines) {
        this.push(mapLine(line));
      }

      callback();
    },
    flush(callback) {
      if (remainder.length > 0) {
        this.push(mapLine(remainder));
      }

      callback();
    },
  });
};

const lineNumberer = async () => {
  let lineNumber = 1;

  await pipeline(
    process.stdin,
    createLineTransform((line) => `${lineNumber++} | ${line}\n`),
    process.stdout,
  );
};

await lineNumberer();
