import type { ManualEntry } from "./types";
import { formatNumber } from "@/utils/formatters";
import styles from "./ManualEntryPage.module.css";

interface StepConfirmedProps {
  entries: ManualEntry[];
  totalHours: number;
  onAddMore: () => void;
  onExport: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Meeting: styles.typeMeeting ?? "badge-purple",
  Planning: styles.typePlanning ?? "badge-blue",
  Review: styles.typeReview ?? "badge-amber",
  "1:1": styles.type11 ?? "badge-green",
  Interview: styles.typeInterview ?? "badge-cyan",
  Reporting: styles.typeReporting ?? "badge-gray",
  Training: styles.typeTraining ?? "badge-gray",
  Other: styles.typeOther ?? "badge-gray",
};

export default function StepConfirmed({
  entries,
  totalHours,
  onAddMore,
  onExport,
}: StepConfirmedProps) {
  const days = [...new Set(entries.map((e) => e.date))];

  return (
    <div className={styles.confirmedStep}>
      {/* Success card */}
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.successTitle}>
          {entries.length} entries logged
        </div>
        <div className={styles.successDesc}>
          {formatNumber(Math.round(totalHours * 4) / 4)} hours saved for{" "}
          <strong>{entries[0]?.person}</strong> across {days.length} day
          {days.length !== 1 ? "s" : ""}.
        </div>
        <div className={styles.successActions}>
          <button className="btn btn-ghost" onClick={onAddMore}>
            + Add more entries
          </button>
        </div>
      </div>

      {/* Summary table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>Logged entries</span>
          <span className={styles.totalHours}>
            {formatNumber(Math.round(totalHours * 4) / 4)}h · {entries.length}{" "}
            activities
          </span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Hours</th>
                <th>POD</th>
                <th>Client</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className={styles.dateCell}>{e.date}</td>
                  <td className={styles.activityCell}>{e.activity}</td>
                  <td>
                    <span className={styles.hoursCell}>{e.hours}h</span>
                  </td>
                  <td>
                    {e.pod ? (
                      <span className="badge badge-blue">{e.pod}</span>
                    ) : (
                      <span className={styles.cellEmpty}>—</span>
                    )}
                  </td>
                  <td>
                    {e.client ? (
                      <span className="badge badge-amber">{e.client}</span>
                    ) : (
                      <span className={styles.cellEmpty}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-purple">{e.type}</span>
                  </td>
                  <td className={styles.notesCell}>
                    {e.notes || <span className={styles.cellEmpty}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
