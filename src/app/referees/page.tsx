import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

async function getRefereeData() {
  const supabase = await createClient();

  const [{ data: accuracy }, { data: inconsistent }] = await Promise.all([
    supabase
      .from("referee_accuracy_pct")
      .select("*")
      .eq("season_year", "2025-26")
      .order("referee_name", { ascending: true }),
    supabase
      .from("inconsistent_referees")
      .select("*")
      .eq("season_id", "a1000000-0000-0000-0000-000000000003"),
  ]);

  // Best/Worst referee of the month — min 3 total calls, ranked by accuracy
  type AccuracyRow = { referee_name: string; correct_calls: number; total_calls: number; accuracy_pct: number | null };
  const perRef = Object.values(
    (accuracy ?? []).reduce<Record<string, AccuracyRow>>((acc, row) => {
      const r = row as AccuracyRow;
      if (!acc[r.referee_name]) acc[r.referee_name] = { referee_name: r.referee_name, correct_calls: 0, total_calls: 0, accuracy_pct: null };
      acc[r.referee_name].correct_calls += r.correct_calls;
      acc[r.referee_name].total_calls   += r.total_calls;
      return acc;
    }, {})
  ).map((r) => ({
    ...r,
    accuracy_pct: r.total_calls >= 3 ? r.correct_calls / r.total_calls : null,
  })).filter((r) => r.accuracy_pct !== null);

  const bestRef  = perRef.sort((a, b) => (b.accuracy_pct ?? 0) - (a.accuracy_pct ?? 0))[0] ?? null;
  const worstRef = perRef.sort((a, b) => (a.accuracy_pct ?? 0) - (b.accuracy_pct ?? 0))[0] ?? null;

  return { accuracy: accuracy ?? [], inconsistent: inconsistent ?? [], bestRef, worstRef };
}

export default async function RefereesPage() {
  const { accuracy, inconsistent, bestRef, worstRef } = await getRefereeData();

  // Group accuracy rows by referee
  const byReferee = accuracy.reduce<Record<string, typeof accuracy>>((acc, row) => {
    const key = row.referee_name as string;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const inconsistentRefs = new Set(
    (inconsistent as { referee_name: string }[]).map((r) => r.referee_name)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Hakem Tutarlılık Matrisi</h1>
        <p className="mt-1 text-gray-400 text-sm max-w-xl">
          Bir hakemin iki takım arasındaki doğruluk farkı %20&apos;yi aşarsa
          <span className="text-red-400 font-medium"> Tutarsız</span> olarak işaretlenir.
          Doğruluk sadece hakem paneli kararlarına göre hesaplanır.
        </p>
      </div>

      {/* Best / Worst Referee of the Month */}
      {(bestRef || worstRef) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bestRef && (
            <div className="rounded-xl border border-green-500/25 bg-green-500/5 p-5">
              <p className="text-xs font-semibold text-green-400 mb-1">🏅 Ayın En İyi Hakemi</p>
              <p className="text-white font-bold text-lg">{bestRef.referee_name}</p>
              <p className="text-green-400 text-2xl font-black">%{Math.round((bestRef.accuracy_pct ?? 0) * 100)}</p>
              <p className="text-xs text-gray-500">{bestRef.correct_calls}/{bestRef.total_calls} doğru karar</p>
            </div>
          )}
          {worstRef && worstRef.referee_name !== bestRef?.referee_name && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-5">
              <p className="text-xs font-semibold text-red-400 mb-1">⚠️ Ayın En Kötü Hakemi</p>
              <p className="text-white font-bold text-lg">{worstRef.referee_name}</p>
              <p className="text-red-400 text-2xl font-black">%{Math.round((worstRef.accuracy_pct ?? 0) * 100)}</p>
              <p className="text-xs text-gray-500">{worstRef.correct_calls}/{worstRef.total_calls} doğru karar</p>
            </div>
          )}
        </div>
      )}

      {/* Inconsistent referees alert */}
      {inconsistent.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
            ⚠️ Tutarsız Hakemler
          </h2>
          <div className="space-y-2">
            {(inconsistent as {
              referee_name: string;
              team_a_name: string;
              team_b_name: string;
              accuracy_a: number;
              accuracy_b: number;
              accuracy_gap: number;
            }[]).map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-white">{r.referee_name}</span>
                <span className="text-gray-500">—</span>
                <span className="text-gray-300">{r.team_a_name}</span>
                <span className={`font-bold ${r.accuracy_a >= 0.5 ? "text-green-400" : "text-red-400"}`}>
                  %{Math.round(r.accuracy_a * 100)}
                </span>
                <span className="text-gray-600">vs</span>
                <span className="text-gray-300">{r.team_b_name}</span>
                <span className={`font-bold ${r.accuracy_b >= 0.5 ? "text-green-400" : "text-red-400"}`}>
                  %{Math.round(r.accuracy_b * 100)}
                </span>
                <span className="ml-auto text-red-400 text-xs font-semibold">
                  {Math.round(r.accuracy_gap * 100)} puan fark
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-referee accuracy cards */}
      {Object.keys(byReferee).length === 0 ? (
        <div className="rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-gray-500 text-sm">Henüz hakem verisi yok.</p>
          <p className="text-gray-600 text-xs mt-1">
            Seed dosyasındaki doğruluk sayılarını doldurun.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byReferee).map(([refName, rows]) => {
            const isInconsistent = inconsistentRefs.has(refName);
            const totalCalls = (rows as { total_calls: number }[]).reduce((s, r) => s + r.total_calls, 0);
            const correctCalls = (rows as { correct_calls: number }[]).reduce((s, r) => s + r.correct_calls, 0);
            const overallPct = totalCalls > 0 ? correctCalls / totalCalls : null;

            return (
              <div
                key={refName}
                className={`rounded-xl border p-5 space-y-4 ${
                  isInconsistent
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-gray-800 bg-gray-900/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{refName}</h3>
                    {isInconsistent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                        Tutarsız
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {overallPct !== null ? `%${Math.round(overallPct * 100)}` : "—"}
                    </p>
                    <p className="text-xs text-gray-500">Genel doğruluk</p>
                  </div>
                </div>

                {/* Per-team accuracy bars */}
                <div className="space-y-1.5">
                  {(rows as {
                    team_name: string;
                    correct_calls: number;
                    total_calls: number;
                    accuracy_pct: number | null;
                  }[])
                    .filter((r) => r.total_calls > 0)
                    .sort((a, b) => (b.accuracy_pct ?? 0) - (a.accuracy_pct ?? 0))
                    .map((r) => {
                      const pct = r.accuracy_pct ?? 0;
                      return (
                        <div key={r.team_name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-32 truncate">{r.team_name}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${pct >= 0.7 ? "bg-green-500" : pct >= 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">
                            %{Math.round(pct * 100)}
                          </span>
                          <span className="text-xs text-gray-600 w-12 text-right">
                            {r.correct_calls}/{r.total_calls}
                          </span>
                        </div>
                      );
                    })}
                  {(rows as { total_calls: number }[]).every((r) => r.total_calls === 0) && (
                    <p className="text-xs text-gray-600">Bu hakeme ait henüz olay yok.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
