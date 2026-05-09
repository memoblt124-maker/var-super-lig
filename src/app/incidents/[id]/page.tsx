// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { IFAB_RULES } from "@/lib/ifab-rules";
import { TYPE_MAP } from "@/lib/incident-types";
import { signInWithGoogleAction, signOutAction, castVoteAction } from "../actions";

const VERDICT_COLOR: Record<string, string> = {
  correct:      "text-green-400",
  incorrect:    "text-red-400",
  inconclusive: "text-yellow-400",
};
const VERDICT_LABEL: Record<string, string> = {
  correct:      "Doğru Karar",
  incorrect:    "Hatalı Karar",
  inconclusive: "Belirsiz",
};

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [incResult, authResult] = await Promise.all([
    supabase
      .from("incidents")
      .select(`
        *,
        teams!team_affected_id ( name ),
        referees ( name ),
        matches ( matchday, kickoff_at,
          home:teams!home_team_id ( name ),
          away:teams!away_team_id ( name )
        ),
        panel_verdicts ( ref_name, verdict, created_at ),
        fan_votes ( vote, user_id )
      `)
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  const inc  = incResult.data;
  const user = authResult.data?.user ?? null;

  if (!inc) notFound();

  const team  = inc.teams as { name: string } | null;
  const ref   = inc.referees as { name: string } | null;
  const match = inc.matches as {
    matchday: number; kickoff_at: string;
    home: { name: string }; away: { name: string };
  } | null;
  const panel = (inc.panel_verdicts as { ref_name: string; verdict: string; created_at: string }[]) ?? [];
  const votes = (inc.fan_votes as { vote: string; user_id: string }[]) ?? [];

  const fanCorrect   = votes.filter((v) => v.vote === "correct").length;
  const fanIncorrect = votes.filter((v) => v.vote === "incorrect").length;
  const fanTotal     = votes.length;
  const panelCorrect   = panel.filter((v) => v.verdict === "correct").length;
  const panelIncorrect = panel.filter((v) => v.verdict === "incorrect").length;

  const piv    = inc.piv_confirmed ?? inc.piv_preview ?? 0;
  const rule   = IFAB_RULES[inc.type];
  const videoId = inc.video_url ? getYouTubeId(inc.video_url) : null;

  const userVote = user ? (votes.find((v) => v.user_id === user.id)?.vote ?? null) : null;
  const voteOpen = !inc.vote_closes_at || new Date(inc.vote_closes_at) > new Date();

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <p className="text-gray-500 text-sm mb-1">
          {match ? `${match.home?.name} - ${match.away?.name}` : ""}
          {match?.matchday ? ` · Hafta ${match.matchday}` : ""}
        </p>
        <h1 className="text-2xl font-bold text-white">
          {TYPE_MAP[inc.type]?.label ?? inc.type} · {inc.minute}&apos;
        </h1>
        {inc.description && (
          <p className="text-gray-300 text-sm mt-1 italic">&ldquo;{inc.description}&rdquo;</p>
        )}
        <p className="text-gray-400 text-sm mt-1">
          Etkilenen takım: <span className="text-white font-medium">{team?.name}</span>
          {ref ? <> · Hakem: <span className="text-white font-medium">{ref.name}</span></> : ""}
        </p>
        {(inc.is_worst_week || inc.is_worst_month) && (
          <div className="flex gap-2 mt-2">
            {inc.is_worst_week  && <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-semibold">🏆 Haftanın En Kötü Kararı</span>}
            {inc.is_worst_month && <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold">📅 Ayın En Kötü Kararı</span>}
          </div>
        )}
      </div>

      {/* YouTube video */}
      {videoId && (
        <div className="rounded-xl overflow-hidden border border-gray-800 aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Olay videosu"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* PIV Breakdown */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">PIV Hesabı</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Ağırlık</p>
            <p className="text-lg font-bold text-white">{inc.severity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Zaman Katsayısı</p>
            <p className="text-lg font-bold text-white">×{inc.time_weight}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Oyun Durumu</p>
            <p className="text-lg font-bold text-white">{inc.game_state > 0 ? `+${inc.game_state}` : inc.game_state}</p>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-3 text-center">
          <p className="text-xs text-gray-500">Toplam PIV</p>
          <p className={`text-3xl font-black ${piv > 0 ? "text-green-400" : piv < 0 ? "text-red-400" : "text-gray-400"}`}>
            {piv > 0 ? `+${piv.toFixed(2)}` : piv.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {inc.status === "confirmed" ? "Onaylı — Adalet Tablosuna yansıdı" : "Taslak — Onay bekleniyor"}
          </p>
        </div>
      </div>

      {/* IFAB Official Rule */}
      {rule && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
              📖 {rule.title}
            </h2>
            <p className="text-xs text-blue-400/60 mt-0.5">{rule.law}</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{rule.text}</p>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Kural ihlali sayılan durumlar:</p>
            <ul className="space-y-1">
              {rule.criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-blue-400 mt-0.5 shrink-0">·</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Panel Verdicts */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Hakem Paneli <span className="text-gray-600">(3 Uluslararası Emekli Hakem · %60)</span>
          </h2>
          <span className="text-xs text-gray-500">{panel.length}/3</span>
        </div>
        {panel.length === 0 ? (
          <p className="text-gray-600 text-sm">Henüz panel kararı girilmedi.</p>
        ) : (
          <div className="space-y-2">
            {panel.map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-sm text-gray-300">{v.ref_name}</p>
                <span className={`text-sm font-semibold ${VERDICT_COLOR[v.verdict]}`}>
                  {VERDICT_LABEL[v.verdict]}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-gray-800 pt-3 flex gap-6">
          <div className="text-center">
            <p className="text-green-400 font-bold text-lg">{panelCorrect}</p>
            <p className="text-xs text-gray-500">Doğru</p>
          </div>
          <div className="text-center">
            <p className="text-red-400 font-bold text-lg">{panelIncorrect}</p>
            <p className="text-xs text-gray-500">Hatalı</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg">{panel.length - panelCorrect - panelIncorrect}</p>
            <p className="text-xs text-gray-500">Belirsiz</p>
          </div>
        </div>
      </div>

      {/* Fan Vote */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Taraftar Oylaması <span className="text-gray-600">(%40)</span>
          </h2>
          {user && (
            <form action={signOutAction}>
              <input type="hidden" name="incident_id" value={inc.id} />
              <button type="submit" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Çıkış ({user.user_metadata?.name ?? user.email})
              </button>
            </form>
          )}
        </div>

        {/* Vote tally — always visible */}
        {fanTotal > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">Doğru</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(fanCorrect / fanTotal) * 100}%` }} />
              </div>
              <span className="text-xs text-green-400 w-8 text-right">{fanCorrect}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">Hatalı</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${(fanIncorrect / fanTotal) * 100}%` }} />
              </div>
              <span className="text-xs text-red-400 w-8 text-right">{fanIncorrect}</span>
            </div>
          </div>
        )}

        {/* Vote action area */}
        {!voteOpen ? (
          <p className="text-xs text-gray-600">Oylama kapandı · {fanTotal} oy</p>
        ) : !user ? (
          <div className="border-t border-gray-800 pt-4 space-y-2">
            <p className="text-xs text-gray-500">Oy kullanmak için Google ile giriş yap:</p>
            <form action={signInWithGoogleAction}>
              <input type="hidden" name="incident_id" value={inc.id} />
              <button type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 text-sm font-semibold rounded-lg transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Giriş Yap
              </button>
            </form>
          </div>
        ) : userVote ? (
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <p className="text-xs text-gray-500">
              Oyunuz: <span className={`font-semibold ${userVote === "correct" ? "text-green-400" : "text-red-400"}`}>
                {userVote === "correct" ? "Doğru Karar" : "Hatalı Karar"}
              </span>
            </p>
            <div className="flex gap-2">
              <form action={castVoteAction}>
                <input type="hidden" name="incident_id" value={inc.id} />
                <input type="hidden" name="vote" value="correct" />
                <button type="submit"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${userVote === "correct" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                  ✓ Doğru Karar
                </button>
              </form>
              <form action={castVoteAction}>
                <input type="hidden" name="incident_id" value={inc.id} />
                <input type="hidden" name="vote" value="incorrect" />
                <button type="submit"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${userVote === "incorrect" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                  ✗ Hatalı Karar
                </button>
              </form>
            </div>
            <p className="text-xs text-gray-600">Toplam {fanTotal} oy · Oyunuzu değiştirebilirsiniz</p>
          </div>
        ) : (
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <p className="text-xs text-gray-500">Bu karar doğru muydu?</p>
            <div className="flex gap-2">
              <form action={castVoteAction}>
                <input type="hidden" name="incident_id" value={inc.id} />
                <input type="hidden" name="vote" value="correct" />
                <button type="submit"
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-sm font-semibold rounded-lg border border-green-500/20 transition-colors">
                  ✓ Doğru Karar
                </button>
              </form>
              <form action={castVoteAction}>
                <input type="hidden" name="incident_id" value={inc.id} />
                <input type="hidden" name="vote" value="incorrect" />
                <button type="submit"
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-semibold rounded-lg border border-red-500/20 transition-colors">
                  ✗ Hatalı Karar
                </button>
              </form>
            </div>
            <p className="text-xs text-gray-600">Toplam {fanTotal} oy</p>
          </div>
        )}
      </div>

    </div>
  );
}
