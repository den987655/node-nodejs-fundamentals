import { parentPort } from 'worker_threads';

// Receive array from main thread
// Sort in ascending order
// Send back to main thread

parentPort.once('message', (data) => {
  const sorted = [...data].sort((a, b) => a - b);
  parentPort.postMessage(sorted);
  parentPort.close();
});
