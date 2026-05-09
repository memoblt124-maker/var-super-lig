// @ts-nocheck
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addVerdictAction, closeIncidentAction, toggleFeaturedAction } from "../../actions";
import Link from "next/link";
import { TYPE_MAP } from "@/lib/incident-types";

const VERDICT_LABEL: Record<string, string> = {
  correct: "Doğru Karar", incorrect: "Hatalı Karar", inconclusive: "Belirsiz",
};
const VERDICT_COLOR: Record<string, string> = {
  correct: "text-green-400", incorrect: "text-red-400", inconclusive: "text-yellow-400",
};

export default async function AdminIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (jar.get("admin_auth")?.value !== process.env.ADMIN_SECRET) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: inc } = await supabase
    .from("incidents")
    .select(`
      *,
      teams!team_affected_id ( name ),
      referees ( name ),
      matches ( matchday, home:teams!home_team_id(name), away:teams!away_team_id(name) ),
      panel_verdicts ( id, ref_name, verdict, created_at )
    `)
    .eq("id", id)
    .single();

  if (!inc) redirect("/admin");

  const team    = inc.teams as { name: string } | null;
  const ref     = inc.referees as { name: string } | null;
  const match   = inc.matches as { matchday: number; home: { name: string }; away: { name: string } } | null;
  const panel   = (inc.panel_verdicts as { id: string; ref_name: string; verdict: string }[]) ?? [];
  const piv     = inc.piv_confirmed ?? inc.piv_preview ?? 0;
  const canClose = inc.status === "open";

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-gray-500 text-sm hover:text-white transition-colors">← Admin</Link>
        <Link href={`/incidents/${inc.id}`} className="text-gray-500 text-sm hover:text-white transition-colors">
          Herkese açık sayfası →
        </Link>
      </div>

      {/* Header */}
      <div>
        <p className="text-gray-500 text-sm">{match ? `${match.home?.name} - ${match.away?.name} · Hafta ${match.matchday}` : ""}</p>
        <h1 className="text-xl font-bold text-white mt-1">
          {TYPE_MAP[inc.type]?.label ?? inc.type} · {inc.minute}&apos; · {team?.name}
        </h1>
        {inc.description && (
          <p className="text-gray-300 text-sm mt-1 italic">&ldquo;{inc.description}&rdquo;</p>
        )}
        {ref && <p className="text-gray-400 text-sm">Hakem: {ref.name}</p>}
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${inc.status === "confirmed" ? "bg-green-500/15 text-green-400" : "bg-blue-500/15 text-blue-400"}`}>
            {inc.status === "confirmed" ? "Onaylı" : "Açık"}
          </span>
          <span className={`text-lg font-black ${piv > 0 ? "text-green-400" : "text-red-400"}`}>
            PIV: {piv > 0 ? "+" : ""}{piv.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Panel Verdicts */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Hakem Paneli Kararları</h2>
          <span className="text-xs text-gray-500">{panel.length}/3</span>
        </div>

        {panel.map((v) => (
          <div key={v.id} className="flex items-center justify-between py-1">
            <p className="text-sm text-gray-300">{v.ref_name}</p>
            <span className={`text-sm font-semibold ${VERDICT_COLOR[v.verdict]}`}>{VERDICT_LABEL[v.verdict]}</span>
          </div>
        ))}

        {panel.length < 3 && inc.status === "open" && (
          <form action={addVerdictAction} className="space-y-3 border-t border-gray-800 pt-4">
            <input type="hidden" name="incident_id" value={inc.id} />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hakem Adı</label>
              <input type="text" name="ref_name" required placeholder="Eski hakem adı"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Karar</label>
              <select name="verdict" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Seç...</option>
                <option value="correct">Doğru Karar</option>
                <option value="incorrect">Hatalı Karar</option>
                <option value="inconclusive">Belirsiz</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
              Karar Ekle
            </button>
          </form>
        )}
        {panel.length >= 3 && <p className="text-xs text-gray-600 border-t border-gray-800 pt-3">Panel tamamlandı (3/3)</p>}
      </div>

      {/* Featured toggles */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-3">
        <h2 className="font-semibold text-white">Öne Çıkar</h2>
        <div className="flex gap-3">
          <form action={toggleFeaturedAction}>
            <input type="hidden" name="incident_id" value={inc.id} />
            <input type="hidden" name="field" value="is_worst_week" />
            <input type="hidden" name="value" value={inc.is_worst_week ? "false" : "true"} />
            <button type="submit" className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              inc.is_worst_week ? "bg-orange-500/30 text-orange-300 border border-orange-500/40" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}>
              🏆 {inc.is_worst_week ? "Haftadan Kaldır" : "Haftanın En Kötüsü"}
            </button>
          </form>
          <form action={toggleFeaturedAction}>
            <input type="hidden" name="incident_id" value={inc.id} />
            <input type="hidden" name="field" value="is_worst_month" />
            <input type="hidden" name="value" value={inc.is_worst_month ? "false" : "true"} />
            <button type="submit" className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              inc.is_worst_month ? "bg-red-500/30 text-red-300 border border-red-500/40" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}>
              📅 {inc.is_worst_month ? "Aydan Kaldır" : "Ayın En Kötüsü"}
            </button>
          </form>
        </div>
      </div>

      {/* Close incident */}
      {canClose && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 space-y-3">
          <h2 className="font-semibold text-white">Olayı Onayla ve Kapat</h2>
          <p className="text-gray-400 text-sm">
            PIV onaylanır ve Adalet Tablosuna yansır. Hakem doğruluk matrisi güncellenir. Bu işlem geri alınamaz.
          </p>
          <form action={closeIncidentAction}>
            <input type="hidden" name="incident_id" value={inc.id} />
            <button type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
              ✓ Onayla ve Adalet Tablosuna Ekle
            </button>
          </form>
        </div>
      )}

      {inc.status === "confirmed" && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
          <p className="text-green-400 text-sm font-semibold">✓ Bu olay onaylandı ve Adalet Tablosuna yansıdı.</p>
          <p className="text-gray-500 text-xs mt-1">Onaylanan PIV: {(inc.piv_confirmed ?? 0).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
