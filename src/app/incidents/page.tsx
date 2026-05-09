import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { IFAB_RULES } from "@/lib/ifab-rules";
import { TYPE_MAP } from "@/lib/incident-types";

export const revalidate = 60;

const GROUP_COLOR: Record<string, string> = {
  "Kart Kararları":      "bg-red-500/10 text-red-400 border-red-500/20",
  "Gol Kararları":       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Penaltı Kararları":   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Faul Kararları":      "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Ofsayt Kararları":    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Davranış Kararları":  "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function typeColor(type: string) {
  const group = TYPE_MAP[type]?.group ?? "";
  return GROUP_COLOR[group] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

const STATUS_COLOR: Record<string, string> = {
  open:      "bg-blue-500/10 text-blue-400",
  confirmed: "bg-green-500/10 text-green-400",
};

type Incident = {
  id: string;
  type: string;
  minute: number;
  piv_preview: number | null;
  piv_confirmed: number | null;
  status: string;
  created_at: string;
  is_worst_week: boolean;
  is_worst_month: boolean;
  teams: { name: string } | null;
  referees: { name: string } | null;
  matches: { matchday: number; kickoff_at: string; home: { name: string }; away: { name: string } } | null;
};

async function getIncidents() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select(`
      id, type, minute, piv_preview, piv_confirmed, status, created_at,
      is_worst_week, is_worst_month,
      teams!team_affected_id ( name ),
      referees ( name ),
      matches ( matchday, kickoff_at,
        home:teams!home_team_id ( name ),
        away:teams!away_team_id ( name )
      )
    `)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Incident[];
}

function FeaturedCard({ inc, badge }: { inc: Incident; badge: string }) {
  const piv = inc.piv_confirmed ?? inc.piv_preview ?? 0;
  const rule = IFAB_RULES[inc.type];
  return (
    <Link
      href={`/incidents/${inc.id}`}
      className="block rounded-xl border border-orange-500/25 bg-orange-500/5 p-5 hover:border-orange-500/40 transition-colors space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-orange-400">{badge}</span>
        <span className={`text-lg font-black ${piv > 0 ? "text-green-400" : "text-red-400"}`}>
          {piv > 0 ? `+${piv.toFixed(1)}` : piv.toFixed(1)} PIV
        </span>
      </div>
      <p className="text-white font-semibold">
        {inc.matches ? `${inc.matches.home?.name} - ${inc.matches.away?.name}` : "—"}
      </p>
      <p className="text-gray-400 text-sm">
        {rule?.title ?? inc.type} · {inc.minute}&apos; · {inc.teams?.name}
      </p>
    </Link>
  );
}

export default async function IncidentsPage() {
  const incidents = await getIncidents();

  const worstWeek  = incidents.find((i) => i.is_worst_week);
  const worstMonth = incidents.find((i) => i.is_worst_month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">VAR Olayları</h1>
        <p className="mt-1 text-gray-400 text-sm">
          Tüm tartışmalı kararlar ve hakem hataları
        </p>
      </div>

      {/* Featured: Worst of Week / Month */}
      {(worstWeek || worstMonth) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {worstWeek  && <FeaturedCard inc={worstWeek}  badge="🏆 Haftanın En Kötü Kararı" />}
          {worstMonth && <FeaturedCard inc={worstMonth} badge="📅 Ayın En Kötü Kararı" />}
        </div>
      )}

      {incidents.length === 0 ? (
        <div className="rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-gray-500 text-sm">Henüz kayıtlı olay yok.</p>
          <p className="text-gray-600 text-xs mt-1">
            Admin panelinden ilk olayı ekleyin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const team = inc.teams as { name: string } | null;
            const ref  = inc.referees as { name: string } | null;
            const match = inc.matches as {
              matchday: number;
              kickoff_at: string;
              home: { name: string };
              away: { name: string };
            } | null;
            const piv = inc.piv_confirmed ?? inc.piv_preview ?? 0;

            return (
              <Link
                key={inc.id}
                href={`/incidents/${inc.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-4 hover:border-gray-700 hover:bg-gray-900/70 transition-colors"
              >
                {/* Type badge */}
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${typeColor(inc.type)}`}>
                  {TYPE_MAP[inc.type]?.label ?? inc.type}
                </span>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {match
                      ? `${match.home?.name} - ${match.away?.name}`
                      : "Maç bilgisi yok"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {team?.name ?? "?"} · {inc.minute}&apos;
                    {ref ? ` · Hakem: ${ref.name}` : ""}
                    {match?.matchday ? ` · Hafta ${match.matchday}` : ""}
                  </p>
                </div>

                {/* PIV */}
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-bold ${piv > 0 ? "text-green-400" : piv < 0 ? "text-red-400" : "text-gray-500"}`}>
                    {piv > 0 ? `+${piv.toFixed(1)}` : piv.toFixed(1)} PIV
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[inc.status]}`}>
                    {inc.status === "open" ? "Açık" : "Onaylı"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
