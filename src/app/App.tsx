import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/guards/RequireAuth";
import RequireRole from "@/components/guards/RequireRole";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import TicketsPage from "@/features/tickets/TicketsPage";
import TeamPage from "@/features/team/TeamPage";
import ExportPage from "@/features/export/ExportPage";
import SettingsPage from "@/features/settings/SettingsPage";
import ManualEntryPage from "@/features/manual-entry/ManualEntryPage";

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* All app routes — require login */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route element={<RequireRole />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/manual-entry" element={<ManualEntryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
