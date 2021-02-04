import yargs = require('yargs/yargs');

import printer from './printer';

const argv = yargs(process.argv.slice(2)).options({
  server: {
    type: 'string',
    alias: 's',
    demandOption: true,
    description: 'The local network name of the printer (e.g. "XYZ1234")',
  },
}).argv;

(async () => {
  const instance = printer(argv.server);

  const attributes = await instance.getInfo();

  console.log(attributes);
})();
