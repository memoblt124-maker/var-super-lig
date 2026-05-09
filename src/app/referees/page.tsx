// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { VarAnalysisScene } from "@/components/ui/var-analysis-scene";

export const revalidate = 60;

async function getRefereeData() {
  const supabase = await createClient();

  const [{ data: incidents }, { data: verdicts }] = await Promise.all([
    supabase
      .from("incidents")
      .select(`
        id, referee_id,
        referees ( name ),
        teams!team_affected_id ( name )
      `),
    supabase
      .from("panel_verdicts")
      .select("incident_id, verdict"),
  ]);

  type AccEntry = { correct: number; total: number };
  const map: Record<string, { name: string; teams: Record<string, AccEntry> }> = {};

  const verdictsByIncident: Record<string, string[]> = {};
  for (const v of verdicts ?? []) {
    if (!verdictsByIncident[v.incident_id]) verdictsByIncident[v.incident_id] = [];
    verdictsByIncident[v.incident_id].push(v.verdict);
  }

  for (const inc of incidents ?? []) {
    if (!inc.referee_id || !inc.referees) continue;
    const refId   = inc.referee_id;
    const refName = inc.referees.name;
    const teamName = inc.teams?.name ?? "Bilinmiyor";
    const iverdicts = verdictsByIncident[inc.id] ?? [];

    if (!map[refId]) map[refId] = { name: refName, teams: {} };
    if (!map[refId].teams[teamName]) map[refId].teams[teamName] = { correct: 0, total: 0 };

    map[refId].teams[teamName].total += 1;
    const majorityCorrect = iverdicts.length > 0 && iverdicts.filter((v) => v === "correct").length > iverdicts.length / 2;
    if (majorityCorrect) map[refId].teams[teamName].correct += 1;
  }

  const referees = Object.values(map).map((ref) => {
    const teams = Object.entries(ref.teams).map(([teamName, acc]) => ({
      teamName,
      correct: acc.correct,
      total: acc.total,
      pct: acc.total > 0 ? acc.correct / acc.total : null,
    }));
    const totalCalls   = teams.reduce((s, t) => s + t.total, 0);
    const correctCalls = teams.reduce((s, t) => s + t.correct, 0);
    const overallPct   = totalCalls > 0 ? correctCalls / totalCalls : null;

    let isInconsistent = false;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const a = teams[i].pct ?? 0;
        const b = teams[j].pct ?? 0;
        if (Math.abs(a - b) > 0.2) isInconsistent = true;
      }
    }

    return { name: ref.name, teams, totalCalls, correctCalls, overallPct, isInconsistent };
  }).filter((r) => r.totalCalls > 0);

  const sorted = [...referees].sort((a, b) => (b.overallPct ?? 0) - (a.overallPct ?? 0));
  const bestRef  = sorted[0] ?? null;
  const worstRef = sorted[sorted.length - 1] ?? null;

  return { referees, bestRef, worstRef };
}

