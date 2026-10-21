"use client";
import { useCallback, useState } from "react";

const STORAGE_BASE_URL_KEY = "remoteFlowBaseUrl";
const STORAGE_API_KEY_KEY = "remoteFlowApiKey";

export function normalizeBaseUrl(url: string): string {
  return (url || "").trim().replace(/\/$/, "");
}

export function getRemoteConfig(): { baseUrl: string; apiKey: string } {
  if (typeof window === "undefined") return { baseUrl: "", apiKey: "" };
  try {
    return {
      baseUrl: localStorage.getItem(STORAGE_BASE_URL_KEY) || "",
      apiKey: localStorage.getItem(STORAGE_API_KEY_KEY) || "",
    };
  } catch {
    return { baseUrl: "", apiKey: "" };
  }
}

export function saveRemoteConfig(baseUrl: string, apiKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_BASE_URL_KEY, normalizeBaseUrl(baseUrl));
  localStorage.setItem(STORAGE_API_KEY_KEY, (apiKey || "").trim());
}

export function clearRemoteConfig() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_BASE_URL_KEY);
  localStorage.removeItem(STORAGE_API_KEY_KEY);
}

const useRemoteConfig = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const load = useCallback(() => {
    const stored = getRemoteConfig();
    setBaseUrl(stored.baseUrl);
    setApiKey(stored.apiKey);
  }, []);

  const save = useCallback((nextBaseUrl: string, nextApiKey: string) => {
    const normalized = normalizeBaseUrl(nextBaseUrl);
    saveRemoteConfig(normalized, nextApiKey);
    setBaseUrl(normalized);
    setApiKey((nextApiKey || "").trim());
  }, []);

  const clear = useCallback(() => {
    clearRemoteConfig();
    setBaseUrl("");
    setApiKey("");
  }, []);

  return { baseUrl, apiKey, setBaseUrl, setApiKey, load, save, clear };
};

export default useRemoteConfig;
