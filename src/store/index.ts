import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterState, ThemeId, ColorMode, JiraConfig } from "@/types";
import { applyTheme, DEFAULT_THEME, DEFAULT_MODE } from "@/config/themes";
import { getPresetDates } from "@/config/queryKeys";

/* ─────────────────────────────────────────────
   FILTER STORE
   ───────────────────────────────────────────── */
const defaultDates = getPresetDates("thisMonth");

interface FilterStore extends FilterState {
  // Single-value filters
  setFilter: (key: keyof FilterState, value: string | null) => void;
  setDateRange: (from: string, to: string) => void;
  resetFilters: () => void;

  // Multi-select — PODs
  pods: string[];
  togglePod: (pod: string) => void;
  clearPods: () => void;

  // Multi-select — Clients
  clients: string[];
  toggleClient: (client: string) => void;
  clearClients: () => void;
}

const defaultFilters: FilterState = {
  dateFrom: defaultDates.from,
  dateTo: defaultDates.to,
  user: null,
  client: null, // kept for backward compat (single)
  pod: null, // kept for backward compat (single)
  project: null,
  search: "",
  issueType: null,
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...defaultFilters,

  // Multi-select arrays
  pods: [],
  clients: [],

  setFilter: (key, value) => set({ [key]: value }),

  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),

  resetFilters: () => set({ ...defaultFilters, pods: [], clients: [] }),

  // Toggle a POD in/out of the selected array
  togglePod: (pod) => {
    const current = get().pods;
    const next = current.includes(pod)
      ? current.filter((p) => p !== pod)
      : [...current, pod];
    set({ pods: next });
  },

  clearPods: () => set({ pods: [] }),

  // Toggle a client in/out of the selected array
  toggleClient: (client) => {
    const current = get().clients;
    const next = current.includes(client)
      ? current.filter((c) => c !== client)
      : [...current, client];
    set({ clients: next });
  },

  clearClients: () => set({ clients: [] }),
}));

/* ─────────────────────────────────────────────
   THEME STORE — persisted to localStorage
   ───────────────────────────────────────────── */
interface ThemeStore {
  themeId: ThemeId;
  colorMode: ColorMode;
  setTheme: (id: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeId: DEFAULT_THEME,
      colorMode: DEFAULT_MODE,
      setTheme: (id) => {
        set({ themeId: id });
        applyTheme(id, get().colorMode);
      },
      setMode: (mode) => {
        set({ colorMode: mode });
        applyTheme(get().themeId, mode);
      },
      toggleMode: () => {
        const next = get().colorMode === "dark" ? "light" : "dark";
        set({ colorMode: next });
        applyTheme(get().themeId, next);
      },
    }),
    { name: "eap-theme" },
  ),
);

/* ─────────────────────────────────────────────
   SETTINGS STORE — persisted to localStorage
   ───────────────────────────────────────────── */
interface SettingsStore {
  jiraConfig: JiraConfig | null;
  isConnected: boolean;
  setJiraConfig: (config: JiraConfig) => void;
  clearConfig: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      jiraConfig: null,
      isConnected: false,
      setJiraConfig: (config) => set({ jiraConfig: config, isConnected: true }),
      clearConfig: () => set({ jiraConfig: null, isConnected: false }),
    }),
    { name: "eap-settings" },
  ),
);