export default async function RefereesPage() {
  const { referees, bestRef, worstRef } = await getRefereeData();

  const inconsistentRefs = referees.filter((r) => r.isInconsistent);

  return (
    <div className="space-y-6">
      {/* VAR Analysis 3D Scene */}
      <div
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          marginTop: "-2rem",
          width: "100vw",
          padding: "0 1rem",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <VarAnalysisScene />
        </div>
      </div>

      <div className="mt-8">
        <h1 className="text-2xl font-bold text-white">Hakem Tutarlılık Matrisi</h1>
        <p className="mt-1 text-[#6b7280] text-sm max-w-xl">
          Bir hakemin iki takım arasındaki doğruluk farkı %20&apos;yi aşarsa
          <span className="text-red-400 font-semibold"> Tutarsız</span> olarak işaretlenir.
        </p>
      </div>

      {/* Best / Worst */}
      {(bestRef || worstRef) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bestRef && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <p className="text-[11px] font-semibold text-green-400 uppercase tracking-wider mb-3">🏅 En İyi Hakem</p>
              <p className="text-white font-bold text-lg">{bestRef.name}</p>
              <p className="text-green-400 text-3xl font-black mt-1">
                %{Math.round((bestRef.overallPct ?? 0) * 100)}
              </p>
              <p className="text-xs text-[#6b7280] mt-1">{bestRef.correctCalls}/{bestRef.totalCalls} doğru karar</p>
            </div>
          )}
          {worstRef && worstRef.name !== bestRef?.name && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-3">⚠️ En Kötü Hakem</p>
              <p className="text-white font-bold text-lg">{worstRef.name}</p>
              <p className="text-red-400 text-3xl font-black mt-1">
                %{Math.round((worstRef.overallPct ?? 0) * 100)}
              </p>
              <p className="text-xs text-[#6b7280] mt-1">{worstRef.correctCalls}/{worstRef.totalCalls} doğru karar</p>
            </div>
          )}
        </div>
      )}

      {/* Inconsistency alerts */}
      {inconsistentRefs.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider">⚠️ Tutarsız Hakemler</h2>
          <div className="space-y-3">
            {inconsistentRefs.map((ref) => {
              const sorted = [...ref.teams].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
              const high = sorted[0];
              const low  = sorted[sorted.length - 1];
              return (
                <div key={ref.name} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-white">{ref.name}</span>
                  <span className="text-[#252a35]">·</span>
                  <span className="text-[#6b7280]">{high?.teamName}</span>
                  <span className="font-black text-green-400">%{Math.round((high?.pct ?? 0) * 100)}</span>
                  <span className="text-[#6b7280]/40">vs</span>
                  <span className="text-[#6b7280]">{low?.teamName}</span>
                  <span className="font-black text-red-400">%{Math.round((low?.pct ?? 0) * 100)}</span>
                  <span className="ml-auto text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                    {Math.round(Math.abs((high?.pct ?? 0) - (low?.pct ?? 0)) * 100)} puan fark
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-referee cards */}
      {referees.length === 0 ? (
        <div className="rounded-2xl border border-[#252a35] p-12 text-center">
          <p className="text-[#6b7280] text-sm">Henüz hakem verisi yok.</p>
          <p className="text-[#6b7280]/50 text-xs mt-1">
            Olaylara hakem paneli kararı eklendikçe burada görünür.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {referees.sort((a, b) => b.totalCalls - a.totalCalls).map((ref) => (
            <div
              key={ref.name}
              className={`rounded-2xl border p-5 space-y-4 ${
                ref.isInconsistent
                  ? "border-red-500/25 bg-red-500/5"
                  : "border-[#252a35] bg-[#16191f]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#252a35] flex items-center justify-center text-xs font-black text-[#6b7280] shrink-0">
                    {ref.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{ref.name}</h3>
                    <p className="text-[11px] text-[#6b7280]">{ref.totalCalls} karar</p>
                  </div>
                  {ref.isInconsistent && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold">
                      Tutarsız
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${
                    (ref.overallPct ?? 0) >= 0.7 ? "text-green-400" :
                    (ref.overallPct ?? 0) >= 0.5 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {ref.overallPct !== null ? `%${Math.round(ref.overallPct * 100)}` : "—"}
                  </p>
                  <p className="text-[11px] text-[#6b7280]">{ref.correctCalls}/{ref.totalCalls} doğru</p>
                </div>
              </div>

              <div className="space-y-2">
                {ref.teams
                  .filter((t) => t.total > 0)
                  .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
                  .map((t) => {
                    const pct = t.pct ?? 0;
                    return (
                      <div key={t.teamName} className="flex items-center gap-3">
                        <span className="text-xs text-[#6b7280] w-32 truncate">{t.teamName}</span>
                        <div className="flex-1 bg-[#252a35] rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${pct >= 0.7 ? "bg-green-500" : pct >= 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#6b7280] w-10 text-right font-semibold">%{Math.round(pct * 100)}</span>
                        <span className="text-[11px] text-[#6b7280]/50 w-10 text-right">{t.correct}/{t.total}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
