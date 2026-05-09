'use client';

import { SplineScene } from '@/components/ui/splite';
import { useEffect, useState } from 'react';

const VERDICTS = [
  { label: 'OFSAYT TESPİTİ', value: 'POZİSYON ANALİZİ', color: 'text-amber-400' },
  { label: 'PENALTI KONTROLÜ', value: 'TEMAS ALGILANDI', color: 'text-red-400' },
  { label: 'KART KARARI',      value: 'HAREKET TAKİBİ',  color: 'text-cyan-400' },
  { label: 'GOL GEÇERLİLİĞİ', value: 'REFERANS NOKTASI', color: 'text-green-400' },
];

function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute w-6 h-6 border-red-500/60';
  const styles: Record<string, string> = {
    tl: 'top-3 left-3 border-t-2 border-l-2',
    tr: 'top-3 right-3 border-t-2 border-r-2',
    bl: 'bottom-3 left-3 border-b-2 border-l-2',
    br: 'bottom-3 right-3 border-b-2 border-r-2',
  };
  return <div className={`${base} ${styles[position]}`} />;
}

export function VarAnalysisScene() {
  const [tick, setTick] = useState(0);
  const [accuracy, setAccuracy] = useState(94.7);
  const [frame, setFrame] = useState(1247);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setAccuracy(a => parseFloat((a + (Math.random() * 0.4 - 0.2)).toFixed(1)));
      setFrame(f => f + Math.floor(Math.random() * 3 + 1));
    }, 800);
    return () => clearInterval(id);
  }, []);

  const verdict = VERDICTS[tick % VERDICTS.length];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#252a35] bg-[#060a0f] relative">
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0e1015] border-b border-[#252a35]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] font-mono text-[#6b7280] ml-2 tracking-widest uppercase">
          VAR ANALİZ SİSTEMİ v2.4 — TFF PROTOKOL
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-[10px] font-mono text-green-400">AKTİF</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left data panel */}
        <div className="lg:w-48 shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-[#252a35] space-y-4 font-mono text-[11px]">
          <div>
            <p className="text-[#6b7280] uppercase tracking-widest mb-1">Doğruluk</p>
            <p className="text-green-400 text-2xl font-black">%{accuracy}</p>
          </div>
          <div>
            <p className="text-[#6b7280] uppercase tracking-widest mb-1">Kare</p>
            <p className="text-white font-bold">{frame.toLocaleString('tr')}</p>
          </div>
          <div>
            <p className="text-[#6b7280] uppercase tracking-widest mb-1">Analiz</p>
            <p className={`font-bold ${verdict.color}`}>{verdict.label}</p>
            <p className="text-[#6b7280] text-[10px] mt-0.5">{verdict.value}</p>
          </div>
          <div>
            <p className="text-[#6b7280] uppercase tracking-widest mb-1">PIV Hesabı</p>
            <p className="text-red-400 font-black text-lg">+2.00</p>
          </div>
          <div className="space-y-1 pt-2 border-t border-[#252a35]">
            {['KAM 1', 'KAM 2', 'KAM 3', 'KAM 4'].map((cam, i) => (
              <div key={cam} className="flex items-center justify-between">
                <span className="text-[#6b7280]">{cam}</span>
                <span className={`text-[10px] font-bold ${i === 1 ? 'text-green-400' : 'text-[#6b7280]'}`}>
                  {i === 1 ? 'AKTİF' : 'BEKLEME'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center — Spline 3D scene */}
        <div className="relative flex-1 h-[360px] lg:h-[480px]">
          {/* Corner brackets */}
          {(['tl', 'tr', 'bl', 'br'] as const).map(p => <CornerBracket key={p} position={p} />)}

          {/* Scan line sweep */}
          <div
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent pointer-events-none z-10"
            style={{
              top: `${(tick * 13) % 100}%`,
              transition: 'top 0.8s linear',
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(229,62,62,0.04) 1px, transparent 1px),
                linear-gradient(to right, rgba(229,62,62,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Targeting reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-red-500/60 animate-pulse" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-24 h-px bg-red-500/20 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 h-24 w-px bg-red-500/20 -translate-x-1/2 -translate-y-full" />
          </div>

          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />

          {/* Bottom status bar */}
          <div className="absolute bottom-0 inset-x-0 px-4 py-2 bg-[#060a0f]/80 backdrop-blur-sm border-t border-[#252a35] flex items-center justify-between z-10">
            <span className="text-[10px] font-mono text-[#6b7280]">
              KLİP ANALİZİ — {new Date().toLocaleTimeString('tr-TR')}
            </span>
            <span className={`text-[10px] font-mono font-bold ${verdict.color} animate-pulse`}>
              ● {verdict.label}
            </span>
          </div>
        </div>

        {/* Right data panel */}
        <div className="lg:w-44 shrink-0 p-4 border-t lg:border-t-0 lg:border-l border-[#252a35] font-mono text-[11px] space-y-3">
          <p className="text-[#6b7280] uppercase tracking-widest">Son Kararlar</p>
          {[
            { match: 'GS - BJK',  min: "73'", status: 'HATALI',  piv: '+2.0', color: 'text-red-400' },
            { match: 'FB - TS',   min: "88'", status: 'DOĞRU',   piv: '0.0',  color: 'text-green-400' },
            { match: 'ALA - ANT', min: "45'", status: 'HATALI',  piv: '+1.5', color: 'text-red-400' },
            { match: 'TBB - SİV', min: "90'", status: 'HATALI',  piv: '+3.0', color: 'text-red-400' },
            { match: 'KAS - BEŞ', min: "61'", status: 'DOĞRU',   piv: '0.0',  color: 'text-green-400' },
          ].map((item, i) => (
            <div key={i} className="border-b border-[#252a35]/50 pb-2">
              <div className="flex justify-between">
                <span className="text-white font-bold">{item.match}</span>
                <span className="text-[#6b7280]">{item.min}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className={`font-bold ${item.color}`}>{item.status}</span>
                <span className={item.piv !== '0.0' ? 'text-red-400' : 'text-[#6b7280]'}>{item.piv}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
