import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const patternIndex = process.argv.indexOf('--pattern');
const pattern = patternIndex !== -1 && process.argv[patternIndex + 1]
  ? process.argv[patternIndex + 1]
  : '';

const filter = async () => {
  let remainder = '';

  await pipeline(
    process.stdin,
    new Transform({
      transform(chunk, encoding, callback) {
        const data = remainder + chunk.toString();
        const lines = data.split('\n');
        remainder = lines.pop() ?? '';

        for (const line of lines) {
          if (line.includes(pattern)) {
            this.push(`${line}\n`);
          }
        }

        callback();
      },
      flush(callback) {
        if (remainder.includes(pattern)) {
          this.push(remainder);
        }

        callback();
      },
    }),
    process.stdout,
  );
};

await filter();
