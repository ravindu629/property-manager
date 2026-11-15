// Template storage API used by the pdfme demo.
//
// The rest of the demo only talks to the `templateApi` object exported at the bottom.
// Today it saves to the browser (localStorage). When the Spring Boot backend is ready,
// set VITE_TEMPLATE_API_URL in .env (for example http://localhost:8080) and the same
// screens will use the REST API instead. Nothing else needs to change.
// The REST endpoints are described in ./API_CONTRACT.md.

import type { TemplatePayload, TemplateRecord, TemplateSummary } from '@/pdfme-demo/types';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TemplateApi {
  /** 'local' = saved in this browser only, 'rest' = saved in the backend database. */
  readonly mode: 'local' | 'rest';
  list(): Promise<TemplateSummary[]>;
  get(id: string): Promise<TemplateRecord>;
  create(payload: TemplatePayload): Promise<TemplateRecord>;
  /** `version` must be the version you loaded; a different one means someone else saved first (409). */
  update(id: string, payload: TemplatePayload, version: number): Promise<TemplateRecord>;
  remove(id: string): Promise<void>;
}

const toSummary = (r: TemplateRecord): TemplateSummary => ({
  id: r.id,
  name: r.name,
  description: r.description,
  tags: r.tags,
  version: r.version,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const byNewest = (a: TemplateSummary, b: TemplateSummary) => b.updatedAt.localeCompare(a.updatedAt);

// ---------------------------------------------------------------------------
// 1. Browser storage version (used until the backend exists)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'procuratio.pdfmeDemo.templates.v1';

function createLocalTemplateApi(): TemplateApi {
  const readAll = (): TemplateRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeAll = (records: TemplateRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      throw new ApiError(
        'Browser storage is full (large images or PDFs use a lot of space). Delete some templates or use Download JSON.',
        507
      );
    }
  };

  // A short pause makes the browser version behave like a real network call
  // (loading states, async errors), so screens are ready for the backend.
  const delay = () => new Promise((resolve) => setTimeout(resolve, 120));

  const findOr404 = (records: TemplateRecord[], id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) throw new ApiError('Template not found. It may have been deleted.', 404);
    return record;
  };

  return {
    mode: 'local',

    async list() {
      await delay();
      return readAll().map(toSummary).sort(byNewest);
    },

    async get(id) {
      await delay();
      return structuredClone(findOr404(readAll(), id));
    },

    async create(payload) {
      await delay();
      const now = new Date().toISOString();
      const record: TemplateRecord = {
        ...structuredClone(payload),
        id: crypto.randomUUID(),
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      writeAll([...readAll(), record]);
      return structuredClone(record);
    },

    async update(id, payload, version) {
      await delay();
      const records = readAll();
      const current = findOr404(records, id);
      if (current.version !== version) {
        throw new ApiError('This template was changed somewhere else. Reload it before saving.', 409);
      }
      const updated: TemplateRecord = {
        ...current,
        ...structuredClone(payload),
        version: current.version + 1,
        updatedAt: new Date().toISOString(),
      };
      writeAll(records.map((r) => (r.id === id ? updated : r)));
      return structuredClone(updated);
    },

    async remove(id) {
      await delay();
      const records = readAll();
      findOr404(records, id);
      writeAll(records.filter((r) => r.id !== id));
    },
  };
}

// ---------------------------------------------------------------------------
// 2. REST version (Spring Boot + PostgreSQL), switched on by VITE_TEMPLATE_API_URL
// ---------------------------------------------------------------------------

function createRestTemplateApi(baseUrl: string): TemplateApi {
  const root = `${baseUrl.replace(/\/+$/, '')}/api/templates`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
      // The backend should reply with { "message": "..." } on errors (see API_CONTRACT.md).
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

  return {
    mode: 'rest',
    list: () => request<TemplateSummary[]>(''),
    get: (id) => request<TemplateRecord>(`/${encodeURIComponent(id)}`),
    create: (payload) => request<TemplateRecord>('', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload, version) =>
      request<TemplateRecord>(`/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ ...payload, version }),
      }),
    remove: (id) => request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

const apiUrl = (import.meta.env.VITE_TEMPLATE_API_URL as string | undefined)?.trim();

export const templateApi: TemplateApi = apiUrl ? createRestTemplateApi(apiUrl) : createLocalTemplateApi();
