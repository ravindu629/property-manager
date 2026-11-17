// Built-in example templates shown on the Templates tab.
// Each field starts from the plugin's own default settings (propPanel.defaultSchema),
// so it always has every property pdfme expects. Positions and sizes are in millimetres.
//
// Fields marked `readOnly: true` are fixed parts of the design (logo, letterhead, footer).
// All other fields are editable: their `content` is sample data, and the Form tab lets
// users fill them in for one letter.

import type { Schema, Template } from '@pdfme/common';
import { barcodes, checkbox, date, line, multiVariableText, select, signature, svg, table, text } from '@pdfme/schemas';
import type { GalleryItem } from '@/pdfme-demo/types';

type PluginLike = { propPanel: { defaultSchema: Schema } };
type Box = [x: number, y: number, width: number, height: number];

/** Creates a field from a plugin's defaults, placed at [x, y, width, height] in mm. */
function field(plugin: PluginLike, name: string, [x, y, width, height]: Box, extra: Record<string, unknown> = {}): Schema {
  return {
    ...structuredClone(plugin.propPanel.defaultSchema),
    name,
    position: { x, y },
    width,
    height,
    ...extra,
  } as Schema;
}

const A4 = { width: 210, height: 297, padding: [0, 0, 0, 0] as [number, number, number, number] };
const BRAND = '#0369a1';
const MUTED = '#64748b';
const BORDER = { top: 0.3, right: 0.3, bottom: 0.3, left: 0.3 };
const PAD = { top: 3, right: 3, bottom: 3, left: 3 };

// Simple house logo drawn with shapes only (no fonts needed inside the SVG).
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${BRAND}"/>
  <path d="M32 14 L12 32 H18 V50 H28 V38 H36 V50 H46 V32 H52 Z" fill="#ffffff"/>
