// Converts the shared letter elements into a pdfme Template.
// pdfme works in millimetres natively, so x / y / width / height are copied as they are.

import type { Template, Schema } from '@pdfme/common';
import { getInputFromTemplate } from '@pdfme/common';
import { text, image, rectangle, line } from '@pdfme/schemas';
import { A4, type LetterData, type LetterElement } from '@/templates/letterTemplate';

// The building blocks (plugins) pdfme is allowed to use in the designer and generator.
export const pdfmePlugins = {
  Text: text,
  Image: image,
  Rectangle: rectangle,
  Line: line,
};

function toSchema(el: LetterElement): Schema {
  const base = {
    name: el.id,
    position: { x: el.x, y: el.y },
    width: el.width,
    height: el.height,
    // readOnly + content = fixed template content. Text content can contain {placeholders}
    // that pdfme fills from the input data when it generates the PDF.
    readOnly: true,
    content: el.content,
  };

  if (el.type === 'image') {
    return { ...base, type: 'image' };
  }

  return {
    ...base,
    type: 'text',
    fontSize: el.fontSize,
    lineHeight: el.lineHeight,
    alignment: el.align,
    verticalAlignment: 'top',
    characterSpacing: 0,
    fontColor: el.color,
    backgroundColor: '',
    ...(el.border
      ? {
          borderColor: '#94a3b8',
          borderWidth: { top: 0.3, right: 0.3, bottom: 0.3, left: 0.3 },
          padding: { top: 3, right: 3, bottom: 3, left: 3 },
        }
      : {}),
  };
}

export function toPdfmeTemplate(elements: LetterElement[]): Template {
  return {
    // A blank A4 page (210 x 297 mm) with no padding, so coordinates start at the page corner.
    basePdf: { width: A4.width, height: A4.height, padding: [0, 0, 0, 0] },
    schemas: [elements.map(toSchema)],
  };
}

// Adds thin red outline boxes around every element. Used to check positions visually.
export function withLayoutBoxes(template: Template): Template {
  const page = template.schemas[0] ?? [];
  const boxes: Schema[] = page.map((s) => ({
    name: `__box_${s.name}`,
    type: 'rectangle',
    position: { ...s.position },
    width: s.width,
    height: s.height,
    borderWidth: 0.2,
    borderColor: '#ef4444',
    color: '',
    readOnly: true,
  }));
  return { ...template, schemas: [[...page, ...boxes], ...template.schemas.slice(1)] };
}

// pdfme needs one input object per PDF. We start from the default values of any
// editable (non read-only) fields in the template, then add the JSON data on top.
export function buildPdfmeInputs(template: Template, data: LetterData) {
  const defaults = getInputFromTemplate(template)[0] ?? {};
  return [{ ...defaults, ...data }];
}
