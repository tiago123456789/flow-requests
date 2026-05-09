
type FieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "date"
  | "time"
  | "file"
  | "select";

interface FieldOption {
  label: string;
  value: string;
}

interface FormField {
  id: string;
  label: string;
  name: string;
  type: FieldType;
  required: boolean;
  options: FieldOption[];
}

interface FormConfig {
  title: string;
  buttonText: string;
  urlToSendFormData: string;
  inputs: {
    label: string;
    name: string;
    type: FieldType;
    required?: boolean;
    options?: FieldOption[];
  }[];
}

export type { FormConfig, FormField, FieldOption, FieldType }