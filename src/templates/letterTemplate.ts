// Shared A4 letter template used by BOTH libraries (pdfme and React PDF).
// Every position and size is in millimetres, measured from the top-left corner of the page.
// Text can contain {placeholders} that are filled from the JSON data at generation time.

import { SAMPLE_LOGO } from '@/templates/logo';

export const A4 = { width: 210, height: 297 } as const;

export type TextAlign = 'left' | 'center' | 'right';

export interface LetterElement {
  id: string; // unique name, also used as the pdfme field name.
  // Keep ids different from the JSON data keys, otherwise pdfme confuses the field with the placeholder.
  label: string; // friendly name shown in the editor
  type: 'text' | 'image';
  x: number; // mm from left edge
  y: number; // mm from top edge
  width: number; // mm
  height: number; // mm
  content: string; // text with {placeholders}, or an image data URL
  fontSize: number; // pt
  lineHeight: number; // multiplier, e.g. 1.4
  align: TextAlign;
  bold: boolean;
  color: string; // hex colour
  border: boolean; // draw a thin box around the element (used for the address box)
}

export type LetterData = Record<string, string>;

const textDefaults = {
  type: 'text' as const,
  fontSize: 10,
  lineHeight: 1.4,
  align: 'left' as TextAlign,
  bold: false,
  color: '#0f172a',
  border: false,
};

// Positions taken exactly from the task document (Sample A4 Template).
export const SAMPLE_ELEMENTS: LetterElement[] = [
  {
    ...textDefaults,
    id: 'logoImage',
    label: 'Company logo',
    type: 'image',
    x: 20, y: 15, width: 50, height: 20,
    content: SAMPLE_LOGO,
  },
  {
    ...textDefaults,
    id: 'letterheadBox',
    label: 'Letterhead / Company details',
    x: 110, y: 15, width: 80, height: 25,
    fontSize: 9,
    align: 'right',
    color: '#334155',
    content: '{companyName}\n{companyAddress}\nTel: {companyPhone}\n{companyEmail}',
  },
  {
    ...textDefaults,
    id: 'recipientBox',
    label: 'Recipient address box',
    x: 20, y: 50, width: 90, height: 40,
    border: true,
    content:
      '{recipientName}\n{recipientAddress1}\n{recipientAddress2}\n{recipientCity}\n{recipientPostcode}',
  },
  {
    ...textDefaults,
    id: 'dateRefBox',
    label: 'Date / Reference',
    x: 130, y: 50, width: 60, height: 20,
    align: 'right',
    content: 'Date: {letterDate}\nOur ref: {reference}',
  },
  {
    ...textDefaults,
    id: 'subjectLine',
    label: 'Subject line',
    x: 20, y: 100, width: 170, height: 10,
    fontSize: 11,
    bold: true,
    content: 'Re: {subject}',
  },
  {
    ...textDefaults,
    id: 'bodyText',
    label: 'Letter body',
    x: 20, y: 115, width: 170, height: 135,
    fontSize: 10,
    lineHeight: 1.5,
    content: '{body}',
  },
  {
    ...textDefaults,
    id: 'signatureBlock',
    label: 'Signature',
    x: 20, y: 255, width: 80, height: 15,
    content: '{signatoryName}\n{signatoryTitle}',
  },
  {
    ...textDefaults,
    id: 'footerText',
    label: 'Company footer',
    x: 20, y: 280, width: 170, height: 10,
    fontSize: 7.5,
    align: 'center',
    color: '#64748b',
    content:
      '{companyName}  |  Registered in England No. {companyNumber}  |  {companyWebsite}',
  },
];

// Sample dynamic JSON data. The same object is used by both libraries.
export const SAMPLE_DATA: LetterData = {
  companyName: 'Procuratio Property Management Ltd',
  companyAddress: '12 Harbour Street, Bristol BS1 4QA',
  companyPhone: '0117 496 0000',
  companyEmail: 'info@procuratio.co.uk',
  companyNumber: '08123456',
  companyWebsite: 'www.procuratio.co.uk',
  recipientName: 'Mr James Carter',
  recipientAddress1: 'Flat 4, Riverside Court',
  recipientAddress2: '27 Quay Road',
  recipientCity: 'Bristol',
  recipientPostcode: 'BS1 6XY',
  letterDate: '11 November 2026',
  reference: 'PRC/RC/2026/0412',
  subject: 'Service Charge Budget for the year ending 31 December 2027',
  body:
    'Dear Mr Carter,\n\n' +
    'Please find enclosed the proposed service charge budget for Riverside Court for the year ending 31 December 2027.\n\n' +
    'The budget has been prepared in line with the terms of your lease and covers buildings insurance, cleaning of the communal areas, gardening, lift maintenance and a contribution to the reserve fund for future major works.\n\n' +
    'Your share of the total budget is 4.25%, which gives an annual service charge of £1,836.00. This will be demanded in two equal instalments on 1 January and 1 July 2027.\n\n' +
    'If you have any questions about the budget, please contact us on the number above or reply to this letter quoting the reference shown.\n\n' +
    'Yours sincerely,',
  signatoryName: 'Sarah Mitchell',
  signatoryTitle: 'Senior Property Manager',
};

// Replace {key} with the matching value from data. Unknown keys are left as they are.
export function fillPlaceholders(text: string, data: LetterData): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in data ? String(data[key]) : match
  );
}

// Make a deep copy so edits never change the sample constants.
export function cloneElements(elements: LetterElement[]): LetterElement[] {
  return elements.map((el) => ({ ...el }));
}

// ---------- Saving and loading helpers (used by both sections) ----------

export function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(value: unknown, fileName: string) {
  downloadBlob(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }), fileName);
}

// Opens a file picker and returns the parsed JSON (or null if cancelled).
export function pickJsonFile(): Promise<unknown | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(JSON.parse(await file.text()));
      } catch {
        alert('That file is not valid JSON.');
        resolve(null);
      }
    };
    input.click();
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
