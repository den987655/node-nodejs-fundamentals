const parseOption = (name, defaultValue) => {
  const optionIndex = process.argv.indexOf(`--${name}`);
  if (optionIndex === -1 || !process.argv[optionIndex + 1]) {
    return defaultValue;
  }

  const parsedNumber = Number(process.argv[optionIndex + 1]);
  return Number.isFinite(parsedNumber) && parsedNumber > 0 ? parsedNumber : defaultValue;
};

const parseColor = () => {
  const optionIndex = process.argv.indexOf('--color');
  if (optionIndex === -1 || !process.argv[optionIndex + 1]) {
    return null;
  }

  const rawColor = process.argv[optionIndex + 1];
  const match = /^#([0-9a-fA-F]{6})$/.exec(rawColor);
  if (!match) {
    return null;
  }

  const hex = match[1];
  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
};

const renderFilled = (filledLength, color) => {
  const filled = '█'.repeat(filledLength);
  if (!color || filledLength === 0) {
    return filled;
  }

  return `\x1b[38;2;${color.red};${color.green};${color.blue}m${filled}\x1b[0m`;
};

const progress = () => {
  const duration = parseOption('duration', 5000);
  const intervalMs = parseOption('interval', 100);
  const length = parseOption('length', 30);
  const color = parseColor();
  const startedAt = Date.now();

  const render = () => {
    const elapsed = Date.now() - startedAt;
    const ratio = Math.min(elapsed / duration, 1);
    const percent = Math.round(ratio * 100);
    const filledLength = Math.round(length * ratio);
    const emptyLength = Math.max(length - filledLength, 0);
    const bar = `${renderFilled(filledLength, color)}${' '.repeat(emptyLength)}`;

    process.stdout.write(`\r[${bar}] ${percent}%`);

    if (ratio >= 1) {
      clearInterval(timer);
      process.stdout.write('\nDone!\n');
    }
  };

  const timer = setInterval(render, intervalMs);
  render();
};

progress();
