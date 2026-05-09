// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import JusticeTable, { type TableRow } from "@/components/JusticeTable";

export const revalidate = 60;

async function getTableData(): Promise<TableRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("standings")
    .select(`
      team_id,
      position,
      points,
      played, won, drawn, lost, gf, ga, gd,
      teams ( name, logo_url )
    `)
    .eq("season_id", "a1000000-0000-0000-0000-000000000003")
    .order("position", { ascending: true });

  if (error || !data || data.length === 0) return [];

  return data.map((row) => ({
    team_id:        row.team_id,
    team_name:      (row.teams as { name: string; logo_url: string | null })?.name ?? "",
    logo_url:       (row.teams as { name: string; logo_url: string | null })?.logo_url ?? null,
    real_position:  row.position,
    real_points:    row.points,
    played:         row.played,
    won:            row.won,
    drawn:          row.drawn,
    lost:           row.lost,
    gf:             row.gf,
    ga:             row.ga,
    gd:             row.gd,
    piv_total:      0,
    justice_points: row.points,
  }));
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
          Henüz puan durumu verisi yok. Supabase&apos;e standings verisi ekleyin.
        </p>
      ) : (
        <JusticeTable rows={rows} />
      )}
    </div>
  );
}
