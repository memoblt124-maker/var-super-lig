// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import JusticeTable, { type TableRow } from "@/components/JusticeTable";

export const revalidate = 60;

async function getTableData(): Promise<TableRow[]> {
  const supabase = await createClient();

  const [{ data: standings }, { data: incidents }] = await Promise.all([
    supabase
      .from("standings")
      .select(`team_id, position, points, played, won, drawn, lost, gf, ga, gd, teams ( name, logo_url )`)
      .eq("season_id", "a1000000-0000-0000-0000-000000000003")
      .order("position", { ascending: true }),
    supabase
      .from("incidents")
      .select("team_affected_id, piv_preview, piv_confirmed, status"),
  ]);

  if (!standings || standings.length === 0) return [];

  // Sum PIV per team (confirmed → piv_confirmed, open → piv_preview)
  const pivByTeam: Record<string, number> = {};
  for (const inc of incidents ?? []) {
    const tid = inc.team_affected_id;
    const piv = inc.piv_confirmed ?? inc.piv_preview ?? 0;
    pivByTeam[tid] = (pivByTeam[tid] ?? 0) + piv;
  }

  return standings.map((row) => {
    const piv = pivByTeam[row.team_id] ?? 0;
    return {
      team_id:        row.team_id,
      team_name:      (row.teams as any)?.name ?? "",
      logo_url:       (row.teams as any)?.logo_url ?? null,
      real_position:  row.position,
      real_points:    row.points,
      played:         row.played,
      won:            row.won,
      drawn:          row.drawn,
      lost:           row.lost,
      gf:             row.gf,
      ga:             row.ga,
      gd:             row.gd,
      piv_total:      piv,
      justice_points: row.points + piv,
    };
  });
}

export default async function HomePage() {
  const rows = await getTableData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Adalet Tablosu
        </h1>
        <p className="mt-2 text-gray-400 text-sm max-w-xl">
          Hakem hataları puana dönüştürüldüğünde gerçek sıralama nasıl görünür?
          Her olay bağımsız uluslararası eski hakemler (%60) ve taraftar oylamasıyla (%40) değerlendirilir.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Henüz puan durumu verisi yok.
        </p>
      ) : (
        <JusticeTable rows={rows} />
      )}
    </div>
  );
}
