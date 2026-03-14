import type { ParsedEntry, ManualEntryType, AIParseResponse } from "./types";
import { format } from "date-fns";

/* ── Build the system prompt ── */
function buildPrompt(
  text: string,
  pods: string[],
  clients: string[],
  today: string,
): string {
  return `You are a timesheet parser for an engineering team. Parse natural language time entries into structured JSON.

Today is ${today}.

Available PODs in this workspace: ${pods.join(", ")}
Available clients: ${clients.join(", ")}

Activity types allowed: Meeting, Planning, Review, 1:1, Interview, Reporting, Training, Other

Rules:
- Extract every distinct activity as a separate entry
- If a day is mentioned (e.g. "Monday", "Mar 14", "yesterday"), use it as the date in YYYY-MM-DD format
- If no date is mentioned for an entry, use today's date
- Convert durations like "30 mins", "1.5h", "2 hours" to decimal hours (e.g. 0.5, 1.5, 2.0)
- Match POD names case-insensitively from the available PODs list (null if no match)
- Match client names case-insensitively from the available clients list (null if no match)
- Set confidence: "high" if date+hours+activity are all clear, "medium" if one is inferred, "low" if guessed
- For "1:1s with 4 engineers for 30 mins each" → hours = 4 * 0.5 = 2.0, type = "1:1"

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "activity": "Short activity name",
      "hours": 1.5,
      "pod": "DPAI" or null,
      "client": "Colgate" or null,
      "type": "Meeting",
      "notes": "any extra context",
      "confidence": "high"
    }
  ],
  "warnings": ["any ambiguities noted"]
}

Text to parse:
"${text}"`;
}

/* ── Call Anthropic API ── */
export async function parseTimeEntries(
  text: string,
  pods: string[],
  clients: string[],
): Promise<AIParseResponse> {
  const today = format(new Date(), "yyyy-MM-dd");
  const prompt = buildPrompt(text, pods, clients, today);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const entries: ParsedEntry[] = (parsed.entries ?? []).map((e: any) => ({
      date: e.date ?? today,
      activity: e.activity ?? "Unknown activity",
      hours: Number(e.hours) || 0,
      pod: e.pod ?? null,
      client: e.client ?? null,
      type: (e.type as ManualEntryType) ?? "Meeting",
      notes: e.notes ?? "",
      confidence: e.confidence ?? "medium",
    }));

    return {
      entries,
      totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
      warnings: parsed.warnings ?? [],
    };
  } catch {
    throw new Error("Failed to parse AI response. Please try again.");
  }
}

/* ── Fallback local parser (when AI is unavailable / mock mode) ── */
export function localParseEntries(
  text: string,
  pods: string[],
  clients: string[],
  today: string = format(new Date(), "yyyy-MM-dd"),
): AIParseResponse {
  const lines = text
    .split(/[,\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const entries: ParsedEntry[] = [];

  for (const line of lines) {
    const hoursMatch =
      line.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/i) ??
      line.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/i);

    if (!hoursMatch) continue;

    const rawHours = parseFloat(hoursMatch[1]);
    const isMin = /m|min/i.test(
      line.slice(
        hoursMatch.index! + hoursMatch[0].length,
        hoursMatch.index! + hoursMatch[0].length + 5,
      ),
    );
    const hours = isMin ? rawHours / 60 : rawHours;

    const podMatch = pods.find((p) =>
      line.toLowerCase().includes(p.toLowerCase()),
    );
    const clientMatch = clients.find((c) =>
      line.toLowerCase().includes(c.toLowerCase()),
    );

    const typeMap: Record<string, ManualEntryType> = {
      "1:1": "1:1",
      "one on one": "1:1",
      planning: "Planning",
      review: "Review",
      interview: "Interview",
      standup: "Meeting",
      meeting: "Meeting",
      call: "Meeting",
      report: "Reporting",
      training: "Training",
    };
    const type =
      Object.entries(typeMap).find(([k]) =>
        line.toLowerCase().includes(k),
      )?.[1] ?? "Meeting";

    entries.push({
      date: today,
      activity:
        line
          .replace(
            /\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?)/gi,
            "",
          )
          .trim()
          .slice(0, 60) || "Activity",
      hours: Math.round(hours * 4) / 4,
      pod: podMatch ?? null,
      client: clientMatch ?? null,
      type,
      notes: "",
      confidence: podMatch || clientMatch ? "high" : "medium",
    });
  }

  return {
    entries,
    totalHours: entries.reduce((s, e) => s + e.hours, 0),
    warnings:
      entries.length === 0
        ? [
            'Could not parse any entries. Try: "sprint planning 2h DPAI, 1:1s 1h"',
          ]
        : [],
  };
}
