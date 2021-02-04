import { readFile } from 'fs/promises';

import {
  GetPrinterAttributesResponse,
  Media,
  PrintColorMode,
  Printer,
  PrinterDescription,
  PrintJobResponse,
  PrintQuality,
  Sides,
} from 'ipp';

const toPromise = <T>(callback: (cb: (error: Error, response: T) => void) => void): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    callback((error, response) => {
      if (error !== null) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
};

interface Options {
  userName?: string;
}

interface PrinterInfo {
  name: string;
  logo: string;
  documentFormats: {
    pdf: boolean;
  },
  operations: {
    print: boolean;
    listJobs: boolean;
    cancelJobs: boolean;
  },
  jobAttributes: {
    copies: boolean;
    sides: boolean;
    media: boolean;
    printQuality: boolean;
    printColorMode: boolean;
  },
  media: Media[];
  maxCopies: number;
  sides: Sides[];
  printQuality: PrintQuality[];
  printColorMode: PrintColorMode[];
}

export default (serverName: string, {
  userName = 'ipp-print-server',
}: Options = {}) => {
  const url = `http://${serverName.toLowerCase()}.local.`;
  const instance = new Printer(url);

  let info: PrinterInfo|undefined = undefined;

  const getInfo = async (): Promise<PrinterInfo> => {
    if (info !== undefined) {
      return info;
    }

    const response = await toPromise<GetPrinterAttributesResponse>((callback) => {
      instance.execute('Get-Printer-Attributes', {
        'operation-attributes-tag': {
          'requesting-user-name': userName,
          'requested-attributes': [
            'printer-info',
            'operations-supported',
            'printer-icons',
            'copies-supported',
            'job-creation-attributes-supported',
            'print-quality-supported',
            'sides-supported',
            'media-supported',
            'print-color-mode-supported',
            'document-format-supported',
          ],
        },
      }, callback);
    });

    const attributes: PrinterDescription = response['printer-attributes-tag'];

    info = {
      name: attributes['printer-info'] || '',
      logo: (attributes['printer-icons'] || [''])[0],
      documentFormats: {
        pdf: (attributes['document-format-supported'] || []).includes('application/pdf'),
      },
      operations: {
        print: (attributes['operations-supported'] || []).includes('Print-Job'),
        listJobs: (attributes['operations-supported'] || []).includes('Get-Jobs'),
        cancelJobs: (attributes['operations-supported'] || []).includes('Cancel-Job'),
      },
      jobAttributes: {
        copies: (attributes['job-creation-attributes-supported'] || []).includes('copies'),
        sides: (attributes['job-creation-attributes-supported'] || []).includes('sides'),
        media: (attributes['job-creation-attributes-supported'] || []).includes('media'),
        printColorMode: (attributes['job-creation-attributes-supported'] || []).includes('print-color-mode'),
        printQuality: (attributes['job-creation-attributes-supported'] || []).includes('print-quality'),
      },
      maxCopies: (attributes['copies-supported'] || [1, 99])[1],
      media: (attributes['media-supported'] || []),
      sides: (attributes['sides-supported'] || []),
      printQuality: (attributes['print-quality-supported'] || []),
      printColorMode: (attributes['print-color-mode-supported'] || []),
    };

    return info;
  }

  return {
    getInfo,

    async printURI(uri: string) {
      return await toPromise<PrintJobResponse>((callback) => {
        instance.execute('Print-URI', {
          "operation-attributes-tag": {
            "requesting-user-name": userName,
            'document-uri': uri,
          },
        }, callback);
      });
    },

    async printFile(path: string) {
      const data = await readFile(path);

      return await toPromise<PrintJobResponse>((callback) => {
        instance.execute('Print-Job', {
          "operation-attributes-tag": {
            "requesting-user-name": userName,
          },
          data,
        }, callback);
      });
    },
  };
};
