// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { TYPE_MAP } from "@/lib/incident-types";
import IncidentFilters from "@/components/IncidentFilters";

export const revalidate = 60;

const GROUP_COLOR: Record<string, string> = {
  "Kart Kararları":      "bg-red-500/15 text-red-400 border-red-500/25",
  "Gol Kararları":       "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Penaltı Kararları":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  "Faul Kararları":      "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "Ofsayt Kararları":    "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "Davranış Kararları":  "bg-gray-500/15 text-gray-400 border-gray-500/25",
};

function typeColor(type: string) {
  const group = TYPE_MAP[type]?.group ?? "";
  return GROUP_COLOR[group] ?? "bg-gray-500/15 text-gray-400 border-gray-500/25";
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

function TeamBadge({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300 shrink-0`}>
      {initials(name)}
    </div>
  );
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // ── fetch all data in parallel ───────────────────────────────────────────
  const [{ data: rawIncidents }, { data: teams }, { data: referees }, { data: allIncidents }] =
    await Promise.all([
      supabase
        .from("incidents")
        .select(`
          id, type, minute, piv_preview, piv_confirmed, status,
          is_worst_week, is_worst_month,
          teams!team_affected_id ( id, name ),
          referees ( id, name ),
          matches ( matchday, home:teams!home_team_id(name), away:teams!away_team_id(name) )
        `)
        .order("created_at", { ascending: false }),
      supabase.from("teams").select("id, name").order("name"),
      supabase.from("referees").select("id, name").order("name"),
      supabase
        .from("incidents")
        .select("team_affected_id, referee_id, piv_preview, piv_confirmed, status"),
    ]);

  const incidents = (rawIncidents ?? []) as any[];

  // ── stats ────────────────────────────────────────────────────────────────
  const pivByTeam: Record<string, { name: string; piv: number }> = {};
  for (const inc of allIncidents ?? []) {
    const tid = inc.team_affected_id;
    const team = (teams ?? []).find((t) => t.id === tid);
    if (!team) continue;
    const piv = inc.piv_confirmed ?? inc.piv_preview ?? 0;
    if (!pivByTeam[tid]) pivByTeam[tid] = { name: team.name, piv: 0 };
    pivByTeam[tid].piv += piv;
  }
  const pivEntries = Object.values(pivByTeam).sort((a, b) => b.piv - a.piv);
  const mostAffected  = pivEntries[0] ?? null;
  const leastAffected = pivEntries[pivEntries.length - 1] ?? null;

  const incidentsByRef: Record<string, { name: string; count: number }> = {};
  for (const inc of allIncidents ?? []) {
    const rid = inc.referee_id;
    if (!rid) continue;
    const ref = (referees ?? []).find((r) => r.id === rid);
    if (!ref) continue;
    if (!incidentsByRef[rid]) incidentsByRef[rid] = { name: ref.name, count: 0 };
    incidentsByRef[rid].count += 1;
  }
  const refEntries = Object.values(incidentsByRef).sort((a, b) => b.count - a.count);
  const worstRef = refEntries[0] ?? null;
  const bestRef  = refEntries[refEntries.length - 1] ?? null;

  // ── filter ───────────────────────────────────────────────────────────────
  const matchdays = [...new Set(incidents.flatMap((i) => i.matches?.matchday ? [i.matches.matchday] : []))].sort((a, b) => a - b);

  let filtered = incidents;
  if (sp.team)  filtered = filtered.filter((i) => i.teams?.id === sp.team);
  if (sp.week)  filtered = filtered.filter((i) => String(i.matches?.matchday) === sp.week);
  if (sp.group) filtered = filtered.filter((i) => TYPE_MAP[i.type]?.group === sp.group);

  const worstWeek  = incidents.find((i) => i.is_worst_week);
  const worstMonth = incidents.find((i) => i.is_worst_month);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">VAR Olayları</h1>
        <p className="mt-1 text-gray-400 text-sm">Tüm tartışmalı kararlar ve hakem hataları</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {mostAffected && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-1">
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wide">En Çok Mağdur</p>
            <div className="flex items-center gap-2 mt-2">
              <TeamBadge name={mostAffected.name} size="sm" />
              <p className="text-white font-bold text-sm leading-tight">{mostAffected.name}</p>
            </div>
            <p className="text-red-400 font-bold text-lg">+{mostAffected.piv.toFixed(1)} PIV</p>
          </div>
        )}
        {leastAffected && leastAffected.name !== mostAffected?.name && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-1">
            <p className="text-xs text-green-400 font-semibold uppercase tracking-wide">En Az Mağdur</p>
            <div className="flex items-center gap-2 mt-2">
              <TeamBadge name={leastAffected.name} size="sm" />
              <p className="text-white font-bold text-sm leading-tight">{leastAffected.name}</p>
            </div>
            <p className="text-green-400 font-bold text-lg">{leastAffected.piv.toFixed(1)} PIV</p>
          </div>
        )}
        {worstRef && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-1">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide">En Kötü Hakem</p>
            <p className="text-white font-bold text-sm mt-2 leading-tight">{worstRef.name}</p>
            <p className="text-orange-400 text-sm">{worstRef.count} hatalı karar</p>
          </div>
        )}
        {bestRef && bestRef.name !== worstRef?.name && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">En İyi Hakem</p>
            <p className="text-white font-bold text-sm mt-2 leading-tight">{bestRef.name}</p>
            <p className="text-blue-400 text-sm">{bestRef.count} karar</p>
          </div>
        )}
      </div>

      {/* Featured */}
      {(worstWeek || worstMonth) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {worstWeek && <FeaturedCard inc={worstWeek} badge="🏆 Haftanın En Kötü Kararı" />}
          {worstMonth && <FeaturedCard inc={worstMonth} badge="📅 Ayın En Kötü Kararı" />}
        </div>
      )}

      {/* Filters */}
      <Suspense>
        <IncidentFilters
          teams={(teams ?? []) as { id: string; name: string }[]}
          matchdays={matchdays}
        />
      </Suspense>

      {/* Incident list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-gray-500 text-sm">Bu filtre için olay bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inc: any) => {
            const piv = inc.piv_confirmed ?? inc.piv_preview ?? 0;
            const pivPositive = piv > 0;
            return (
              <Link
                key={inc.id}
                href={`/incidents/${inc.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3.5 hover:border-gray-600 hover:bg-gray-800/60 transition-all group"
              >
                {/* Team badge */}
                <TeamBadge name={inc.teams?.name ?? "?"} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeColor(inc.type)}`}>
                      {TYPE_MAP[inc.type]?.label ?? inc.type}
                    </span>
                    {inc.matches?.matchday && (
                      <span className="text-[11px] text-gray-600">H{inc.matches.matchday}</span>
                    )}
                  </div>
                  <p className="text-white text-sm font-medium truncate">
                    {inc.matches
                      ? `${inc.matches.home?.name} - ${inc.matches.away?.name}`
                      : inc.teams?.name ?? "—"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {inc.teams?.name} · {inc.minute}&apos;
                    {inc.referees ? ` · ${inc.referees.name}` : ""}
                  </p>
                </div>

                {/* PIV + status */}
                <div className="shrink-0 text-right space-y-1">
                  <p className={`text-sm font-black tabular-nums ${pivPositive ? "text-red-400" : "text-green-400"}`}>
                    {pivPositive ? `+${piv.toFixed(1)}` : piv.toFixed(1)}
                  </p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    inc.status === "confirmed"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {inc.status === "confirmed" ? "Onaylı" : "Açık"}
                  </span>
                </div>

                <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">›</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ inc, badge }: { inc: any; badge: string }) {
  const piv = inc.piv_confirmed ?? inc.piv_preview ?? 0;
  return (
    <Link
      href={`/incidents/${inc.id}`}
      className="block rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5 hover:border-orange-500/40 transition-colors space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-orange-400">{badge}</span>
        <span className={`text-lg font-black ${piv > 0 ? "text-red-400" : "text-green-400"}`}>
          {piv > 0 ? `+${piv.toFixed(1)}` : piv.toFixed(1)} PIV
        </span>
      </div>
      <p className="text-white font-bold">
        {inc.matches ? `${inc.matches.home?.name} - ${inc.matches.away?.name}` : "—"}
      </p>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeColor(inc.type)}`}>
          {TYPE_MAP[inc.type]?.label ?? inc.type}
        </span>
        <span className="text-gray-400 text-xs">{inc.minute}&apos; · {inc.teams?.name}</span>
      </div>
    </Link>
  );
}