</svg>`;

/** Logo, company name and contact details: the same letterhead on every business template. */
function letterhead(): Schema[] {
  return [
    field(svg, 'logo', [20, 15, 16, 16], { content: LOGO_SVG, readOnly: true }),
    field(text, 'brandName', [39, 16, 70, 8], {
      content: 'PROCURATIO', readOnly: true, fontSize: 16, fontColor: BRAND, characterSpacing: 0.5,
    }),
    field(text, 'brandTagline', [39, 24, 70, 6], {
      content: 'Property Management', readOnly: true, fontSize: 8, fontColor: MUTED,
    }),
    field(text, 'companyDetails', [110, 15, 80, 22], {
      content: 'Procuratio Property Management Ltd\n12 Harbour Street, Bristol BS1 4QA\nTel: 0117 496 0000\ninfo@procuratio.co.uk',
      readOnly: true, fontSize: 8.5, lineHeight: 1.4, alignment: 'right', fontColor: '#334155',
    }),
  ];
}

function footer(): Schema[] {
  return [
    field(line, 'footerLine', [20, 279, 170, 0.2], { color: '#cbd5e1', readOnly: true }),
    field(text, 'footerText', [20, 282, 170, 8], {
      content: 'Procuratio Property Management Ltd  |  Registered in England No. 08123456  |  www.procuratio.co.uk',
      readOnly: true, fontSize: 7.5, alignment: 'center', fontColor: MUTED,
    }),
  ];
}

const title = (content: string, color = BRAND) =>
  field(text, 'title', [20, 40, 170, 9], { content, readOnly: true, fontSize: 15, fontColor: color });

const page = (schemas: Schema[]): Template => ({ basePdf: A4, schemas: [schemas] });

// ---------------------------------------------------------------------------

const blank: GalleryItem = {
  id: 'blank-a4',
  name: 'Blank A4',
  description: 'An empty A4 page (210 x 297 mm). Start your own design from scratch.',
  tags: ['Basic'],
  template: page([]),
  sampleInputs: [{}],
};

const letter: GalleryItem = {
  id: 'property-letter',
  name: 'Property letter',
  description: 'Standard A4 letter: letterhead, address box for a window envelope, subject, body and signature.',
  tags: ['Letter', 'Property'],
  template: page([
    ...letterhead(),
    field(text, 'recipientAddress', [20, 50, 90, 40], {
      content: 'Mr James Carter\nFlat 4, Riverside Court\n27 Quay Road\nBristol\nBS1 6XY',
      fontSize: 10, lineHeight: 1.4, borderColor: '#94a3b8', borderWidth: BORDER, padding: PAD,
    }),
    field(text, 'letterDate', [130, 50, 60, 6], { content: '13 November 2026', fontSize: 10, alignment: 'right' }),
    field(text, 'reference', [130, 57, 60, 6], { content: 'Our ref: PRC/RC/2026/0412', fontSize: 10, alignment: 'right' }),
    field(text, 'subject', [20, 100, 170, 10], {
      content: 'Re: Service Charge Budget for the year ending 31 December 2027', fontSize: 11,
    }),
    field(text, 'body', [20, 115, 170, 135], {
      content:
        'Dear Mr Carter,\n\n' +
        'Please find enclosed the proposed service charge budget for Riverside Court for the year ending 31 December 2027.\n\n' +
        'The budget covers buildings insurance, cleaning of the communal areas, gardening, lift maintenance and a contribution to the reserve fund.\n\n' +
        'If you have any questions, please contact us on the number above quoting the reference shown.\n\n' +
        'Yours sincerely,',
      fontSize: 10, lineHeight: 1.5,
    }),
    field(text, 'signatoryName', [20, 255, 80, 6], { content: 'Sarah Mitchell', fontSize: 10 }),
    field(text, 'signatoryTitle', [20, 261, 80, 6], { content: 'Senior Property Manager', fontSize: 10, fontColor: MUTED }),
    ...footer(),
  ]),
  sampleInputs: [{}],
};

const demand: GalleryItem = {
  id: 'service-charge-demand',
  name: 'Service charge demand',
  description: 'Invoice-style demand with a line-item table, totals, bank details and a payment QR code.',
  tags: ['Finance', 'Table', 'QR code'],
  template: page([
    ...letterhead(),
    title('SERVICE CHARGE DEMAND'),
    field(text, 'recipientAddress', [20, 53, 90, 35], {
      content: 'Ms Priya Shah\nFlat 12, Riverside Court\n27 Quay Road\nBristol\nBS1 6XY',
      fontSize: 10, lineHeight: 1.4, borderColor: '#94a3b8', borderWidth: BORDER, padding: PAD,
    }),
    // Multi-Variable Text: one box, several named values. The Form shows one input per variable.
    field(multiVariableText, 'demandDetails', [115, 53, 75, 35], {
      text: 'Demand no: {demandNo}\nIssue date: {issueDate}\nDue date: {dueDate}\nProperty: {propertyRef}',
      variables: ['demandNo', 'issueDate', 'dueDate', 'propertyRef'],
      content: JSON.stringify({
        demandNo: 'SCD-2027-0112', issueDate: '1 December 2026', dueDate: '1 January 2027', propertyRef: 'RC-012',
      }),
      fontSize: 10, lineHeight: 1.6, alignment: 'right',
    }),
    field(table, 'lineItems', [20, 96, 170, 70], {
      head: ['Description', 'Amount (£)'],
      headWidthPercentages: [75, 25],
      content: JSON.stringify([
        ['Buildings insurance', '312.50'],
        ['Communal cleaning', '145.00'],
        ['Gardening and grounds', '96.25'],
        ['Lift maintenance', '128.75'],
        ['Reserve fund contribution', '150.00'],
        ['Management fee (incl. VAT)', '102.60'],
      ]),
      tableStyles: { borderColor: '#cbd5e1', borderWidth: 0.2 },
      headStyles: {
        ...(table.propPanel.defaultSchema as Record<string, unknown>).headStyles as object,
        fontSize: 10, backgroundColor: BRAND, padding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      bodyStyles: {
        ...(table.propPanel.defaultSchema as Record<string, unknown>).bodyStyles as object,
        fontSize: 10, alternateBackgroundColor: '#f8fafc', padding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      columnStyles: { alignment: { '1': 'right' } },
    }),
    field(text, 'totalDue', [110, 170, 80, 9], {
      content: 'Total due: £935.10', fontSize: 13, alignment: 'right', fontColor: '#0f172a',
    }),
    field(text, 'paymentDetails', [20, 190, 130, 32], {
      content:
        'How to pay\nBank transfer to: Riverside Court Service Charge Account\nSort code: 12-34-56    Account no: 12345678\nPlease quote your property reference.',
      readOnly: true, fontSize: 9.5, lineHeight: 1.5, borderColor: '#94a3b8', borderWidth: BORDER, padding: PAD,
    }),
    field(barcodes.qrcode, 'paymentQr', [160, 190, 30, 30], {
      content: 'https://pay.procuratio.co.uk/demand/SCD-2027-0112',
    }),
    field(text, 'notes', [20, 232, 170, 30], {
      content:
        'This demand is issued under the terms of your lease. A summary of the rights and obligations of leaseholders in relation to service charges accompanies this demand.',
      fontSize: 8, lineHeight: 1.4, fontColor: '#475569',
    }),
    ...footer(),
  ]),
  sampleInputs: [{}],
};

const receipt: GalleryItem = {
  id: 'payment-receipt',
  name: 'Payment receipt',
  description: 'Receipt with a date field, large amount box and a verification QR code.',
  tags: ['Finance', 'Date', 'QR code'],
  template: page([
    ...letterhead(),
    title('PAYMENT RECEIPT', '#15803d'),
    field(text, 'receiptNo', [20, 55, 80, 7], { content: 'Receipt no: RCPT-2026-03381', fontSize: 10 }),
    field(text, 'paymentDateLabel', [20, 63, 30, 7], { content: 'Date received:', readOnly: true, fontSize: 10 }),
    field(date, 'paymentDate', [48, 63, 50, 7], { content: '2026/11/09', format: 'dd/MM/yyyy', fontSize: 10 }),
    field(text, 'paymentMethod', [20, 71, 80, 7], { content: 'Method: Bank transfer', fontSize: 10 }),
    field(text, 'receivedFrom', [110, 55, 80, 30], {
      content: 'Received from:\nMr James Carter\nFlat 4, Riverside Court\nBristol BS1 6XY',
      fontSize: 10, lineHeight: 1.4, borderColor: '#94a3b8', borderWidth: BORDER, padding: PAD,
    }),
    field(text, 'amount', [20, 95, 170, 22], {
      content: 'Amount received: £918.00', fontSize: 18, alignment: 'center', verticalAlignment: 'middle',
      borderColor: '#15803d', borderWidth: BORDER,
    }),
    field(text, 'allocation', [20, 127, 120, 30], {
      content: 'Allocated to:\nService charge (Jul to Dec 2026): £868.00\nGround rent (2026): £50.00',
      fontSize: 10, lineHeight: 1.6,
    }),
    field(barcodes.qrcode, 'verifyQr', [160, 127, 30, 30], {
      content: 'https://verify.procuratio.co.uk/receipt/RCPT-2026-03381',
    }),
    field(text, 'thanks', [20, 165, 170, 10], {
      content: 'Thank you for your payment. Please keep this receipt for your records.',
      readOnly: true, fontSize: 9.5, fontColor: MUTED,
    }),
    ...footer(),
  ]),
  sampleInputs: [{}],
};

const checklistItems = [
  'Communal lighting working',
  'Fire doors close fully',
  'Fire alarm panel shows no faults',
  'Escape routes clear',
  'Bin store clean and tidy',
  'Lift operating normally',
  'Gardens and grounds maintained',
];

const inspection: GalleryItem = {
  id: 'inspection-checklist',
  name: 'Property inspection checklist',
  description: 'Fillable form: checkboxes, a drop-down, a date and a hand-drawn signature. Try it on the Form/Viewer tab.',
  tags: ['Form', 'Checkbox', 'Signature'],
  template: page([
    ...letterhead(),
    title('PROPERTY INSPECTION CHECKLIST'),
    field(text, 'propertyLabel', [20, 55, 35, 7], { content: 'Property:', readOnly: true, fontSize: 10, fontColor: MUTED }),
    field(text, 'property', [55, 55, 135, 7], { content: 'Riverside Court, 27 Quay Road, Bristol BS1 6XY', fontSize: 10 }),
    field(text, 'inspectorLabel', [20, 64, 35, 7], { content: 'Inspector:', readOnly: true, fontSize: 10, fontColor: MUTED }),
    field(text, 'inspector', [55, 64, 70, 7], { content: 'Sarah Mitchell', fontSize: 10 }),
    field(text, 'dateLabel', [130, 64, 15, 7], { content: 'Date:', readOnly: true, fontSize: 10, fontColor: MUTED }),
    field(date, 'inspectionDate', [145, 64, 45, 7], { content: '2026/11/13', format: 'dd/MM/yyyy', fontSize: 10 }),
    field(line, 'checklistLine', [20, 78, 170, 0.2], { color: '#cbd5e1', readOnly: true }),
    ...checklistItems.flatMap((label, i) => {
      const y = 84 + i * 11;
      return [
        field(checkbox, `check${i + 1}`, [20, y, 6, 6], { content: i < 5 ? 'true' : 'false', color: BRAND }),
        field(text, `checkLabel${i + 1}`, [30, y + 0.5, 150, 6], { content: label, readOnly: true, fontSize: 10.5 }),
      ];
    }),
    field(text, 'conditionLabel', [20, 167, 45, 7], { content: 'Overall condition:', readOnly: true, fontSize: 10.5 }),
    field(select, 'condition', [65, 167, 40, 7], { content: 'Good', options: ['Good', 'Fair', 'Poor'], fontSize: 10.5 }),
    field(text, 'notesLabel', [20, 180, 170, 7], { content: 'Notes', readOnly: true, fontSize: 10.5, fontColor: MUTED }),
    field(text, 'notes', [20, 187, 170, 40], {
      content: 'Lift engineer booked for 20 November. Gardener asked to clear leaves from the side path.',
      fontSize: 10, lineHeight: 1.5, borderColor: '#94a3b8', borderWidth: BORDER, padding: PAD,
    }),
    field(text, 'signatureLabel', [20, 235, 60, 7], { content: 'Inspector signature', readOnly: true, fontSize: 10, fontColor: MUTED }),
    field(signature, 'inspectorSignature', [20, 242, 70, 30]),
    ...footer(),
  ]),
  sampleInputs: [{}],
};

export const GALLERY_TEMPLATES: GalleryItem[] = [letter, demand, receipt, inspection, blank];

export const GALLERY_TAGS = Array.from(new Set(GALLERY_TEMPLATES.flatMap((t) => t.tags))).sort();
