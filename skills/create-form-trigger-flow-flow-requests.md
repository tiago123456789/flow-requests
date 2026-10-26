# Skill: Create a Form That Triggers a Flow in Flow Requests

**Name:** create-form-trigger-flow-flow-requests  
**Description:** Guide for coding agents that build or change a Flow Requests frontend form whose submission runs a locally available workflow in the browser. Covers existing form components, config and link format, passing submitted values into workflow request state, and browser-only constraints.

---

## Purpose and scope

Use this skill when the user asks to create a form that starts a Flow Requests workflow, connect form submissions to a flow, or adapt the existing Form Builder for flow execution.

This skill covers **browser-only execution**. The flow runs in the browser using the frontend workflow engine and locally available workflow/plugin data. Do not create a remote webhook integration, ask for a remote automation URL or API key, or put credentials in the form link. If the user requires a flow to run from a different browser or device without local flow data, clarify that this is a remote-execution requirement before proceeding.

Before editing, inspect the current versions of these files and follow their existing patterns:

| File | Responsibility |
|---|---|
| `frontend/components/form-builder-modal.tsx` | Form Builder dialog, field configuration, form-link generation |
| `frontend/types/form-builder.ts` | Form field and serialized config types |
| `frontend/app/forms/page.tsx` | Form-link decoding, form rendering, submission state and feedback |
| `frontend/app/workflows/list/page.tsx` | Workflow actions and where the Form Builder is opened |
| `frontend/hooks/useWorkflow.ts` | Local workflow execution and plugin initialization |
| `frontend/services/workflow/workflow-engine.ts` | Workflow runtime and its `requestData` contract |
| `frontend/repositories/workflow.repository.ts` | Local IndexedDB workflow reads |
| `frontend/repositories/plugins.repository.ts` | Locally installed plugin reads |

The workflow list passes the selected workflow ID and name into `FormBuilderModal`. The builder includes that `workflowId` in the generated config. Trace this selection path if changing how the builder is opened; do not replace the selected workflow with a stale selection or list index.

---

## Existing form behavior

The existing Form Builder and form page provide the UI conventions to preserve:

- A workflow-trigger `FormConfig` contains `title`, `buttonText`, `workflowId`, and `inputs`. The type also retains optional `urlToSendFormData` support for existing form configurations; do not use a remote submission URL for a browser-only workflow-trigger form.
- `FormField` contains `id`, `label`, `name`, `type`, `required`, and `options`.
- Supported field types are `text`, `number`, `email`, `tel`, `password`, `date`, `time`, `file`, and `select`.
- Select options have `{ label, value }` fields.
- The builder validates its title, submit-button label, field labels/names, and select options before producing a link.
- The builder pretty-serializes the config with `JSON.stringify(config, null, 2)`, JSON-stringifies that string again, and Base64-encodes it. It makes the Base64 URL-safe by replacing `+` with `-` and `/` with `_`, then removes trailing `=` padding.
- The final link has the shape `https://flow-requests.vercel.app/forms?hash=<URL-safe-Base64-config>` in production (the builder uses the current origin, so development links use the development origin). The `hash` value is encoded data, not a cryptographic hash or encryption.
- `/forms` reads `hash` from the query string, restores the Base64 alphabet and padding, decodes it with `atob`, parses the JSON twice, validates the config, and renders the configured form. Keep the builder and decoder transformations in sync.
- Non-file field values are kept as strings. File inputs are read as data URLs (Base64) before submission.
- The page has loading, invalid-link, submitting, submitted, and submission-error states; retain accessible labels and the existing UI components/toast conventions.

For example, the JSON payload before encoding can look like this:

```json
{
  "title": "Flow requests form",
  "buttonText": "Confirm data",
  "workflowId": "<selected-local-workflow-id>",
  "inputs": [
    {
      "label": "Email",
      "name": "email",
      "type": "email",
      "required": true
    }
  ]
}
```

The builder encodes this config into the `hash` query value and creates a link such as `https://flow-requests.vercel.app/forms?hash=<URL-safe-Base64-config>`. Opening that link lets `/forms` decode the query value and construct the form from the decoded config. Do not hand-write or alter the encoded value; generate it from the config using the same serialization and URL-safe Base64 steps as the builder.

When changing the workflow reference, update the typed config deliberately, update both link generation and decoding, and keep old links working if backward compatibility is required. Avoid storing the full workflow JSON in the URL unless the user explicitly needs a self-contained flow payload; URLs can be copied, logged, and have size limits.

Validate that field names are unique and non-empty. The custom Select control does not get native HTML `required` validation automatically, so validate required select values explicitly before running the flow. Keep file values compatible with the current data-URL conversion and avoid silently changing payload types.

