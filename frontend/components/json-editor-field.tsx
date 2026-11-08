"use client";

import { useCallback, useMemo } from "react";
import { JsonEditor } from "json-edit-react";

interface JsonEditorFieldProps {
  /** JSON string stored in node config */
  value: string;
  /** Called with an updated JSON string whenever the data changes */
  onChange: (value: string) => void;
}

/**
 * Bridges the string-based node config storage with json-edit-react's
 * object-based API.
 *
 * - Parses `value` from JSON string → object before passing to JsonEditor.
 * - Serialises the object back to a JSON string inside `setData` before
 *   calling `onChange`, so the rest of the config panel is unaffected.
 * - Falls back to an empty object when `value` is absent or unparseable.
 */
export default function JsonEditorField({
  value,
  onChange,
}: JsonEditorFieldProps) {
  const parsed = useMemo(() => {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }, [value]);

  const handleSetData = useCallback(
    (data: unknown) => {
      try {
        onChange(JSON.stringify(data, null, 2));
      } catch {
        // If serialisation somehow fails, leave the config unchanged.
      }
    },
    [onChange],
  );

  return (
    <div className="border rounded-md overflow-auto max-h-[400px]">
      <JsonEditor
        data={parsed}
        setData={handleSetData}
        rootName="data"
        indent={2}
        collapse={2}
      />
    </div>
  );
}
