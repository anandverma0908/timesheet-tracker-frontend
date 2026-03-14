import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchFilters } from "@/services/api";
import { QUERY_KEYS } from "@/config/queryKeys";
import { useManualEntry } from "./useManualEntry";
import StepInput from "./StepInput";
import StepParsing from "./StepParsing";
import StepPreview from "./StepPreview";
import StepConfirmed from "./StepConfirmed";
import styles from "./ManualEntryPage.module.css";

const STEP_LABELS = ["Input", "Parsing", "Preview", "Confirmed"];
const STEP_IDS = ["input", "parsing", "preview", "confirmed"] as const;

export default function ManualEntryPage() {
  const { data: filtersData } = useQuery({
    queryKey: QUERY_KEYS.filters(),
    queryFn: fetchFilters,
  });

  const pods = filtersData?.pods ?? [];
  const clients = filtersData?.clients ?? [];

  const {
    step,
    setStep,
    inputText,
    setInputText,
    parsedRows,
    confirmedRows,
    parsingStep,
    parsingSteps,
    warnings,
    selectedRole,
    setSelectedRole,
    personName,
    totalHours,
    parse,
    updateRow,
    deleteRow,
    addRow,
    confirm,
    reset,
  } = useManualEntry(pods, clients);

  const stepIndex = STEP_IDS.indexOf(step);

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={`${styles.header} fade-up`}>
        <div>
          <h1 className={styles.title}>Manual Entry</h1>
          <p className={styles.subtitle}>
            Turn your daily updates into structured reports with AI.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => toast("History coming soon")}
          >
            View History
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => toast.success("Exporting…")}
          >
            ↓ Export Month
          </button>
        </div>
      </div>

      {/* Progress stepper */}
      <div className={`${styles.stepper} fade-up-1`}>
        {STEP_LABELS.map((label, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          return (
            <div key={label} className={styles.stepperItem}>
              <div
                className={`${styles.stepperDot}
                ${isDone ? styles.stepperDotDone : ""}
                ${isActive ? styles.stepperDotActive : ""}
              `}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <div
                className={`${styles.stepperLabel}
                ${isActive ? styles.stepperLabelActive : ""}
                ${isDone ? styles.stepperLabelDone : ""}
              `}
              >
                {label}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`${styles.stepperLine} ${isDone ? styles.stepperLineDone : ""}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="fade-up-2">
        {step === "input" && (
          <StepInput
            inputText={inputText}
            setInputText={setInputText}
            selectedRole={selectedRole}
            setRole={setSelectedRole}
            personName={personName}
            onParse={parse}
          />
        )}

        {step === "parsing" && (
          <StepParsing
            inputText={inputText}
            parsingStep={parsingStep}
            parsingSteps={parsingSteps}
          />
        )}

        {step === "preview" && (
          <StepPreview
            rows={parsedRows}
            totalHours={totalHours}
            warnings={warnings}
            pods={pods}
            clients={clients}
            onUpdate={updateRow}
            onDelete={deleteRow}
            onAddRow={addRow}
            onConfirm={confirm}
            onBack={reset}
          />
        )}

        {step === "confirmed" && (
          <StepConfirmed
            entries={confirmedRows}
            totalHours={totalHours}
            onAddMore={reset}
            onExport={() => toast.success("Exporting timesheet…")}
          />
        )}
      </div>
    </div>
  );
}
