import readline from 'node:readline';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  let isExiting = false;

  const exitGracefully = () => {
    if (isExiting) {
      return;
    }

    isExiting = true;
    console.log('Goodbye!');
    rl.close();
  };

  rl.on('line', (input) => {
    const command = input.trim();

    switch (command) {
      case 'uptime':
        console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
        break;
      case 'cwd':
        console.log(process.cwd());
        break;
      case 'date':
        console.log(new Date().toISOString());
        break;
      case 'exit':
        exitGracefully();
        return;
      default:
        console.log('Unknown command');
        break;
    }

    rl.prompt();
  });

  rl.on('SIGINT', exitGracefully);
  rl.on('close', () => {
    if (!isExiting) {
      console.log('Goodbye!');
    }

    process.exit(0);
  });

  rl.prompt();
};

interactive();
