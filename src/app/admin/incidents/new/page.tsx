import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createIncidentAction } from "../../actions";
import { TYPE_GROUPS } from "@/lib/incident-types";

export default async function NewIncidentPage() {
  const jar = await cookies();
  if (jar.get("admin_auth")?.value !== process.env.ADMIN_SECRET) redirect("/admin/login");

  const supabase = await createClient();
  const [{ data: teams }, { data: referees }] = await Promise.all([
    supabase.from("teams").select("id, name").order("name"),
    supabase.from("referees").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Yeni Olay Ekle</h1>
        <p className="text-gray-400 text-sm mt-1">Bir VAR olayı oluştur</p>
      </div>

      <form action={createIncidentAction} className="space-y-5">

        {/* Match */}
        <fieldset className="space-y-3 rounded-xl border border-gray-800 p-5">
          <legend className="text-sm font-semibold text-gray-400 px-1">Maç Bilgisi</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ev Sahibi</label>
              <select name="home_team_id" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Seç...</option>
                {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deplasman</label>
              <select name="away_team_id" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Seç...</option>
                {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hafta</label>
              <input type="number" name="matchday" min="1" max="38" required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                placeholder="32" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maç Tarihi</label>
              <input type="datetime-local" name="kickoff_at"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
            </div>
          </div>
        </fieldset>

        {/* Incident details */}
        <fieldset className="space-y-3 rounded-xl border border-gray-800 p-5">
          <legend className="text-sm font-semibold text-gray-400 px-1">Olay Detayı</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Olay Türü</label>
              <select name="type" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Seç...</option>
                {Object.entries(TYPE_GROUPS).map(([group, types]) => (
                  <optgroup key={group} label={group}>
                    {types.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} (Ağırlık: {t.severity.toFixed(1)})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dakika</label>
              <input type="number" name="minute" min="1" max="120" required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                placeholder="88" />
              <p className="text-xs text-gray-600 mt-1">&lt;70 → ×1.0 · 70-84 → ×1.5 · ≥85 → ×2.0</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Etkilenen Takım</label>
              <select name="team_affected_id" required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Seç...</option>
                {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hakem</label>
              <select name="referee_id" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                <option value="">Seç...</option>
                {referees?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Olay Açıklaması
              <span className="text-gray-600 ml-1">— ne oldu, kısa ve net</span>
            </label>
            <textarea name="description" rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
              placeholder="Yunus Akgün geriye yürürken hakeme çarptı, sarı kart gördü." />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Oyun Durumu (GameState)
              <span className="text-gray-600 ml-1">— berabere=0, 1 gol önde=+0.5, 1 gol geride=-0.5</span>
            </label>
            <input type="number" name="game_state" step="0.1" defaultValue="0"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">YouTube Linki (opsiyonel)</label>
            <input type="url" name="video_url"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              placeholder="https://www.youtube.com/watch?v=..." />
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button type="submit"
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
            Olay Oluştur
          </button>
          <a href="/admin" className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors text-center">
            İptal
          </a>
        </div>
      </form>
    </div>
  );
}
