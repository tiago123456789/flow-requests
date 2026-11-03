const FORM_FIELD_TYPES = new Set([
  "text",
  "number",
  "email",
  "password",
  "date",
  "time",
  "file",
  "select",
]);

export type FormFlowData = {
  title: string;
  buttonText: string;
  inputs: Array<Record<string, any>>;
};

export function validateFormFlowData(
  value: unknown,
): { data?: FormFlowData; error?: string } {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return { error: "data must contain a title, buttonText, and inputs" };
  }

  const data = value as Record<string, any>;
  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    typeof data.buttonText !== "string" ||
    !data.buttonText.trim() ||
    !Array.isArray(data.inputs) ||
    data.inputs.length === 0
  ) {
    return { error: "data must contain a title, buttonText, and inputs" };
  }

  const fieldNames = new Set<string>();
  for (const field of data.inputs) {
    if (
      !field ||
      typeof field !== "object" ||
      typeof field.name !== "string" ||
      !field.name.trim() ||
      typeof field.label !== "string" ||
      !field.label.trim() ||
      !FORM_FIELD_TYPES.has(field.type) ||
      fieldNames.has(field.name)
    ) {
      return {
        error: "data.inputs contains an invalid or duplicate field",
      };
    }
    fieldNames.add(field.name);

    if (
      field.type === "select" &&
      (!Array.isArray(field.options) ||
        field.options.length === 0 ||
        field.options.some((option: any) =>
          !option || typeof option.label !== "string" ||
          typeof option.value !== "string" || !option.value
        ))
    ) {
      return { error: `select field "${field.name}" has invalid options` };
    }
  }

  return {
    data: {
      title: data.title.trim(),
      buttonText: data.buttonText.trim(),
      inputs: data.inputs,
    },
  };
}
