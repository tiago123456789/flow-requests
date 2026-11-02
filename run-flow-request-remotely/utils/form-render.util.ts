import React from "npm:react";
import { renderToStaticMarkup } from "npm:react-dom/server";

const h = React.createElement;

const FORM_SCRIPT = `
  const form = document.getElementById("public-form");
  const status = document.getElementById("form-status");
  const submitButton = form.querySelector('button[type="submit"]');

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    status.textContent = "Submitting...";
    status.dataset.error = "false";

    try {
      const values = {};
      for (const [name, value] of new FormData(form).entries()) {
        values[name] = value instanceof File
          ? (value.name ? await readFileAsDataUrl(value) : null)
          : value;
      }

      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Form submission failed.");
      }

      form.hidden = true;
      status.textContent = "Your response has been submitted successfully.";
      status.dataset.error = "false";
    } catch (error) {
      status.textContent = error instanceof Error
        ? error.message
        : "Form submission failed.";
      status.dataset.error = "true";
      submitButton.disabled = false;
    }
  });
`;

function renderField(field: Record<string, any>) {
  const fieldId = `field-${field.name}`;
  const label = h(
    "label",
    { htmlFor: fieldId, className: "field-label" },
    field.label,
    field.required ? h("span", { className: "required" }, " *") : null,
  );

  let control;
  if (field.type === "select") {
    control = h(
      "select",
      {
        id: fieldId,
        name: field.name,
        required: Boolean(field.required),
        defaultValue: "",
      },
      h("option", { value: "", disabled: true }, "Select an option"),
      ...field.options.map((option: Record<string, string>) =>
        h("option", { key: option.value, value: option.value }, option.label)
      ),
    );
  } else {
    control = h("input", {
      id: fieldId,
      name: field.name,
      type: field.type,
      required: Boolean(field.required),
      ...(field.type === "file" ? {} : { defaultValue: "" }),
    });
  }

  return h("div", { key: field.name, className: "field" }, label, control);
}

export function renderFormHtml(formId: string, data: Record<string, any>) {
  const form = h(
    "form",
    {
      id: "public-form",
      action: `/forms-submit/${encodeURIComponent(formId)}`,
      method: "post",
    },
    ...data.inputs.map(renderField),
    h(
      "button",
      { type: "submit", className: "submit-button" },
      data.buttonText,
    ),
  );

  const markup = renderToStaticMarkup(
    h(
      "html",
      { lang: "en" },
      h(
        "head",
        null,
        h("meta", { charSet: "utf-8" }),
        h("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
        h("title", null, data.title),
        h("style", null, `
          * { box-sizing: border-box; }
          body { margin: 0; padding: 2rem 1rem; color: #111827; font-family: system-ui, sans-serif; background: #f9fafb; }
          main { max-width: 36rem; margin: 2rem auto; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: .75rem; background: white; box-shadow: 0 1px 3px #00000012; }
          h1 { margin: 0 0 1.5rem; font-size: 1.5rem; }
          .field { display: grid; gap: .5rem; margin: 1rem 0; }
          .field-label { font-weight: 600; }
          .required { color: #dc2626; }
          input, select { width: 100%; min-height: 2.75rem; padding: .625rem .75rem; border: 1px solid #d1d5db; border-radius: .375rem; font: inherit; background: white; }
          .submit-button { width: 100%; margin-top: .75rem; padding: .75rem 1rem; border: 0; border-radius: .375rem; color: white; font: inherit; font-weight: 600; background: #111827; cursor: pointer; }
          .submit-button:disabled { opacity: .6; cursor: wait; }
          #form-status { margin-top: 1rem; }
          #form-status[data-error="true"] { color: #b91c1c; }
        `),
      ),
      h(
        "body",
        null,
        h(
          "main",
          null,
          h("h1", null, data.title),
          form,
          h("p", { id: "form-status", role: "status", "aria-live": "polite" }),
        ),
        h("script", { dangerouslySetInnerHTML: { __html: FORM_SCRIPT } }),
      ),
    ),
  );

  return `<!doctype html>${markup}`;
}
