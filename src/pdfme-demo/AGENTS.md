# AGENTS.md: Template Studio (src/pdfme-demo)

Template Studio is the PDF template feature under "Templates" in the sidebar.
It is built on pdfme, but users must never see the name "pdfme" (code names may keep it).

## Structure

```
PdfmeDemoSection.tsx   Owns the open document, saving and the unsaved-changes logic
pages/                 One component per tab: Library (TemplatesPage), My Workspace, Designer, Form/Viewer
api/templateApi.ts     Saving: Spring Boot REST API (VITE_TEMPLATE_API_URL)
api/API_CONTRACT.md    The REST API contract shared with procuratio-backend
gallery/               Built-in example templates shown on the Library tab
components/            Dialogs, buttons, toasts used only here
```

## Rules

- The current tab is controlled by `App.tsx` (props `tab` and `onTabChange`), so the sidebar
  and the page tab bar stay in sync. Do not keep tab state inside this folder.
- Sidebar keys map to tabs in `App.tsx` (`templateTabByKey`). Add both directions when adding a tab.
- All positions and sizes in templates are millimetres.
- Versions: Save writes the template's draft; Publish makes the draft the version in use.
  The Designer opens the draft if there is one, otherwise the version in use (`openVersion`).
- Send back `rowVersion` (template) and `draftRowVersion` (draft) as loaded. A 409 means someone
  else saved first; show the backend's message.
- Every saved template needs a document type. Library items name theirs with `documentTypeCode`.
- If the API contract changes, update `API_CONTRACT.md` and the backend in the same piece of work.

## Unsaved changes (easy to break)

- pdfme reports its own adjustments as template changes, for example when `updateTemplate()` loads
  a template or when it measures a table. These are not user edits.
- `DesignerPage.tsx` therefore only treats a change as an edit after the user clicks or types in the
  designer (`userActive`). Other changes go to `onTemplateSync` and do not mark the document dirty.
- Toolbar actions (JSON, Blank A4, base PDF) mark the document dirty through `onReplaceTemplate`.
- Opening another template asks "Discard unsaved changes?"; leaving Template Studio asks
  "Leave Template Studio?". Keep both working when changing navigation.

## Checking changes

Test in the browser: open each Library template (no red dots), edit (dots appear), switch tabs
(edit kept), Reset (dots clear), and leave with unsaved changes (warning shows).
