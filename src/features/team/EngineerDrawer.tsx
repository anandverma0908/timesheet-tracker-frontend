import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  Skeleton,
  Drawer,
  IconButton,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { fetchTickets } from "@/services/api";
import {
  initials,
  formatNumber,
  formatDate,
  formatHours,
} from "@/utils/formatters";
import type { SummaryByUser } from "@/types";
import { CLIENT_COLORS } from "@/config/themes";

/* ─────────────────────────────────────────────
   Engineer detail drawer
   ───────────────────────────────────────────── */
interface EngineerDrawerProps {
  engineer: SummaryByUser | null;
  dateFrom: string | null;
  dateTo: string | null;
  onClose: () => void;
}

function getColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return CLIENT_COLORS[Math.abs(h) % CLIENT_COLORS.length];
}

const STATUS_COLOR: Record<
  string,
  "success" | "warning" | "default" | "error"
> = {
  Done: "success",
  "In Progress": "warning",
  Open: "default",
  Closed: "success",
};
const TYPE_COLOR: Record<string, "info" | "error" | "warning" | "default"> = {
  Feature: "info",
  Bug: "error",
  Meeting: "warning",
  Task: "default",
};

function EngineerDrawer({
  engineer,
  dateFrom,
  dateTo,
  onClose,
}: EngineerDrawerProps) {
  const open = !!engineer;

  console.log({engineer})
  /* Fetch this engineer's tickets when drawer opens */
  const { data, isLoading } = useQuery({
    queryKey: ["engineer-tickets", engineer?.user, dateFrom, dateTo],
    queryFn: () => fetchTickets({ user: engineer!.user, dateFrom, dateTo }),
    enabled: open,
  });

  const tickets = data?.tickets ?? [];
  const totalHours = tickets.reduce((s, t) => s + t.hours_spent, 0);
  const color = engineer ? getColor(engineer.user) : "#4F7EFF";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 900 },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            fontSize: 15,
            fontWeight: 800,
            background: `linear-gradient(135deg,${color},${color}aa)`,
          }}
        >
          {engineer ? initials(engineer.user) : ""}
        </Avatar>
        <Box flex={1}>
          <Typography fontWeight={700} fontSize={16}>
            {engineer?.user}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {engineer?.clients.join(" · ") || "—"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>

      {/* Summary stats */}
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        {[
          [
            formatNumber(Math.round(totalHours * 4) / 4) + "h",
            "Total hours",
            color,
          ],
          [String(tickets.length), "Tickets", "text.primary"],
          [
            String(new Set(tickets.map((t) => t.updated.slice(0, 10))).size),
            "Active days",
            "text.primary",
          ],
          [
            String(new Set(tickets.map((t) => t.client)).size),
            "Clients",
            "text.primary",
          ],
        ].map(([val, lbl, clr]) => (
          <Box key={lbl} sx={{ flex: 1, p: 2, textAlign: "center" }}>
            <Typography
              fontWeight={800}
              fontSize={22}
              letterSpacing="-0.04em"
              sx={{ color: clr, fontFamily: "monospace" }}
            >
              {val}
            </Typography>
            <Typography
              fontSize={10}
              color="text.disabled"
              fontWeight={700}
              sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              {lbl}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* Table */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {isLoading ? (
          <Stack spacing={1} sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={40} />
            ))}
          </Stack>
        ) : tickets.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography fontSize={32} sx={{ opacity: 0.3 }}>
              📭
            </Typography>
            <Typography fontWeight={700} mt={1}>
              No tickets found
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              for this date range
            </Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}
                >
                  Key
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Summary
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  POD
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Client
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Type
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Hours
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((t) => (
                <TableRow
                  key={t.key}
                  sx={{ "&:hover": { bgcolor: "action.hover" } }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Chip
                      label={t.key}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography fontSize={12} noWrap title={t.summary}>
                      {t.summary}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography
                      fontSize={11}
                      color="text.secondary"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {formatDate(t.updated, "MMM d")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.pod}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary" noWrap>
                      {t.client}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.issue_type}
                      size="small"
                      color={TYPE_COLOR[t.issue_type] ?? "default"}
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.status}
                      size="small"
                      color={STATUS_COLOR[t.status] ?? "default"}
                      variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      fontSize={12}
                      fontWeight={700}
                      color="success.main"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {formatHours(t.hours_spent)}
                    </Typography>
                  </TableCell>
                  <TableCell padding="none">
                    {t.url && t.url !== "#" && (
                      <IconButton
                        size="small"
                        onClick={() => window.open(t.url, "_blank")}
                      >
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography fontSize={11} color="text.secondary">
          Showing {tickets.length} tickets for <strong>{engineer?.user}</strong>
          . Read-only view — to log manual entries use the AI Time Entry screen.
        </Typography>
      </Box>
    </Drawer>
  );
}

export default EngineerDrawer;
