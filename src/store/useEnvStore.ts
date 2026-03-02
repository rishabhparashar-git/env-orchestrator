"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";

// Secret Key for local storage encryption
// Since this is a client-side app, we use a static key for obscurity.
// For true security, this would require user input (e.g. Master Password)
const SECRET_KEY = "env-orchestrator-static-secret-key-v1";

const encryptedStorage = {
  getItem: (name: string): string | null => {
    const encryptedStr = localStorage.getItem(name);
    if (!encryptedStr) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedStr, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error("Failed to decrypt local storage:", e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const encryptedStr = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(name, encryptedStr);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};


export type Project = {
  id: string;
  name: string;
  description: string;
  tags: string;
  technology: string[];
};

export type Override = {
  id: string;
  name: string;
  options: string[];
};

export type SchemaKey = {
  id: string;
  name: string;
  description: string;
  overrides: string[]; // List of Override IDs that apply to this key
};

export type Schema = {
  projectId: string;
  keys: SchemaKey[];
};

export type Preset = {
  id: string;
  projectId: string;
  name: string;
  selections: Record<string, string>;
};

export type EnvStore = {
  projects: Project[];
  presets: Preset[];
  overrides: Override[];
  schemas: Schema[];
  values: Record<string, string>; // Hash: "projectId_keyId_overrideOption1_overrideOption2" = "value"
  privacyMode: "show" | "hide" | "partial";
  theme: "solid-light" | "liquid-glass-dark" | "liquid-glass-light" | "dark";

  addProject: (p: Omit<Project, "id">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addOverride: (o: Omit<Override, "id">) => void;
  updateOverride: (id: string, o: Partial<Override>) => void;
  deleteOverride: (id: string) => void;

  addPreset: (p: Omit<Preset, "id">) => void;
  deletePreset: (id: string) => void;

  updateSchema: (projectId: string, keys: SchemaKey[]) => void;
  setValue: (hash: string, value: string) => void;
  setPrivacyMode: (mode: "show" | "hide" | "partial") => void;
  setTheme: (theme: EnvStore["theme"]) => void;
  
  exportState: () => string;
  importState: (json: string) => void;
};

export const useEnvStore = create<EnvStore>()(
  persist(
    (set, get) => ({
      projects: [],
      presets: [],
      overrides: [
        { id: "1", name: "Stage", options: ["DEV", "TEST", "PRELIVE", "PROD"] },
        { id: "2", name: "Client", options: ["CLIENT-A", "CLIENT-B"] }
      ],
      schemas: [],
      values: {},
      privacyMode: "show",
      theme: "liquid-glass-dark", // Default requested

      addProject: (p) => set((s) => ({ projects: [...s.projects, { ...p, id: uuidv4() }] })),
      updateProject: (id, p) => set((s) => ({
        projects: s.projects.map((proj) => proj.id === id ? { ...proj, ...p } : proj)
      })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter(p => p.id !== id) })),

      addOverride: (o) => set((s) => ({ overrides: [...s.overrides, { ...o, id: uuidv4() }] })),
      updateOverride: (id, o) => set((s) => ({
        overrides: s.overrides.map((ov) => ov.id === id ? { ...ov, ...o } : ov)
      })),
      deleteOverride: (id) => set((s) => ({ overrides: s.overrides.filter(o => o.id !== id) })),

      addPreset: (p) => set((s) => ({ presets: [...s.presets, { ...p, id: uuidv4() }] })),
      deletePreset: (id) => set((s) => ({ presets: s.presets.filter(p => p.id !== id) })),

      updateSchema: (projectId, keys) => set((s) => {
        const otherSchemas = s.schemas.filter(sc => sc.projectId !== projectId);
        return { schemas: [...otherSchemas, { projectId, keys }] };
      }),

      setValue: (hash, value) => set((s) => ({ values: { ...s.values, [hash]: value } })),
      setPrivacyMode: (mode) => set({ privacyMode: mode }),
      setTheme: (theme) => set({ theme }),

      exportState: () => {
        const state = get();
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          projects: state.projects,
          presets: state.presets,
          overrides: state.overrides,
          schemas: state.schemas,
          values: state.values,
          theme: state.theme
        }, null, 2);
      },
      importState: (json) => {
        try {
          const parsed = JSON.parse(json);
          set({
            projects: parsed.projects,
            presets: parsed.presets || [],
            overrides: parsed.overrides,
            schemas: parsed.schemas,
            values: parsed.values,
            theme: parsed.theme || "liquid-glass-dark"
          });
        } catch (e) {
          console.error("Failed to import state:", e);
        }
      }
    }),
    {
      name: "env-orchestrator-storage",
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);
