const dynamic = async () => {
  const pluginName = process.argv[2];

  try {
    const plugin = await import(`./plugins/${pluginName}.js`);
    console.log(plugin.run());
  } catch {
    console.log('Plugin not found');
    process.exit(1);
  }
};

await dynamic();
