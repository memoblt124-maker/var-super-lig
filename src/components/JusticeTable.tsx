"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export type TableRow = {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  real_position: number;
  real_points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  piv_total?: number;
  justice_points?: number;
};

type Mode = "justice" | "real";

function TeamBadge({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  const colors = [
    "bg-red-900/60 text-red-300",
    "bg-blue-900/60 text-blue-300",
    "bg-yellow-900/60 text-yellow-300",
    "bg-green-900/60 text-green-300",
    "bg-purple-900/60 text-purple-300",
    "bg-orange-900/60 text-orange-300",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-[10px] font-black shrink-0`}>
      {initials}
    </div>
  );
}

export default function JusticeTable({ rows }: { rows: TableRow[] }) {
  const [mode, setMode] = useState<Mode>("justice");

  const sorted = [...rows].sort((a, b) => {
    const pa = mode === "justice" ? (a.justice_points ?? a.real_points) : a.real_points;
    const pb = mode === "justice" ? (b.justice_points ?? b.real_points) : b.real_points;
    return pb - pa;
  });

  const realRankMap = Object.fromEntries(
    [...rows].sort((a, b) => b.real_points - a.real_points).map((r, i) => [r.team_id, i + 1])
  );

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 bg-[#16191f] rounded-xl border border-[#252a35]">
          {(["justice", "real"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-[#6b7280] hover:text-white"
              }`}
            >
              {m === "justice" ? "⚖️ Adalet Tablosu" : "📊 Gerçek Tablo"}
            </button>
          ))}
        </div>
        {mode === "justice" && (
          <span className="text-xs text-[#6b7280]">PIV uygulandı</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#252a35] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#16191f] border-b border-[#252a35] text-[#6b7280] text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">Takım</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">O</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">G</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">B</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">M</th>
              <th className="px-3 py-3 text-center hidden md:table-cell">AV</th>
              {mode === "justice" && (
                <th className="px-3 py-3 text-center text-red-400">PIV</th>
              )}
              <th className="px-4 py-3 text-center text-white font-bold">P</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sorted.map((row, i) => {
                const points = mode === "justice"
                  ? (row.justice_points ?? row.real_points)
                  : row.real_points;
                const piv = row.piv_total ?? 0;
                const justiceRank = i + 1;
                const realRank = realRankMap[row.team_id] ?? justiceRank;
                const change = mode === "justice" ? realRank - justiceRank : 0;
                const isTop4 = justiceRank <= 4;
                const isBottom3 = justiceRank > sorted.length - 3;

                return (
                  <motion.tr
                    key={row.team_id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
                    className={`border-b border-[#252a35]/50 hover:bg-[#1a1f2a] transition-colors ${
                      isTop4 ? "border-l-2 border-l-blue-500" :
                      isBottom3 ? "border-l-2 border-l-red-800" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold w-5 text-center ${
                          isTop4 ? "text-blue-400" : isBottom3 ? "text-red-600" : "text-[#6b7280]"
                        }`}>
                          {justiceRank}
                        </span>
                        {change > 0 && <span className="text-green-400 text-[10px] font-bold">▲{change}</span>}
                        {change < 0 && <span className="text-red-400 text-[10px] font-bold">▼{Math.abs(change)}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TeamBadge name={row.team_name} />
                        <span className="font-semibold text-white text-sm">{row.team_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-[#6b7280] hidden sm:table-cell">{row.played}</td>
                    <td className="px-3 py-3 text-center text-[#6b7280] hidden sm:table-cell">{row.won}</td>
                    <td className="px-3 py-3 text-center text-[#6b7280] hidden sm:table-cell">{row.drawn}</td>
                    <td className="px-3 py-3 text-center text-[#6b7280] hidden sm:table-cell">{row.lost}</td>
                    <td className="px-3 py-3 text-center text-[#6b7280] hidden md:table-cell">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    {mode === "justice" && (
                      <td className="px-3 py-3 text-center">
                        {piv !== 0 ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            piv > 0
                              ? "bg-red-500/15 text-red-400"
                              : "bg-green-500/15 text-green-400"
                          }`}>
                            {piv > 0 ? `+${piv.toFixed(1)}` : piv.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[#252a35]">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className="font-black text-white text-base">{Math.round(points)}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Legend */}
        <div className="bg-[#16191f] border-t border-[#252a35] px-4 py-2 flex gap-4 text-[11px] text-[#6b7280]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Şampiyonlar Ligi</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-800 inline-block"/>Küme Düşme</span>
        </div>
      </div>
    </div>
  );
}
