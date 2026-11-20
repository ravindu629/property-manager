// Template storage API used by Template Studio.
//
// The rest of the section only talks to the `templateApi` object exported at the bottom.
// Templates are saved by the Spring Boot backend. Set VITE_TEMPLATE_API_URL in .env
// (for example http://localhost:8082). The endpoints are described in ./API_CONTRACT.md.
//
// How versions work, in short:
// - Saving changes the template's draft (a draft is created if there is none).
// - Publishing turns the draft into the version in use. Older versions are kept.

import type {
  CreateTemplatePayload,
  DocumentType,
  SaveDraftPayload,
  TemplateDetail,
  TemplateSummary,
  UpdateTemplatePayload,
  VersionRecord,
  VersionSummary,
} from '@/pdfme-demo/types';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TemplateListFilter {
  documentTypeId?: string;
  tag?: string;
  ownerUserId?: string;
  includeArchived?: boolean;
}

export interface TemplateApi {
  /** All document types. Loaded once and then reused. */
  documentTypes(): Promise<DocumentType[]>;
  list(filter?: TemplateListFilter): Promise<TemplateSummary[]>;
  get(id: string): Promise<TemplateDetail>;
  /** Creates the template with a draft version 1. */
  create(payload: CreateTemplatePayload): Promise<TemplateDetail>;
  /** Changes the name, description, tags, type or status. Needs the template's rowVersion. */
  update(id: string, payload: UpdateTemplatePayload): Promise<TemplateDetail>;
  /** Deletes the template. Needs the template's rowVersion. */
  remove(id: string, rowVersion: number): Promise<void>;
  /** Saves the design to the draft (creates the draft if there is none). */
  saveDraft(id: string, payload: SaveDraftPayload): Promise<TemplateDetail>;
  /** Throws the draft away. Needs the draft's rowVersion. */
  discardDraft(id: string, draftRowVersion: number): Promise<void>;
  /** Makes the draft the version in use. Needs the draft's rowVersion. */
  publish(id: string, draftRowVersion: number, changeNote?: string): Promise<TemplateDetail>;
  /** All versions, newest first. */
  versions(id: string): Promise<VersionSummary[]>;
  /** One version with its design. */
  version(id: string, versionNo: number): Promise<VersionRecord>;
}

/** Shown when VITE_TEMPLATE_API_URL is not set. */
const MISSING_URL_MESSAGE =
  'The template server is not set up. Add VITE_TEMPLATE_API_URL to .env (for example http://localhost:8082) and restart npm run dev.';

function createTemplateApi(baseUrl: string | undefined): TemplateApi {
  const root = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/api` : '';

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!root) throw new ApiError(MISSING_URL_MESSAGE);
    let response: Response;
    try {
      response = await fetch(`${root}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
      });
    } catch {
      throw new ApiError('Cannot reach the template server. Check that the backend is running.');
    }
    if (!response.ok) {
      // The backend replies with { "message": "..." } on errors (see API_CONTRACT.md).
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        if (body && typeof body.message === 'string') message = body.message;
      } catch {
        // keep the default message
      }
      throw new ApiError(message, response.status);
    }
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }

  const send = (method: string, body?: unknown): RequestInit => ({
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const tpl = (id: string) => `/templates/${encodeURIComponent(id)}`;

  let documentTypesCache: Promise<DocumentType[]> | null = null;

  return {
    documentTypes() {
      if (!documentTypesCache) {
        documentTypesCache = request<DocumentType[]>('/document-types').catch((e) => {
          documentTypesCache = null; // try again next time
          throw e;
        });
      }
      return documentTypesCache;
    },

    list(filter = {}) {
      const params = new URLSearchParams();
      if (filter.documentTypeId) params.set('documentTypeId', filter.documentTypeId);
      if (filter.tag) params.set('tag', filter.tag);
      if (filter.ownerUserId) params.set('ownerUserId', filter.ownerUserId);
      if (filter.includeArchived) params.set('includeArchived', 'true');
      const query = params.toString();
      return request<TemplateSummary[]>(`/templates${query ? `?${query}` : ''}`);
    },

    get: (id) => request<TemplateDetail>(tpl(id)),
    create: (payload) => request<TemplateDetail>('/templates', send('POST', payload)),
    update: (id, payload) => request<TemplateDetail>(tpl(id), send('PATCH', payload)),
    remove: (id, rowVersion) => request<void>(`${tpl(id)}?rowVersion=${rowVersion}`, send('DELETE')),
    saveDraft: (id, payload) => request<TemplateDetail>(`${tpl(id)}/draft`, send('PUT', payload)),
    discardDraft: (id, draftRowVersion) =>
      request<void>(`${tpl(id)}/draft?rowVersion=${draftRowVersion}`, send('DELETE')),
    publish: (id, draftRowVersion, changeNote) =>
      request<TemplateDetail>(`${tpl(id)}/publish`, send('POST', { draftRowVersion, changeNote: changeNote || null })),
    versions: (id) => request<VersionSummary[]>(`${tpl(id)}/versions`),
    version: (id, versionNo) => request<VersionRecord>(`${tpl(id)}/versions/${versionNo}`),
  };
}

const apiUrl = (import.meta.env.VITE_TEMPLATE_API_URL as string | undefined)?.trim();

export const templateApi: TemplateApi = createTemplateApi(apiUrl);

/** The design to open for a template: the draft if there is one, otherwise the version in use. */
export function openVersion(t: TemplateDetail): VersionRecord | null {
  return t.draftVersion ?? t.currentVersion;
}

/** The user id used by the backend until login exists. */
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/** A readable name for a user id. */
export const userLabel = (id: string | null | undefined) => (!id ? '' : id === SYSTEM_USER_ID ? 'System' : id.slice(0, 8));
