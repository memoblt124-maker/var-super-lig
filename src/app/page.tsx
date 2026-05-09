// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import JusticeTable, { type TableRow } from "@/components/JusticeTable";
import SectionWithMockup from "@/components/blocks/section-with-mockup";
import ScrollExpandMedia from "@/components/blocks/scroll-expansion-hero";
import { PhotoPile } from "@/components/ui/photo-pile";

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
    <div>
      {/* Scroll-expand video hero — full bleed */}
      <div
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          marginTop: "-2rem",
          width: "100vw",
        }}
      >
        <ScrollExpandMedia
          mediaType="video"
          mediaSrc="https://www.youtube.com/watch?v=wNl0Jbomm_g"
          bgImageSrc="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1920&auto=format&fit=crop&q=80"
          title="VAR Adaleti"
          date="2025–26 Sezonu"
          scrollToExpand="Genişletmek için kaydırın"
          textBlend
        >
          {/* Content revealed after full expansion */}
          <div className="max-w-4xl mx-auto text-white space-y-4">
            <h2 className="text-3xl font-black">Hakem Hataları Artık Görünür</h2>
            <p className="text-white/60 text-lg leading-relaxed">
              Her tartışmalı karar bağımsız uluslararası eski hakemler ve taraftar oylamasıyla
              değerlendirilir. PIV formülü hatalı kararların puana etkisini hesaplar.
            </p>
          </div>
        </ScrollExpandMedia>
      </div>

      {/* Justice Table */}
      <div className="space-y-8 mt-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Adalet Tablosu</h1>
          <p className="mt-2 text-[#6b7280] text-sm max-w-xl">
            Hakem hataları puana dönüştürüldüğünde gerçek sıralama nasıl görünür?
            Her olay bağımsız uluslararası eski hakemler (%60) ve taraftar oylamasıyla (%40) değerlendirilir.
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="text-[#6b7280] text-sm">Henüz puan durumu verisi yok.</p>
        ) : (
          <JusticeTable rows={rows} />
        )}
      </div>

      {/* Photo pile — full bleed */}
      <div
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          width: "100vw",
          marginTop: "4rem",
        }}
      >
        <PhotoPile />
      </div>

      {/* How it works sections — full bleed */}
      <div
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          width: "100vw",
        }}
      >
        <SectionWithMockup
          title={<>Hakem Hataları<br />Artık Sayıya Dönüşüyor.</>}
          description={
            <>
              Her tartışmalı VAR kararı 3 emekli uluslararası hakem ve taraftar oylamasıyla değerlendirilir.
              PIV formülü hatalı kararın maç skoruna ve puan tablosuna etkisini hesaplar.
            </>
          }
          primaryImageSrc="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80"
          secondaryImageSrc="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=80"
        />
        <SectionWithMockup
          reverseLayout
          title={<>Hakem Tutarsızlıkları<br />Artık Görünür.</>}
          description={
            <>
              Hakem tutarlılık matrisi, her hakemin takım başına doğruluk oranını takip eder.
              İki takım arasında %20&apos;den fazla fark varsa hakem otomatik olarak
              &ldquo;Tutarsız&rdquo; olarak işaretlenir.
            </>
          }
          primaryImageSrc="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
          secondaryImageSrc="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80"
        />
      </div>
    </div>
  );
}
