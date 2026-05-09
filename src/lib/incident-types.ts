export type IncidentType = typeof INCIDENT_TYPES[number]["value"];

export const INCIDENT_TYPES = [
  // ─── Cards ───────────────────────────────────────────────────────────────
  { group: "Kart Kararları", value: "wrong_red_card",       label: "Hatalı Kırmızı Kart",         severity: 0.8 },
  { group: "Kart Kararları", value: "missed_red_card",      label: "Verilmesi Gereken Kırmızı Kart",severity: 0.8 },
  { group: "Kart Kararları", value: "wrong_yellow_card",    label: "Hatalı Sarı Kart",             severity: 0.4 },
  { group: "Kart Kararları", value: "missed_yellow_card",   label: "Verilmesi Gereken Sarı Kart",  severity: 0.3 },
  { group: "Kart Kararları", value: "double_yellow_missed", label: "İkinci Sarı Kart Kaçırıldı",   severity: 0.6 },
  // ─── Goals ───────────────────────────────────────────────────────────────
  { group: "Gol Kararları",  value: "disallowed_goal_offside",  label: "Ofsayt — Gol İptali",             severity: 1.0 },
  { group: "Gol Kararları",  value: "disallowed_goal_handball", label: "El — Gol İptali",                  severity: 1.0 },
  { group: "Gol Kararları",  value: "disallowed_goal_foul",     label: "Faul — Gol İptali",                severity: 0.9 },
  { group: "Gol Kararları",  value: "allowed_goal_offside",     label: "Ofsayta Rağmen Gol Verildi",       severity: 1.0 },
  { group: "Gol Kararları",  value: "allowed_goal_handball",    label: "El Var Ama Gol Verildi",           severity: 1.0 },
  // ─── Penalty ─────────────────────────────────────────────────────────────
  { group: "Penaltı Kararları", value: "wrong_penalty_given", label: "Olmayan Penaltı Verildi",    severity: 1.0 },
  { group: "Penaltı Kararları", value: "missed_penalty",      label: "Verilmesi Gereken Penaltı",  severity: 1.0 },
  // ─── Foul ────────────────────────────────────────────────────────────────
  { group: "Faul Kararları", value: "wrong_foul",               label: "Hatalı Faul Kararı",             severity: 0.4 },
  { group: "Faul Kararları", value: "missed_foul",              label: "Faul Kaçırıldı",                  severity: 0.4 },
  { group: "Faul Kararları", value: "simulation_unpunished",    label: "Cezasız Kalan Simülasyon",        severity: 0.3 },
  { group: "Faul Kararları", value: "simulation_wrongly_punished", label: "Hatalı Simülasyon Cezası",    severity: 0.4 },
  // ─── Offside ─────────────────────────────────────────────────────────────
  { group: "Ofsayt Kararları", value: "wrong_offside",   label: "Hatalı Ofsayt Kararı",   severity: 0.7 },
  { group: "Ofsayt Kararları", value: "missed_offside",  label: "Kaçırılan Ofsayt",        severity: 0.7 },
  // ─── Conduct ─────────────────────────────────────────────────────────────
  { group: "Davranış Kararları", value: "wrong_conduct_call",  label: "Hatalı Davranış Cezası", severity: 0.5 },
  { group: "Davranış Kararları", value: "missed_conduct_call", label: "Cezasız Kalan Davranış",  severity: 0.5 },
] as const;

export const TYPE_MAP = Object.fromEntries(INCIDENT_TYPES.map((t) => [t.value, t]));

export const SEVERITY_FROM_TYPE = Object.fromEntries(
  INCIDENT_TYPES.map((t) => [t.value, t.severity])
);

export const TYPE_GROUPS = INCIDENT_TYPES.reduce<Record<string, typeof INCIDENT_TYPES[number][]>>(
  (acc, t) => {
    if (!acc[t.group]) acc[t.group] = [];
    acc[t.group].push(t);
    return acc;
  },
  {}
);
