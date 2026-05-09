'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

const PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=480&auto=format&fit=crop&q=80', alt: 'Stadyum', rotate: -8,  x: 0,    y: 0   },
  { src: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=480&auto=format&fit=crop&q=80', alt: 'Saha',    rotate: 5,   x: 20,   y: -15 },
  { src: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=480&auto=format&fit=crop&q=80', alt: 'Taraftar',rotate: -3,  x: -25,  y: 10  },
  { src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=480&auto=format&fit=crop&q=80', alt: 'Oyuncu', rotate: 11,  x: 15,   y: 20  },
  { src: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=480&auto=format&fit=crop&q=80', alt: 'Top',    rotate: -14, x: -10,  y: -20 },
  { src: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=480&auto=format&fit=crop&q=80', alt: 'Maç',    rotate: 7,   x: 30,   y: 5   },
  { src: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=480&auto=format&fit=crop&q=80', alt: 'Gece',   rotate: -5,  x: -20,  y: 15  },
  { src: 'https://images.unsplash.com/photo-1551958219-acbc595d6821?w=480&auto=format&fit=crop&q=80', alt: 'Aksiyon',rotate: 12,  x: 5,    y: -10 },
];

export function PhotoPile() {
  const [topIdx, setTopIdx] = useState<number | null>(null);

  return (
    <div className="relative w-full flex flex-col items-center py-20 overflow-hidden bg-[#0e1015]">
      <p className="text-[#6b7280] text-xs uppercase tracking-widest mb-3 font-semibold">Süper Lig</p>
      <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-16">
        Türkiye&apos;nin En Çok<br />
        <span className="text-red-500">Konuşulan</span> Maçları
      </h2>

      {/* Pile */}
      <div className="relative w-[320px] h-[240px] md:w-[420px] md:h-[300px]">
        {PHOTOS.map((photo, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 cursor-pointer rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl"
            style={{
              rotate: photo.rotate,
              x: photo.x,
              y: photo.y,
              zIndex: topIdx === i ? 50 : i,
            }}
            whileHover={{ scale: 1.08, rotate: 0, x: 0, y: -20, zIndex: 50 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onHoverStart={() => setTopIdx(i)}
            onHoverEnd={() => setTopIdx(null)}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-4 text-white text-xs font-semibold tracking-wide opacity-80">
              {photo.alt}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="mt-20 text-[#6b7280] text-sm">Üzerine gelince fotoğrafı gör</p>
    </div>
  );
}
