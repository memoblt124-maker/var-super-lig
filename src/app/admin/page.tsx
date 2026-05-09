import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { logoutAction } from "./actions";
import { TYPE_MAP } from "@/lib/incident-types";

export default async function AdminPage() {
  const jar = await cookies();
  if (jar.get("admin_auth")?.value !== process.env.ADMIN_SECRET) redirect("/admin/login");

  const supabase = await createClient();
  const { data: incidents } = await supabase
    .from("incidents")
    .select(`
      id, type, minute, status, piv_preview, piv_confirmed, is_worst_week, is_worst_month,
      teams!team_affected_id ( name ),
      matches ( matchday, home:teams!home_team_id(name), away:teams!away_team_id(name) )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Paneli</h1>
          <p className="text-gray-400 text-sm">VAR olaylarını yönet</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/incidents/new"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Yeni Olay
          </Link>
          <form action={logoutAction}>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
              Çıkış
            </button>
          </form>
        </div>
      </div>

      {/* Incidents list */}
      <div className="space-y-2">
        {!incidents || incidents.length === 0 ? (
          <div className="rounded-xl border border-gray-800 p-10 text-center">
            <p className="text-gray-500 text-sm">Henüz olay yok.</p>
            <Link href="/admin/incidents/new" className="text-red-400 text-sm mt-2 inline-block hover:underline">
              İlk olayı ekle →
            </Link>
          </div>
        ) : (
          (incidents as {
            id: string; type: string; minute: number; status: string;
            piv_preview: number; piv_confirmed: number | null;
            is_worst_week: boolean; is_worst_month: boolean;
            teams: { name: string } | null;
            matches: { matchday: number; home: { name: string }; away: { name: string } } | null;
          }[]).map((inc) => (
            <Link
              key={inc.id}
              href={`/admin/incidents/${inc.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-3.5 hover:border-gray-700 transition-colors"
            >
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                inc.status === "confirmed" ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"
              }`}>
                {inc.status === "confirmed" ? "Onaylı" : "Açık"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {inc.matches ? `${inc.matches.home?.name} - ${inc.matches.away?.name}` : "—"}
                </p>
                <p className="text-gray-500 text-xs">
                  {TYPE_MAP[inc.type]?.label ?? inc.type} · {inc.minute}&apos; · {inc.teams?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inc.is_worst_week  && <span className="text-xs text-orange-400">🏆 Hafta</span>}
                {inc.is_worst_month && <span className="text-xs text-red-400">📅 Ay</span>}
                <span className={`text-sm font-bold ${(inc.piv_confirmed ?? inc.piv_preview) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {(inc.piv_confirmed ?? inc.piv_preview) > 0 ? "+" : ""}{(inc.piv_confirmed ?? inc.piv_preview).toFixed(1)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
