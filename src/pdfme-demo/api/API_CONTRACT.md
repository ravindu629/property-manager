# Template API contract (for the Spring Boot backend)

The pdfme demo frontend already calls these endpoints when `VITE_TEMPLATE_API_URL` is set
in `.env` (for example `VITE_TEMPLATE_API_URL=http://localhost:8082`).
Without it, the frontend saves templates in the browser instead.

Base path: `/api/templates`. All bodies are JSON.

## Endpoints

| Method | Path | Body | Success | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/templates` | none | 200 | `TemplateSummary[]`, newest `updatedAt` first |
| GET | `/api/templates/{id}` | none | 200 | `TemplateRecord` |
| POST | `/api/templates` | `TemplatePayload` | 201 | `TemplateRecord` (new `id`, `version` = 1) |
| PUT | `/api/templates/{id}` | `TemplatePayload` + `version` | 200 | `TemplateRecord` (`version` + 1) |
| DELETE | `/api/templates/{id}` | none | 204 | nothing |

## JSON shapes

```jsonc
// TemplateSummary (list items, no template JSON)
{
  "id": "6f1c2a4e-...",            // UUID
  "name": "Service charge demand",
  "description": "Half-yearly demand",
  "tags": ["Finance", "Demand"],
  "version": 3,
  "createdAt": "2026-11-13T09:15:00Z",
  "updatedAt": "2026-11-13T10:02:11Z"
}

// TemplateRecord = TemplateSummary + these two fields
{
  "template": { "basePdf": { ... }, "schemas": [[ ... ]] },   // pdfme Template, stored as-is
  "sampleInputs": [ { "recipientName": "Mr James Carter" } ] // pdfme inputs
}

// TemplatePayload (POST body). PUT body is the same plus "version".
{
  "name": "Service charge demand",
  "description": "Half-yearly demand",
  "tags": ["Finance"],
  "template": { ... },
  "sampleInputs": [ { ... } ],
  "version": 3            // PUT only: the version the user loaded
}
```

## Rules

- **Validation:** `name` is required (1 to 200 characters). `template` must have `basePdf` and `schemas`.
  On failure return **400**.
- **Not found:** unknown `id` returns **404**.
- **Optimistic locking:** on PUT, if `version` differs from the stored version return **409**
  (someone else saved first). Use JPA `@Version`.
- **Errors:** every error response has a body `{ "message": "Human readable reason" }`.
  The frontend shows this message to the user.
- **Large bodies:** templates can contain base64 images or a base PDF. Allow request bodies
  of at least 20 MB.
- **CORS:** allow the frontend origin (for example `http://localhost:5173`) for GET, POST, PUT, DELETE.

## Suggested PostgreSQL table

```sql
CREATE TABLE pdf_templates (
  id            UUID PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  template      JSONB NOT NULL,
  sample_inputs JSONB NOT NULL DEFAULT '[]',
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