---

## Local workflow execution contract

`WorkflowEngine.process(workflowToProcess, requestData)` stores `requestData` as `this.state.request`. The remote runner passes an object shaped like `{ headers, body, query }`; follow that shape for the browser form so flow expressions can access submitted values consistently.

Pass the submitted values as:

```ts
{
  headers: {},
  body: submittedValues,
  query: {},
}
```

Workflow nodes can then use expressions such as:

```text
{{this.state.request.body.email}}
{{this.state.request.body.description}}
```

Do not pass `{}` as the request data for a form-triggered run: the workflow will not see the form values.

Use the existing frontend runtime rather than implementing a second workflow interpreter:

1. Resolve the selected workflow from the local workflow repository by its ID.
2. Parse its persisted `data` when it is stored as JSON text, and verify the workflow exists and has executable `nodes` and `envData`.
3. Load locally installed plugins using the existing plugin repository, `PackageUtil`, and `CustomNodeManager` pattern in `useWorkflow.ts`.
4. Run the engine with `{ nodes: workflow.data.nodes, envData: workflow.data.envData }` and the request-data object above.
5. Surface execution failures and only show the form's completed state after the run finishes according to the existing runtime's outcome. Do not report success just because form values passed validation.

Prefer extending or extracting the existing workflow-run path to accept optional request data over duplicating initialization. Check all `runWorkflow` call sites before changing its signature; ordinary manual test runs should keep working with empty request data. If the form page needs logs or an execution result, return that from a shared runner or expose it through an appropriate UI rather than relying on state owned by an unrelated page.

The engine records each step's output in `getState().steps`. It catches many node-level execution errors and records them in step output, so inspect the established success/error conventions before deciding when to show a successful form-submission state.

---

## Integration flow

When implementing the feature, trace the complete path instead of only changing the visible form:

1. **Choose the workflow.** Pass the selected local workflow (or a stable local workflow ID) into `FormBuilderModal` from the workflow list action. Avoid relying on a stale selection or index; use the workflow ID already used by the repository.
2. **Configure the form.** Keep title, button text, field types, required flags, and select options in the form config. Include only the local workflow reference needed by the form page.
3. **Generate the link.** Encode the updated config consistently with the existing hash scheme. Validate the data before creating the link and handle encoding/parsing failures.
4. **Load and render.** Decode and validate the config on `/forms`; show a clear invalid-link or missing-workflow state if it cannot be resolved. Initialize controlled values for every configured field.
5. **Submit once.** Prevent the browser's default form submission, validate required values (including custom selects), disable duplicate submissions, then pass the exact collected values into the workflow request body.
6. **Run and report.** Execute with the locally saved workflow and installed plugins; retain loading/submitting feedback, show a completion state after execution, and give the user an actionable failure message if the flow cannot be found or run.

Only make a form link portable across browsers if the workflow and its runtime dependencies are also made available there. In the browser-only design, a link containing a local workflow ID requires that workflow to exist in the responding browser's local Flow Requests storage. Do not imply that a link alone publishes or remotely hosts a workflow.

---

## Data and security rules

- Treat the form hash as encoded data, not encrypted or access-controlled data. Do not put secrets, API keys, or private workflow environment values in it.
- Keep workflow environment values in the workflow's existing `envData` and let the local runtime provide them; do not copy them into public form config or submitted values.
- A browser-only workflow runs with the current browser's installed plugins and local workflow context. Do not silently fall back to a remote endpoint.
- Preserve the request object shape `{ headers, body, query }` and pass user-entered values only under `body`.
- Avoid logging passwords, file contents, or other sensitive form values. Preserve only the existing file data-URL behavior required by the workflow.
- Validate decoded configuration at runtime; URL parameters are user-controlled and may be malformed or stale.

---

## Verification checklist

- [ ] The Form Builder receives the intended workflow ID and serializes it into the config.
- [ ] Existing form fields and select options render and retain their values.
- [ ] Invalid or stale links, missing local workflows, and missing local plugins have clear error states.
- [ ] Required inputs and required select values are checked before execution.
- [ ] Submitted values are available to steps through `this.state.request.body.<fieldName>`.
- [ ] File fields preserve the expected Base64 data-URL representation.
- [ ] The submit control prevents duplicate runs and reports completion or failure accurately.
- [ ] Manual workflow testing still works after any changes to the shared runner.
- [ ] No API key, secret, or remote webhook URL is added to this browser-only flow.
- [ ] Run the relevant frontend checks from `frontend/` (at minimum `npm run build`; run lint if supported by the current Next.js setup).
