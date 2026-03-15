import axios from "axios";
import type {
  TicketsResponse,
  SummaryResponse,
  FiltersResponse,
  FilterState,
  ExportConfig,
} from "@/types";
import { getAuthHeader } from "@/features/auth/useAuthStore";

const api = axios.create({
  baseURL: "/api",
  timeout: 30_000,
});

// In your axios instance setup:
api.interceptors.request.use((config) => {
  const headers = getAuthHeader();
  if (headers.Authorization) {
    config.headers.Authorization = headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? "Unknown error";
    console.error("[API Error]", msg);
    return Promise.reject(new Error(msg));
  },
);

/* ── Mock helper ── */
function mock() {
  return (window as any).__EAP_MOCK__ ?? null;
}

/* ── Param builder — supports multi-value pod[] and client[] ── */
function buildParams(
  filters: Partial<FilterState>,
  pods?: string[],
  clients?: string[],
): URLSearchParams {
  const p = new URLSearchParams();

  if (filters.dateFrom) p.append("date_from", filters.dateFrom);
  if (filters.dateTo) p.append("date_to", filters.dateTo);
  if (filters.user) p.append("user", filters.user);
  if (filters.project) p.append("project", filters.project);

  // Multi-select pods — send as repeated ?pod=DPAI&pod=DevOps
  const podList = pods?.length ? pods : filters.pod ? [filters.pod] : [];
  podList.forEach((pod) => p.append("pod", pod));

  // Multi-select clients
  const clientList = clients?.length
    ? clients
    : filters.client
      ? [filters.client]
      : [];
  clientList.forEach((client) => p.append("client", client));

  return p;
}

export interface MultiFilters extends Partial<FilterState> {
  pods?: string[];
  clients?: string[];
}

export async function fetchTickets(
  filters: MultiFilters,
): Promise<TicketsResponse> {
  if (mock()) return mock().fetchTickets(filters);
  const { data } = await api.get<TicketsResponse>("/tickets", {
    params: buildParams(filters, filters.pods, filters.clients),
  });
  return data;
}

export async function fetchSummary(
  filters: MultiFilters,
): Promise<SummaryResponse> {
  if (mock()) return mock().fetchSummary(filters);
  const { data } = await api.get<SummaryResponse>("/summary", {
    params: buildParams(filters, filters.pods, filters.clients),
  });
  return data;
}

export async function fetchFilters(): Promise<FiltersResponse> {
  if (mock()) return mock().fetchFilters();
  const { data } = await api.get<FiltersResponse>("/filters");
  return data;
}

export async function downloadMonthlyReport(
  config: ExportConfig,
): Promise<void> {
  if (mock()) {
    mock().downloadMonthlyReport(config);
    return;
  }
  const p = new URLSearchParams();
  if (config.dateFrom) p.append("date_from", config.dateFrom);
  if (config.dateTo) p.append("date_to", config.dateTo);
  if (config.monthLabel) p.append("month_label", config.monthLabel);
  if (config.pod) p.append("pod", config.pod);
  if (config.client) p.append("client", config.client);
  if (config.project) p.append("project", config.project);
  if (config.engineer) p.append("engineer", config.engineer);
  const { data } = await api.get("/export/monthly", {
    params: p,
    responseType: "blob",
  });
  _download(
    data,
    `timesheet_${config.monthLabel?.replace(" ", "_") ?? "report"}.xlsx`,
  );
}

export async function downloadFYReport(config: ExportConfig): Promise<void> {
  if (mock()) {
    mock().downloadFYReport(config);
    return;
  }
  const p = new URLSearchParams();
  if (config.dateFrom) p.append("date_from", config.dateFrom);
  if (config.dateTo) p.append("date_to", config.dateTo);
  if (config.fyLabel) p.append("fy_label", config.fyLabel);
  if (config.pod) p.append("pod", config.pod);
  if (config.client) p.append("client", config.client);
  if (config.project) p.append("project", config.project);
  if (config.engineer) p.append("engineer", config.engineer);
  const { data } = await api.get("/export/fy", {
    params: p,
    responseType: "blob",
  });
  _download(data, `engineering_FY_${config.fyLabel ?? "2024-2025"}.xlsx`);
}

function _download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
