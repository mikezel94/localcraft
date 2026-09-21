import { uid } from '@/lib/utils';

import type { ItemRow, ReceiptSpec } from './pdf';

interface SampleBusiness {
  name: string;
  details: string;
  items: [string, number, number][];
}

const BUSINESSES: SampleBusiness[] = [
  {
    name: 'Nordwind Coffee Roasters',
    details: '14 Harbour Lane, Portland OR\n(503) 555-0141 · hello@nordwind.coffee',
    items: [
      ['Flat white', 1, 4.2],
      ['Cardamom bun', 2, 3.8],
      ['Ethiopia pour-over, 250g', 1, 16.5],
      ['Oat flat white', 1, 4.6],
    ],
  },
  {
    name: 'Hexadecimal Hardware Co.',
    details: 'Unit 9, Maker Yard, Austin TX\n(512) 555-0188 · orders@hexhw.io',
    items: [
      ['RP2040 microcontroller', 3, 4.0],
      ['Breadboard, full size', 1, 6.5],
      ['Jumper wire kit', 1, 9.9],
      ['USB-C PD trigger board', 2, 12.0],
    ],
  },
  {
    name: 'Bluebird Bakery',
    details: '22 Mill Street, Burlington VT\n(802) 555-0117',
    items: [
      ['Sourdough loaf', 1, 8.0],
      ['Croissant', 4, 3.5],
      ['Almond tart', 2, 5.25],
    ],
  },
  {
    name: 'Mechanica Bikes',
    details: '5 Velodrome Way, Sacramento CA\n(916) 555-0163 · service@mechanica.bike',
    items: [
      ['Tubeless valve set', 1, 24.0],
      ['Chain, 11-speed', 1, 32.5],
      ['Gear tune-up', 1, 55.0],
      ['Bar tape, cork', 1, 18.9],
    ],
  },
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Fill the form with a plausible random business + order, keeping style choices. */
export function makeSampleSpec(base: ReceiptSpec): ReceiptSpec {
  const business = pick(BUSINESSES);
  const items: ItemRow[] = business.items.map(([description, qty, unitPrice]) => ({
    id: uid(),
    description,
    qty: String(qty),
    unitPrice: unitPrice.toFixed(2),
  }));
  const docType: ReceiptSpec['docType'] = Math.random() > 0.5 ? 'receipt' : 'invoice';
  return {
    ...base,
    docType,
    businessName: business.name,
    businessDetails: business.details,
    documentNumber: `${docType === 'invoice' ? 'INV' : 'R'}-${1000 + Math.floor(Math.random() * 9000)}`,
    items,
    customerName: pick(['Sam Ortega', 'Priya N.', 'J. Whitfield', 'Marta Kowalska', '']),
    servedBy: pick(['Noor', 'Ellis', 'Tomás', 'June', '']),
    tipAmount: docType === 'receipt' ? (Math.random() * 4).toFixed(2) : '0',
  };
}
