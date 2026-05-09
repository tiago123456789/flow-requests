"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation'
import { FormConfig } from "@/types/form-builder"

const FormPage = () => {
  const searchParams = useSearchParams()
  const hash = searchParams.get('hash') as string

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!hash) return;
    try {
      const decoded = atob(hash);
      const parsed: FormConfig = JSON.parse(JSON.parse(decoded));
      setConfig(parsed);

      const initial: Record<string, string> = {};
      for (const input of parsed.inputs) {
        initial[input.name] = "";
      }
      setFormValues(initial);
    } catch(err) {
      console.log(err)
      setError("Invalid form link");
    }
  }, [hash]);

  const handleValueChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFileValues((prev) => ({ ...prev, [name]: file }));
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSubmitting(true);
    try {
      const data: Record<string, string | null> = {};

      for (const input of config.inputs) {
        if (input.type === "file") {
          const file = fileValues[input.name];
          if (file) {
            data[input.name] = await readFileAsBase64(file);
          } else {
            data[input.name] = null;
          }
        } else {
          data[input.name] = formValues[input.name] || "";
        }
      }

      const response = await fetch(config.urlToSendFormData, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setSubmitted(true);
      toast.success("Form submitted successfully!");
    } catch (error: any) {
      toast.error(`Failed to submit form: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto max-w-lg mt-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto max-w-lg mt-20 text-center">
        <p className="text-gray-500">Loading form...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-lg mt-20">
        <ToastContainer />
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-green-800">
            Form submitted!
          </h1>
          <p className="mt-2 text-green-700">
            Your response has been sent successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg mt-10 mb-10">
      <ToastContainer />
      <div className="border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">{config.title}</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {config.inputs.map((input) => (
            <div key={input.name} className="space-y-2">
              <Label htmlFor={`field-${input.name}`}>
                {input.label}
                {input.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              {input.type === "select" && input.options ? (
                <Select
                  value={formValues[input.name]}
                  onValueChange={(value) =>
                    handleValueChange(input.name, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {input.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : input.type === "file" ? (
                <Input
                  id={`field-${input.name}`}
                  type="file"
                  onChange={(e) =>
                    handleFileChange(input.name, e.target.files?.[0] ?? null)
                  }
                  required={input.required}
                />
              ) : (
                <Input
                  id={`field-${input.name}`}
                  type={input.type}
                  placeholder={`Enter ${input.label.toLowerCase()}`}
                  value={formValues[input.name]}
                  onChange={(e) =>
                    handleValueChange(input.name, e.target.value)
                  }
                  required={input.required}
                />
              )}
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : config.buttonText}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FormPage;
