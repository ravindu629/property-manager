# Template API contract (v2: versions)

The contract between Template Studio (this frontend) and the Spring Boot backend
(`procuratio-backend`). Both sides follow this file; change it first, then the code.

- Base URL: `VITE_TEMPLATE_API_URL` in `.env`, for example `http://localhost:8082`.
  The frontend always uses the backend (there is no browser-storage mode).
- All bodies are JSON. Dates are ISO 8601 in UTC, for example `2026-11-20T10:15:00Z`.
- Ids are UUIDs. User ids are UUIDs from the identity service. Until login exists, every
  user id is the system user `00000000-0000-0000-0000-000000000000` (show it as "System").
- Database design: 3 tables, `document_type`, `template`, `template_version`
  (see the backend's `V2__create_template_schema.sql`).

## How versioning works

- A **template** is the stable identity: name, document type, owner, tags, status.
- A **version** is one design of a template, numbered 1, 2, 3 per template.
  - `DRAFT`: work in progress, editable. At most one draft per template.
  - `PUBLISHED`: the version in use. Locked: never edited or deleted.
  - `RETIRED`: an older published version. Locked and kept for history.
- **Save** stores the design in the draft (creating the next draft version if there is none).
- **Publish** turns the draft into the published version; the previous one becomes RETIRED.
- Template `status`: `DRAFT` (never published), `ACTIVE` (has a published version), `ARCHIVED`.
- Form/Viewer and PDF generation use the **current published** version.
  The Designer opens the **draft** if there is one, otherwise the current version.

## Endpoints

| Method | Path | Body | Success | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/document-types` | none | 200 | `DocumentType[]` (active only) |
| GET | `/api/templates` | none | 200 | `TemplateSummary[]`, newest `updatedAt` first |
| GET | `/api/templates/{id}` | none | 200 | `TemplateDetail` |
| POST | `/api/templates` | `CreateTemplate` | 201 | `TemplateDetail` (status DRAFT, draft = version 1) |
| PATCH | `/api/templates/{id}` | `UpdateTemplate` | 200 | `TemplateDetail` |
| DELETE | `/api/templates/{id}?rowVersion={n}` | none | 204 | nothing (soft delete) |
| PUT | `/api/templates/{id}/draft` | `SaveDraft` | 200 | `TemplateDetail` |
| DELETE | `/api/templates/{id}/draft?rowVersion={n}` | none | 204 | nothing (draft discarded) |
| POST | `/api/templates/{id}/publish` | `Publish` | 200 | `TemplateDetail` |
| GET | `/api/templates/{id}/versions` | none | 200 | `VersionSummary[]`, newest first |
| GET | `/api/templates/{id}/versions/{versionNo}` | none | 200 | `VersionRecord` |

`GET /api/templates` query parameters, all optional:
`documentTypeId`, `tag`, `ownerUserId`, `includeArchived` (default `false`).
Deleted templates are never returned by any endpoint (404 when asked for by id).

## JSON shapes

```jsonc
// DocumentType
{ "id": "uuid", "code": "SERVICE_CHARGE_DEMAND", "name": "Service charge demand",
  "category": "FINANCE", "active": true }

// VersionSummary (no design JSON, so lists stay small)
{
  "id": "uuid",
  "versionNo": 2,
  "status": "PUBLISHED",               // DRAFT | PUBLISHED | RETIRED
  "changeNote": "New logo",
  "contentHash": "64 hex characters",  // SHA-256 of the design JSON
  "pdfmeVersion": "6.2.8",
  "publishedAt": "2026-11-20T10:15:00Z", // null for a draft
  "publishedBy": "uuid",                 // null for a draft
  "createdAt": "...", "createdBy": "uuid",
  "updatedAt": "...", "updatedBy": "uuid",
  "rowVersion": 0                        // send back when saving, publishing or discarding a draft
}

// VersionRecord = VersionSummary + the design
{ ...VersionSummary,
  "template": { "basePdf": { ... }, "schemas": [[ ... ]] },   // pdfme Template, stored as-is
  "sampleInputs": [ { "recipientName": "Mr James Carter" } ] }

// TemplateSummary (list items)
{
  "id": "uuid",
  "name": "Service charge demand",
  "description": "Half-yearly demand",
  "tags": ["Finance", "Table"],
  "documentType": { "id": "uuid", "code": "SERVICE_CHARGE_DEMAND", "name": "Service charge demand" },
  "status": "ACTIVE",                  // DRAFT | ACTIVE | ARCHIVED
  "currentVersion": VersionSummary,    // the published version in use; null if never published
  "draftVersion": VersionSummary,      // null if there is no draft
  "ownerUserId": "uuid",
  "createdAt": "...", "createdBy": "uuid",
  "updatedAt": "...", "updatedBy": "uuid",
  "rowVersion": 3                      // send back on PATCH and DELETE of the template
}

// TemplateDetail = TemplateSummary, with full versions (design included)
{ ...TemplateSummary,
  "currentVersion": VersionRecord,     // null if never published
  "draftVersion": VersionRecord }      // null if there is no draft

// CreateTemplate (POST /api/templates)
{ "documentTypeId": "uuid", "name": "Riverside demand", "description": "", "tags": ["Finance"],
  "template": { ... }, "sampleInputs": [ { ... } ] }

// UpdateTemplate (PATCH /api/templates/{id}): only the fields to change, plus rowVersion
{ "rowVersion": 3,
  "name": "New name", "description": "...", "tags": ["..."], "documentTypeId": "uuid",
  "status": "ARCHIVED" }               // ARCHIVED to archive, ACTIVE to restore

// SaveDraft (PUT /api/templates/{id}/draft)
{ "template": { ... }, "sampleInputs": [ { ... } ],
  "draftRowVersion": 0 }               // the draft's rowVersion; null when no draft exists yet

// Publish (POST /api/templates/{id}/publish)
{ "draftRowVersion": 1, "changeNote": "New bank details" }
```

## Rules

- **Validation (400):**
  - `name` required, 1 to 200 characters; `description` at most 2,000; at most 20 tags of at most 50 characters.
  - `documentTypeId` required on create, and must be an active document type.
  - `template` must be an object with `basePdf` and a `schemas` list of pages (each page a list of fields).
  - `sampleInputs` must be a list of objects whose values are text.
  - `changeNote` at most 500 characters.
  - `status` on PATCH may only be `ARCHIVED` or `ACTIVE`; `ACTIVE` needs a published version.
- **Not found (404):** unknown or deleted template id, or unknown version number.
- **Conflicts (409):**
  - `rowVersion` or `draftRowVersion` differs from the stored one: someone else saved first. Reload.
  - Saving with `draftRowVersion: null` when a draft already exists (someone else started one).
  - A second template with the same name (any letter case) and document type.
  - Publishing when there is no draft.
  - Discarding the only version of a template that was never published (delete the template instead).
- **Locked versions:** published and retired versions can never be changed or deleted.
- **Users and time:** the backend fills `createdBy`, `updatedBy`, `publishedBy`, `ownerUserId`
  and all times. The frontend never sends them.
- **Errors:** every error response is `{ "message": "Human readable reason" }`; the frontend shows it.
- **Large bodies:** templates can contain base64 images or a base PDF; bodies up to 20 MB are accepted.
- **CORS:** the frontend origin is allowed for GET, POST, PUT, PATCH and DELETE.

## Removed from v1

`PUT /api/templates/{id}` (whole-template overwrite) and the `version` edit counter are replaced
by draft save and publish. The old `pdf_templates` table is kept until a later migration drops it.
