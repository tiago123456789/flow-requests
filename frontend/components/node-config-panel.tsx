"use client";

import { useState, useEffect } from "react";
import { Trash, PlusCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NativeNodeType from "@/types/native-node-type.type";
import VariableInput from "./variable-input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NodeConfigPanelProps {
  node: { [key: string]: any };
  onChange: (id: string, data: { [key: string]: any }) => void;
  onClose: () => void;
  isOpen?: boolean;
  optionsMenu: Array<string>;
}

export default function NodeConfigPanel({
  node,
  onChange,
  onClose,
  isOpen = true,
  optionsMenu = [],
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState({ ...node.data });
  const [headers, setHeaders] = useState<Array<{ [key: string]: any }>>([{}]);
  const [body, setBody] = useState<Array<{ [key: string]: any }>>([{}]);
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});

  const [condition, setCondition] = useState(
    node.data.condition || {
      left: "",
      operator: "",
      right: "",
    },
  );

  const mapNativeNode: { [key: string]: boolean } = {
    [NativeNodeType.start]: true,
    [NativeNodeType.api]: true,
    [NativeNodeType.condition]: true,
    [NativeNodeType.code]: true,
    [NativeNodeType.loop]: true,
  };

  const addBody = () => {
    const registers = [...body];
    registers.push({ key: "", type: "", value: "" });
    setBody([...registers]);
  };

  const removeBody = (index: number) => {
    if (body.length == 1) return;
    const registers = [...body];
    registers.splice(index, 1);
    setBody([...registers]);
  };

  const addHeader = () => {
    const registers = [...headers];
    registers.push({ key: "", type: "", value: "" });
    setHeaders([...registers]);
  };

  const removeHeader = (index: number) => {
    if (headers.length == 1) return;
    const registers = [...headers];
    registers.splice(index, 1);
    setHeaders([...registers]);
  };

  const onChangeBody = (index: number, key: string, value: any) => {
    body[index][key] = value;
    setBody([...body]);
  };

  const onChangeHeader = (index: number, key: string, value: any) => {
    headers[index][key] = value;
    setHeaders([...headers]);
  };

  useEffect(() => {
    setConfig(node.data);
    setFileValues({});
    if (node.data && node.data.headers && node.data.headers.length > 0)
      setHeaders(node.data.headers);
    if (node.data && node.data.body && node.data.body.length > 0)
      setBody(node.data.body);
  }, [node]);

  const handleChange = (field: string, value: any) => {
    const newConfig = {
      ...config,
      headers: [...headers],
      body: [...body],
      [field]: value,
    };
    setConfig(newConfig);
    onChange(node.id, newConfig);
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleCustomNodeSave = async () => {
    const newConfig = { ...config };
    await Promise.all(
      Object.entries(fileValues).map(async ([propertyName, file]) => {
        if (file) {
          newConfig[propertyName] = await readFileAsDataUrl(file);
        }
      }),
    );

    onChange(node.id, newConfig);
    setConfig(null);
    setFileValues({});
    onClose();
  };

  const renderStartConfig = () => <></>;

  const renderApiConfig = () => (
    <>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>CORS Bypass</AlertTitle>
        <AlertDescription>
          To bypass the CORS problem, use the script from{" "}
          <a
            href="https://gist.github.com/tiago123456789/1818973dd1fa794206d5ba0a835fa5c0"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://gist.github.com/tiago123456789/1818973dd1fa794206d5ba0a835fa5c0
          </a>
          , create an account on{" "}
          <a
            href="https://www.val.town/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://www.val.town/
          </a>
          , create a Val, select HTTP and copy the script from the Gist link.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label htmlFor="endpoint">API Endpoint</Label>
        <VariableInput
          options={optionsMenu}
          value={config.endpoint || ""}
          placeholder="https://api.example.com/data"
          onChange={(value) => handleChange("endpoint", value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="method">HTTP Method</Label>
        <Select
          value={config.method || "GET"}
          onValueChange={(value) => handleChange("method", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="headers">Headers (JSON)</Label>
        {headers.map((item, index) => {
          return (
            <div key={index} className="grid grid-cols-2 gap-1">
              <div>
                <Label>Key</Label>
                <VariableInput
                  options={optionsMenu}
                  value={item.key || ""}
                  placeholder="api-key"
                  onChange={(value) => onChangeHeader(index, "key", value)}
                />
              </div>
              <div>
                <Label>Value</Label>
                <VariableInput
                  options={optionsMenu}
                  value={item.value}
                  placeholder="value here"
                  onChange={(value) => onChangeHeader(index, "value", value)}
                />
              </div>
              <div className="grid grid-cols-2">
                <div className="py-3">
                  <Button onClick={() => removeHeader(index)}>
                    <Trash />
                  </Button>
                </div>
                <div className="py-3" style={{ marginLeft: "-50px" }}>
                  <Button onClick={() => addHeader()}>
                    <PlusCircle />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Request Body (JSON)</Label>
        {body.map((item, index) => {
          return (
            <div key={index} className="grid grid-cols-2 gap-1">
              <div>
                <Label>Key</Label>
                <VariableInput
                  options={optionsMenu}
                  value={item.key}
                  placeholder="key here"
                  onChange={(value) => onChangeBody(index, "key", value)}
                />
              </div>
              <div>
                <Label>Value</Label>
                <VariableInput
                  options={optionsMenu}
                  value={item.value}
                  placeholder="value here"
                  onChange={(value) => onChangeBody(index, "value", value)}
                />
              </div>
              <div className="grid grid-cols-2">
                <div className="py-3">
                  <Button onClick={() => removeBody(index)}>
                    <Trash />
                  </Button>
                </div>
                <div className="py-3" style={{ marginLeft: "-50px" }}>
                  <Button
                    onClick={() => {
                      addBody();
                    }}
                  >
                    <PlusCircle />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <Button
          onClick={() => {
            handleChange("headers", headers);
            handleChange("body", body);
            setBody([{}]);
            setHeaders([{}]);
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </>
  );

  const renderConditionConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="condition">Condition Expression</Label>

        <div key={1} className="grid grid-cols-3">
          <div className="py-6">
            <Label></Label>
            <VariableInput
              options={optionsMenu}
              value={condition.left}
              placeholder="value here"
              onChange={(value) => setCondition({ ...condition, left: value })}
            />
          </div>

          <div>
            <div className="px-2 space-y-2">
              <Label htmlFor="method">Condição</Label>
              <Select
                value={condition.operator}
                onValueChange={(value) =>
                  setCondition({ ...condition, operator: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="==">Igual</SelectItem>
                  <SelectItem value=">">Maior que</SelectItem>
                  <SelectItem value="<">Menor que</SelectItem>
                  <SelectItem value="!=">Diferente</SelectItem>
                  <SelectItem value=">=">Maior que ou igual</SelectItem>
                  <SelectItem value="<=">Menor que ou igual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="px-1 py-6">
            <Label></Label>
            <VariableInput
              options={optionsMenu}
              value={condition.right}
              placeholder="value here"
              onChange={(value) => setCondition({ ...condition, right: value })}
            />
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => {
                handleChange("condition", condition);
                setCondition({});
                setConfig(null);
                onClose();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  const renderCodeConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="code">JavaScript Code</Label>
        <Textarea
          onChange={(e) => handleChange("code", e.target.value)}
          rows={15}
          cols={55}
        >
          {config.code}
        </Textarea>
      </div>
      <div className="space-y-2">
        <Button
          onClick={() => {
            handleChange("condition", condition);
            setCondition({});
            setConfig(null);
            onClose();
          }}
        >
          Save
        </Button>
      </div>
    </>
  );

  const renderLoopNode = () => {
    return (
      <>
        <div key={config.name} className="space-y-2">
          <Label htmlFor={config.name}>Source of data</Label>
          <VariableInput
            options={optionsMenu}
            value={config.source}
            placeholder="value here"
            onChange={(value) => handleChange("source", value)}
          />
        </div>
        <div className="space-y-2">
          <Button
            onClick={() => {
              setConfig(null);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </>
    );
  };

  const renderCustomNodeConfig = () => {
    return (
      <>
        <div className="w-full space-y-2">
          {node.data.properties.map((property: any) => {
            const requiredOrOptional = property.required
              ? "(Required)"
              : "(Optional)";
            const hasConditionShow = property?.conditionShow?.length > 0;
            if (hasConditionShow) {
              const resultVerifications = property.conditionShow.filter(
                (condition: any) => {
                  return config[condition.keyCheck] == condition.valueExpected;
                },
              );

              if (resultVerifications.length != property.conditionShow.length) {
                return null;
              }
            }

            const propertyLabel = (
              <div className="flex items-center gap-2">
                <Label htmlFor={property.name}>
                  {property.label} {requiredOrOptional}
                </Label>
                {typeof property.info === "string" && property.info.trim() && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Information about ${property.label}`}
                        className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{property.info}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            );

            if (property.type == "select") {
              return (
                <div key={property.name} className="space-y-2">
                  {propertyLabel}
                  <Select
                    value={
                      config[property.name] || node.data[property.name] || ""
                    }
                    onValueChange={(value) =>
                      handleChange(property.name, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {property.options.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (property.type == "textarea") {
              return (
                <div key={property.name} className="space-y-2">
                  {propertyLabel}
                  <textarea
                    rows={5}
                    cols={55}
                    value={
                      config[property.name] || node.data[property.name] || ""
                    }
                    onChange={(e) =>
                      handleChange(property.name, e.target.value)
                    }
                  >
                    {config[property.name]}
                  </textarea>
                </div>
              );
            }

            if (property.type == "text") {
              return (
                <div key={property.name} className="space-y-2">
                  {propertyLabel}
                  <VariableInput
                    placeholder="Type value here"
                    options={optionsMenu}
                    value={config[property.name] || node.data[property.name]}
                    onChange={(value) => handleChange(property.name, value)}
                  />
                </div>
              );
            }

            if (property.type == "number") {
              return (
                <div key={property.name} className="space-y-2">
                  {propertyLabel}
                  <Input
                    type="number"
                    id={property.name}
                    value={
                      config[property.name] || node.data[property.name] || ""
                    }
                    onChange={(e) =>
                      handleChange(property.name, e.target.value)
                    }
                  />
                </div>
              );
            }

            if (property.type?.toLowerCase() === "file") {
              return (
                <div key={property.name} className="space-y-2">
                  {propertyLabel}
                  <Input
                    type="file"
                    id={property.name}
                    onChange={(e) =>
                      setFileValues((previousValues) => ({
                        ...previousValues,
                        [property.name]: e.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </div>
              );
            }
          })}
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleCustomNodeSave}
          >
            Save
          </Button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-4xl max-h-[80vh] overflow-y-scroll ">
        <DialogHeader>
          <DialogTitle>
            Configure {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </DialogTitle>
        </DialogHeader>
        <div className="w-full mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Node Type</Label>
            <Input
              id="label"
              value={config.label || ""}
              disabled={true}
              onChange={(e) => handleChange("label", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Step Name</Label>
            <Input
              id="name"
              value={config.name || ""}
              onChange={(e) =>
                handleChange(
                  "name",
                  e.target.value.replace(/ /g, "_").toLowerCase(),
                )
              }
              placeholder="Enter a descriptive name for this step"
            />
          </div>
          {node.type === NativeNodeType.start && renderStartConfig()}
          {node.type === NativeNodeType.api && renderApiConfig()}
          {node.type === NativeNodeType.condition && renderConditionConfig()}
          {/* {node.type === NativeNodeType.code && renderCodeConfig()} */}
          {node.type === NativeNodeType.loop && renderLoopNode()}
          {!mapNativeNode[node.type] && renderCustomNodeConfig()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
