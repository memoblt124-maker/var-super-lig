import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const LEAGUE_ID = 203;   // Süper Lig
const SEASON    = 2025;
const SEASON_DB = "a1000000-0000-0000-0000-000000000003";

async function fetchStandings() {
  const res = await fetch(
    `https://${process.env.API_FOOTBALL_HOST}/standings?league=${LEAGUE_ID}&season=${SEASON}`,
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
  );
  const data = await res.json();
  return data?.response?.[0]?.league?.standings?.[0] ?? [];
}

// Maps API-Football team ID → our Supabase team UUID
const API_ID_TO_UUID: Record<number, string> = {
  645:  "b1000000-0000-0000-0000-000000000001", // Galatasaray
  611:  "b1000000-0000-0000-0000-000000000002", // Fenerbahçe
  549:  "b1000000-0000-0000-0000-000000000003", // Beşiktaş
  998:  "b1000000-0000-0000-0000-000000000004", // Trabzonspor
  564:  "b1000000-0000-0000-0000-000000000005", // Başakşehir
  1004: "b1000000-0000-0000-0000-000000000006", // Kasımpaşa
  1002: "b1000000-0000-0000-0000-000000000007", // Sivasspor
  996:  "b1000000-0000-0000-0000-000000000008", // Alanyaspor
  1005: "b1000000-0000-0000-0000-000000000009", // Antalyaspor
  607:  "b1000000-0000-0000-0000-000000000010", // Konyaspor
  1001: "b1000000-0000-0000-0000-000000000011", // Kayserispor
  3573: "b1000000-0000-0000-0000-000000000012", // Gaziantep FK
  3575: "b1000000-0000-0000-0000-000000000013", // Hatayspor
  3603: "b1000000-0000-0000-0000-000000000014", // Samsunspor
  1007: "b1000000-0000-0000-0000-000000000015", // Rizespor
  3588: "b1000000-0000-0000-0000-000000000016", // Eyüpspor
  3583: "b1000000-0000-0000-0000-000000000017", // Bodrum FK
  994:  "b1000000-0000-0000-0000-000000000018", // Göztepe
  7411: "b1000000-0000-0000-0000-000000000019", // Kocaelispor
  997:  "b1000000-0000-0000-0000-000000000020", // Gençlerbirliği
  3589: "b1000000-0000-0000-0000-000000000021", // Fatih Karagümrük
};

// Vercel cron: every 60s — only hits API-Football when a live match exists
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const soon = new Date(Date.now() + 5 * 60 * 1000);

  const { data: liveMatches } = await supabase
    .from("matches")
    .select("id")
    .or(`status.eq.live,and(status.eq.scheduled,kickoff_at.lte.${soon.toISOString()})`);

  if (!liveMatches || liveMatches.length === 0) {
    return NextResponse.json({ synced: false, reason: "no live matches" });
  }

  const apiStandings = await fetchStandings();
  const rows = apiStandings
    .map((t: { rank: number; team: { id: number }; points: number; all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } } }) => {
      const teamId = API_ID_TO_UUID[t.team.id];
      if (!teamId) return null;
      return {
        team_id:   teamId,
        season_id: SEASON_DB,
        position:  t.rank,
        points:    t.points,
        played:    t.all.played,
        won:       t.all.win,
        drawn:     t.all.draw,
        lost:      t.all.lose,
        gf:        t.all.goals.for,
        ga:        t.all.goals.against,
        synced_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  const { error } = await supabase
    .from("standings")
    .upsert(rows, { onConflict: "team_id,season_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ synced: true, teamsUpdated: rows.length });
}
