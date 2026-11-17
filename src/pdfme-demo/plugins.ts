// Every field type the demo Designer offers, the same set as the official pdfme playground.
// The same object must be passed to Designer, Form, Viewer and generate(), so they all
// understand the same field types.

import {
  barcodes,
  checkbox,
  circleMark,
  date,
  dateTime,
  ellipse,
  image,
  line,
  list,
  multiVariableText,
  radioGroup,
  rectangle,
  select,
  signature,
  svg,
  table,
  text,
  time,
} from '@pdfme/schemas';

export const demoPlugins = {
  Text: text,
  'Multi-Variable Text': multiVariableText,
  Table: table,
  List: list,
  Line: line,
  Rectangle: rectangle,
  Ellipse: ellipse,
  Image: image,
  SVG: svg,
  Signature: signature,
  QR: barcodes.qrcode,
  EAN13: barcodes.ean13,
  Code128: barcodes.code128,
  DateTime: dateTime,
  Date: date,
  Time: time,
  Select: select,
  Checkbox: checkbox,
  RadioGroup: radioGroup,
  'Circle Mark': circleMark,
};

/** Languages the pdfme UI supports (for the Lang menu). */
export const UI_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pl', label: 'Polish' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
] as const;

export type UiLanguage = (typeof UI_LANGUAGES)[number]['value'];
