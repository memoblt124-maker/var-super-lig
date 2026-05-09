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

export default function JusticeTable({ rows }: { rows: TableRow[] }) {
  const [mode, setMode] = useState<Mode>("justice");

  const sorted = [...rows].sort((a, b) => {
    const pa = mode === "justice" ? (a.justice_points ?? a.real_points) : a.real_points;
    const pb = mode === "justice" ? (b.justice_points ?? b.real_points) : b.real_points;
    return pb - pa;
  });

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        {(["justice", "real"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {m === "justice" ? "⚖️ Adalet Tablosu" : "📊 Gerçek Tablo"}
          </button>
        ))}
        {mode === "justice" && (
          <span className="ml-2 self-center text-xs text-gray-500">
            Onaylı PIV uygulandı
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-8">#</th>
              <th className="px-4 py-3 text-left">Takım</th>
              <th className="px-4 py-3 text-center">O</th>
              <th className="px-4 py-3 text-center">G</th>
              <th className="px-4 py-3 text-center">B</th>
              <th className="px-4 py-3 text-center">M</th>
              <th className="px-4 py-3 text-center">AG</th>
              <th className="px-4 py-3 text-center">AV</th>
              {mode === "justice" && (
                <th className="px-4 py-3 text-center text-red-400">PIV</th>
              )}
              <th className="px-4 py-3 text-center font-bold text-white">P</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sorted.map((row, i) => {
                const points =
                  mode === "justice"
                    ? (row.justice_points ?? row.real_points)
                    : row.real_points;
                const piv = row.piv_total ?? 0;
                const positionChange =
                  mode === "justice" ? row.real_position - (i + 1) : 0;

                return (
                  <motion.tr
                    key={row.team_id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                    className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-center">
                      <span className="flex items-center gap-1">
                        {i + 1}
                        {positionChange > 0 && (
                          <span className="text-green-400 text-xs">▲{positionChange}</span>
                        )}
                        {positionChange < 0 && (
                          <span className="text-red-400 text-xs">▼{Math.abs(positionChange)}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{row.team_name}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{row.played}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{row.won}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{row.drawn}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{row.lost}</td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {row.gf}:{row.ga}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                    {mode === "justice" && (
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            piv > 0
                              ? "text-green-400"
                              : piv < 0
                              ? "text-red-400"
                              : "text-gray-600"
                          }`}
                        >
                          {piv > 0 ? `+${piv.toFixed(1)}` : piv === 0 ? "—" : piv.toFixed(1)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center font-bold text-white">
                      {typeof points === "number" ? Math.round(points) : points}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
