import yargs = require('yargs/yargs');

import { Printer } from 'ipp';

const argv = yargs(process.argv.slice(2)).options({
  server: {
    type: 'string',
    alias: 's',
    demandOption: true,
    description: 'The local network name of the printer (e.g. "XYZ1234")',
  },
}).argv;

const printer = new Printer(`http://${argv.server.toLowerCase()}.local.`);

printer.execute('Get-Printer-Attributes', {
  'operation-attributes-tag': {
    'requesting-user-name': 'patti',
    'requested-attributes': [
      'printer-info',
      'operations-supported',
      'printer-icons',
      'copies-supported',
      'pdf-versions-supported',
      'media-source-supported',
      'job-creation-attributes-supported',
      'print-quality-supported',
      'sides-supported',
      'media-supported',
      'print-color-mode-supported',
      'document-format-supported',
      'ipp-features-supported',
    ],
  },
}, (_, response) => {
  console.log(response);
});
