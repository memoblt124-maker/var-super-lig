'use client';

import { useEffect } from 'react';
import ScrollExpandMedia from '@/components/blocks/scroll-expansion-hero';

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=wNl0Jbomm_g';
const BG_IMAGE = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1920&auto=format&fit=crop&q=80';

function MatchContent() {
  return (
    <div className="max-w-4xl mx-auto text-white">
      <h2 className="text-3xl font-bold mb-6">VAR Kararları</h2>
      <p className="text-lg text-white/70 mb-6 leading-relaxed">
        Türk futbolundaki tartışmalı VAR kararlarını takip edin. Her karar için
        hakem paneli ve taraftar oylamasıyla oluşturulan adalet puanlarını görüntüleyin.
      </p>
      <p className="text-lg text-white/70 leading-relaxed">
        PIV (Puan Etki Değeri) sistemi ile her hatalı kararın tabloya etkisini
        hesaplıyor ve &ldquo;Adalet Tablosu&rdquo;nu güncelliyoruz.
      </p>
    </div>
  );
}

export function ScrollHeroDemo() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1015]">
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc={YOUTUBE_URL}
        bgImageSrc={BG_IMAGE}
        title="VAR Adaleti"
        date="2024-25 Sezonu"
        scrollToExpand="Genişletmek için kaydırın"
        textBlend
      >
        <MatchContent />
      </ScrollExpandMedia>
    </div>
  );
}

export default ScrollHeroDemo;
