"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TYPE_GROUPS } from "@/lib/incident-types";

type Team = { id: string; name: string };

export default function IncidentFilters({
  teams,
  matchdays,
}: {
  teams: Team[];
  matchdays: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const set = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/incidents?${params.toString()}`);
    },
    [router, searchParams]
  );

  const active = (key: string, value: string) =>
    searchParams.get(key) === value;
  const current = (key: string) => searchParams.get(key) ?? "";

  return (
    <div className="space-y-3">
      {/* Group filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => set("group", "")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            !current("group")
              ? "bg-white text-gray-900"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Tümü
        </button>
        {Object.keys(TYPE_GROUPS).map((g) => (
          <button
            key={g}
            onClick={() => set("group", active("group", g) ? "" : g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              active("group", g)
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {g.replace(" Kararları", "")}
          </button>
        ))}
      </div>

      {/* Team + Matchday selects */}
      <div className="flex gap-2">
        <select
          value={current("team")}
          onChange={(e) => set("team", e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
        >
          <option value="">Tüm Takımlar</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={current("week")}
          onChange={(e) => set("week", e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
        >
          <option value="">Tüm Haftalar</option>
          {matchdays.map((w) => (
            <option key={w} value={String(w)}>
              Hafta {w}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
