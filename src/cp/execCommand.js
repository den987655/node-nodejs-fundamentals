import { spawn } from 'node:child_process';

const execCommand = () => {
  const command = process.argv[2];

  const child = spawn(command, {
    shell: true,
    env: process.env,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on('error', () => {
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
};

execCommand();
