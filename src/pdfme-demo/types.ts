// Shared types for the pdfme demo section.
// The "Template*" types match the JSON the future Spring Boot REST API will send and receive
// (see src/pdfme-demo/api/API_CONTRACT.md).

import type { Template } from '@pdfme/common';

/** One object per PDF page set: field name -> value. pdfme's standard input format. */
export type Inputs = Record<string, string>[];

/** Short version of a saved template, used in lists (no template JSON, so lists stay small). */
export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** Increases on every update. Sent back on update so two people can't overwrite each other. */
  version: number;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}

/** Full saved template, as returned by GET /api/templates/{id}. */
export interface TemplateRecord extends TemplateSummary {
  template: Template;
  sampleInputs: Inputs;
}

/** Body sent when creating or updating a template. */
export interface TemplatePayload {
  name: string;
  description: string;
  tags: string[];
  template: Template;
  sampleInputs: Inputs;
}

/** A built-in example shown on the Library tab. */
export interface GalleryItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  template: Template;
  sampleInputs: Inputs;
}

/** Where the document open in the Designer / Form came from. */
export type DocSource =
  | { kind: 'gallery'; galleryId: string }
  | { kind: 'workspace'; id: string; version: number }
  | { kind: 'new' };

/** The template currently open in the Designer and Form/Viewer tabs. */
export interface OpenDocument {
  /** Changes when a different document is opened, so the editors are rebuilt. */
  key: string;
  /** Changes when the template is replaced from outside the Designer (reset, JSON edit, new base PDF). */
  revision: number;
  name: string;
  description: string;
  tags: string[];
  source: DocSource;
  template: Template;
  inputs: Inputs;
  /** Last saved (or originally opened) state, used by Reset and the "unsaved changes" dot. */
  baseline: { template: Template; inputs: Inputs };
  dirty: boolean;
}

export type DemoTab = 'templates' | 'workspace' | 'designer' | 'form-viewer';
