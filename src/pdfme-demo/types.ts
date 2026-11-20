// Shared types for the pdfme demo section.
// The "Template*" types match the JSON the Spring Boot REST API sends and receives
// (see src/pdfme-demo/api/API_CONTRACT.md).

import type { Template } from '@pdfme/common';

/** One object per PDF page set: field name -> value. pdfme's standard input format. */
export type Inputs = Record<string, string>[];

/** A kind of document a template produces, from GET /api/document-types. */
export interface DocumentType {
  id: string;
  code: string;
  name: string;
  category: string;
  active: boolean;
}

/** The document type shown inside a template. */
export interface DocumentTypeRef {
  id: string;
  code: string;
  name: string;
}

export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type VersionStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';

/** One version of a template, without the design JSON. */
export interface VersionSummary {
  id: string;
  versionNo: number;
  status: VersionStatus;
  changeNote: string | null;
  contentHash: string;
  pdfmeVersion: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  /** Increases on every change. Sent back so two people can't overwrite each other. */
  rowVersion: number;
}

/** One version of a template, with the design. */
export interface VersionRecord extends VersionSummary {
  template: Template;
  sampleInputs: Inputs;
}

/** Fields every template has. */
interface TemplateBase {
  id: string;
  name: string;
  description: string;
  tags: string[];
  documentType: DocumentTypeRef;
  status: TemplateStatus;
  ownerUserId: string;
  createdAt: string; // ISO date-time
  createdBy: string;
  updatedAt: string; // ISO date-time
  updatedBy: string;
  /** Increases on every change to the template's details. */
  rowVersion: number;
}

/** One item of GET /api/templates (no design JSON, so lists stay small). */
export interface TemplateSummary extends TemplateBase {
  currentVersion: VersionSummary | null;
  draftVersion: VersionSummary | null;
}

/** Full template, as returned by GET /api/templates/{id}. */
export interface TemplateDetail extends TemplateBase {
  currentVersion: VersionRecord | null;
  draftVersion: VersionRecord | null;
}

/** Body of POST /api/templates. */
export interface CreateTemplatePayload {
  documentTypeId: string;
  name: string;
  description: string;
  tags: string[];
  template: Template;
  sampleInputs: Inputs;
}

/** Body of PATCH /api/templates/{id}. Fields left out are not changed. */
export interface UpdateTemplatePayload {
  rowVersion: number;
  name?: string;
  description?: string;
  tags?: string[];
  documentTypeId?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

/** Body of PUT /api/templates/{id}/draft. */
export interface SaveDraftPayload {
  template: Template;
  sampleInputs: Inputs;
  /** The draft's rowVersion you loaded, or null when there was no draft. */
  draftRowVersion: number | null;
}

/** Empty details for a new template: no name yet, document type "Other". */
export const EMPTY_DETAILS = { name: '', description: '', tags: [] as string[], documentTypeCode: 'OTHER' };

/** A built-in example shown on the Library tab. */
export interface GalleryItem {
  id: string;
  name: string;
  /** Code of the document type used when the item is saved to My Workspace. */
  documentTypeCode: string;
  description: string;
  tags: string[];
  template: Template;
  sampleInputs: Inputs;
}

/** Where the document open in the Designer / Form came from. */
export type DocSource =
  | { kind: 'gallery'; galleryId: string }
  | {
      kind: 'workspace';
      id: string;
      /** The template's rowVersion, sent back when renaming or deleting. */
      rowVersion: number;
      /** The draft's rowVersion, or null when there is no draft yet. */
      draftRowVersion: number | null;
      /** The version open in the Designer (the draft if there is one, else the current version). */
      versionNo: number;
      versionStatus: VersionStatus;
      /** Number of the published version in use, or null if never published. */
      publishedVersionNo: number | null;
      documentTypeId: string;
    }
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
  /** Code of the document type, for example GENERAL_LETTER. */
  documentTypeCode: string;
  source: DocSource;
  template: Template;
  inputs: Inputs;
  /** Last saved (or originally opened) state, used by Reset and the "unsaved changes" dot. */
  baseline: { template: Template; inputs: Inputs };
  dirty: boolean;
}

export type DemoTab = 'templates' | 'workspace' | 'designer' | 'form-viewer';
