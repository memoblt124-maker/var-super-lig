export type IFABRule = { title: string; law: string; text: string; criteria: string[] };

export const IFAB_RULES: Record<string, IFABRule> = {
  // ─── Cards ───────────────────────────────────────────────────────────────
  wrong_red_card: {
    title: "Hatalı Kırmızı Kart — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Kırmızı kart yalnızca ağır faul, şiddet hareketi, ısırma/tükürme, kasıtlı el ile gol engelleme, DOGSO veya hakaret içeren dil/jest durumlarında verilir. Bu koşullar oluşmadan verilen kırmızı kart hatadır.",
    criteria: [
      "Ağır faul olmayan müdahaleye kırmızı kart",
      "Normal bir oyun eylemi kırmızı kart olarak değerlendirilmesi",
      "Topu oynamaya çalışırken gerçekleşen müdahaleye DOGSO uygulanması",
      "Hakem ile kazara temas — kasıt aranmadan kırmızı kart",
    ],
  },
  missed_red_card: {
    title: "Verilmesi Gereken Kırmızı Kart — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Ağır faul, şiddet hareketi veya DOGSO gibi durumlar kırmızı kartı zorunlu kılar. Hakemin bu durumu görmezden gelmesi veya yalnızca sarı kart vermesi kurallara aykırıdır.",
    criteria: [
      "Aşırı güç veya vahşet içeren ağır faul",
      "Şiddet hareketi — top oyunda değilken",
      "Kasıtlı el ile net gol pozisyonunu engelleme",
      "Gol önleme amacıyla yapılan faul (DOGSO)",
      "Hakaret edici dil veya ırkçı davranış",
    ],
  },
  wrong_yellow_card: {
    title: "Hatalı Sarı Kart — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Sarı kart; saygısız davranış, ısrarcı ihlal, oyunu geciktirme, mesafeye uymama veya izinsiz alana giriş için verilir. Bu nedenler olmaksızın verilen sarı kart hatadır.",
    criteria: [
      "Normal tebrik veya jest sarı kart olarak değerlendirilmesi",
      "Rakibin koluna çarpan kolun kasıtlı el sayılması",
      "Hakem ile normal konuşmanın saygısız kabul edilmesi",
      "Pozisyon almak için gerçekleştirilen normal koşunun provokasyon sayılması",
    ],
  },
  missed_yellow_card: {
    title: "Verilmesi Gereken Sarı Kart — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Belirli davranışlar sarı kartı zorunlu kılar. Hakemin görmezden gelmesi tutarsız yönetim anlamına gelir.",
    criteria: [
      "Sürekli kural ihlali — hakem uyarısına rağmen devam",
      "Kural ihlali ile durdurulan serbest vuruşta mesafeye uymama",
      "Oyunu geciktirme — bilerek uzun süre bekletme",
      "Çığlık veya el hareketleriyle hakem kararına itiraz",
      "Pozisyona girerken izinsiz alana giriş",
    ],
  },
  double_yellow_missed: {
    title: "İkinci Sarı Kart Kaçırıldı — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Sarı kart alan oyuncu aynı maçta ikinci sarı kartı hak eden bir eylem gerçekleştirirse oyundan çıkarılmalıdır. Hakemin bunu kaçırması büyük bir hatadır.",
    criteria: [
      "Zaten sarı kartlı oyuncu tekrar uyarılabilir faul yapması",
      "İkinci simülasyon — ilki için sarı kart verilmişti",
      "Oyun bittikten sonra ya da uzakta gerçekleşen ikinci ihlal kaçırılması",
    ],
  },

  // ─── Goals ───────────────────────────────────────────────────────────────
  disallowed_goal_offside: {
    title: "Ofsayt Nedeniyle İptal Edilen Gol — Kural 11",
    law: "IFAB Oyun Kuralları — Kural 11",
    text: "Bir oyuncu ofsayt konumunda topu alırsa gol iptal edilir. Ancak ofsayt yalnızca pas anında değil, oyuna doğrudan müdahil olma anında değerlendirilir. Yanlış ofsayt kararı geçerli bir golü iptal eder.",
    criteria: [
      "Son savunmacıdan önce konumlanma — pas anındaki pozisyon belirleyicidir",
      "El veya kol ofsaytı ölçmez — yalnızca kol altı sayılır",
      "Kazara top değmesi ofsayt oluşturmaz",
      "VAR çizgisinin yanlış çizilmesi veya vücut parçasının hatalı referans alınması",
    ],
  },
  disallowed_goal_handball: {
    title: "El Nedeniyle İptal Edilen Gol — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Golü atan veya pozisyonu yaratan oyuncunun topu eli veya komuyla oynaması golü iptal eder. Ancak elin doğal pozisyonda olması ya da kazara temas çoğunlukla ihlal sayılmaz.",
    criteria: [
      "Topu atan oyuncunun eli kasıtlı olarak topa değmesi",
      "Pozisyon yaratılırken el oynanması — golcü farklı oyuncu olsa bile",
      "Kolun doğal pozisyonun dışında olması şartı",
      "Vücuttan sekme sonrası kola gelen top — çoğunlukla ihlal sayılmaz",
    ],
  },
  disallowed_goal_foul: {
    title: "Faul Nedeniyle İptal Edilen Gol — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Gol öncesinde hücum oyuncusunun faul yapması — özellikle kaleciye veya savunmacıya — golü geçersiz kılar. Ancak normal omuz teması çoğunlukla faul değildir.",
    criteria: [
      "Kalecinin hareketini engelleyen hücum faulu",
      "Gol anı veya hemen öncesinde rakibe itme",
      "Savunmacıyı devre dışı bırakan müdahale",
      "Normal omuz teması — VAR tarafından hatalı faul sayılması",
    ],
  },
  allowed_goal_offside: {
    title: "Ofsayta Rağmen Geçerli Sayılan Gol — Kural 11",
    law: "IFAB Oyun Kuralları — Kural 11",
    text: "Ofsayt konumundaki oyuncunun attığı gol geçerli sayılırsa bu açık bir kural ihlalidir.",
    criteria: [
      "VAR çizgisi yanlış çizildi veya gözden geçirilmedi",
      "Pas anındaki pozisyon hatalı değerlendirildi",
      "Ofsayt hareketi fark edilmedi",
    ],
  },
  allowed_goal_handball: {
    title: "El Var Ama Gol Geçerli Sayıldı — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Pozisyon sırasında el oynanmasına rağmen golün verilmesi açık bir hatadır.",
    criteria: [
      "VAR incelemesi yapılmadı",
      "Elin kasıtlı olmadığına hatalı karar verildi",
      "Pozisyonu yaratan elin gözden kaçırılması",
    ],
  },

  // ─── Penalty ─────────────────────────────────────────────────────────────
  wrong_penalty_given: {
    title: "Olmayan Penaltı — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Ceza sahasında gerçekleşmeyen veya kural ihlali niteliği taşımayan bir müdahaleye penaltı verilmesi hatadır.",
    criteria: [
      "Temas ceza sahası dışında gerçekleşti",
      "Oyuncu topu oynarken müdahale — faul değil",
      "Simülasyon veya abartılı yere düşme penaltı kararı verdi",
      "Doğal pozisyondaki ele isabet eden top penaltı sayıldı",
      "Hafif temas olmayan penaltı kararı",
    ],
  },
  missed_penalty: {
    title: "Verilmesi Gereken Penaltı — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Ceza sahası içinde yaşanan kural ihlalinin penaltı olarak değerlendirilmemesi hatadır.",
    criteria: [
      "Ceza sahası içinde rakibi itme veya tutma",
      "Ceza sahasında kasıtlı el",
      "Kalecinin hücum oyuncusunu ceza sahası içinde durdurması",
      "Ceza sahasında gerçekleşen ağır faul penaltı verilmemesi",
    ],
  },

  // ─── Foul ────────────────────────────────────────────────────────────────
  wrong_foul: {
    title: "Hatalı Faul Kararı — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Topu oynayan veya normal müdahalede bulunan oyuncuya faul verilmesi hatadır.",
    criteria: [
      "İki oyuncu aynı anda topa gitti — haklı müdahale",
      "Omuzdan omza meşru mücadele faul sayıldı",
      "Savunma oyuncusu topu önce oynadı, ardından temas oldu",
      "Hücum oyuncusunun geriye düşme hareketi faul olarak değerlendirildi",
    ],
  },
  missed_foul: {
    title: "Kaçırılan Faul — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Açık kural ihlallerinin faul olarak değerlendirilmemesi tutarsız yönetimdir.",
    criteria: [
      "Rakibi itmek veya tutmak görmezden gelindi",
      "Rakibin bacağına gelen müdahale fark edilmedi",
      "Kale topu sonrası üstün tarafa serbest vuruş verilmedi",
    ],
  },
  simulation_unpunished: {
    title: "Cezasız Kalan Simülasyon — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Temas olmaksızın yere düşme veya abartılı düşme sarı kartı gerektirir. Ceza verilmemesi kural ihlalidir.",
    criteria: [
      "Temas yokken yere düşme ve faul talep etme",
      "Çok hafif temasa karşın dramatik yere düşme",
      "Nötr konumda rakibi faule zorlamak için pozisyon alma",
    ],
  },
  simulation_wrongly_punished: {
    title: "Hatalı Simülasyon Cezası — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Gerçek temas sonucu yere düşen oyuncuya simülasyon kartı verilmesi hatadır.",
    criteria: [
      "Gerçek temas vardı ama hakem simülasyon gördü",
      "Oyuncu abartmış olabilir ancak temas gerçekti",
      "Ağrı tepkisi sakinleşme hareketi olarak yanlış yorumlandı",
    ],
  },

  // ─── Offside ─────────────────────────────────────────────────────────────
  wrong_offside: {
    title: "Hatalı Ofsayt Kararı — Kural 11",
    law: "IFAB Oyun Kuralları — Kural 11",
    text: "Ofsayt konumunda olmayan oyuncuya ofsayt kararı verilmesi geçerli bir atağı durdurur.",
    criteria: [
      "Çizgi yanlış çizildi — oyuncu aslında hizalıydı",
      "Pas anındaki konumun yanlış tespit edilmesi",
      "Savunma oyuncusu sanılandan daha gerideydi",
    ],
  },
  missed_offside: {
    title: "Kaçırılan Ofsayt — Kural 11",
    law: "IFAB Oyun Kuralları — Kural 11",
    text: "Ofsayt konumundaki oyuncunun ataklarına izin verilmesi hatadır.",
    criteria: [
      "Pas anında oyuncu açıkça ofsayt konumundaydı",
      "VAR incelemesi yapılmadı veya gözden kaçtı",
      "Hakem yardımcısı bayrağı kaldırmadı",
    ],
  },

  // ─── Conduct ─────────────────────────────────────────────────────────────
  wrong_conduct_call: {
    title: "Hatalı Davranış Cezası — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Kazara veya kas yansıması olan bir harekete davranış cezası uygulanması hatadır.",
    criteria: [
      "Hakem ile kazara temas — kasıt yok",
      "Geri yürüyüş sırasında hakeme istemeden değme",
      "Sevinç kutlaması sırasında gerçekleşen kaza",
      "Normal itiraz hareketi hakaret olarak yorumlanması",
    ],
  },
  missed_conduct_call: {
    title: "Cezasız Kalan Davranış — Kural 12",
    law: "IFAB Oyun Kuralları — Kural 12",
    text: "Hakeme veya rakibe kasıtlı davranış ihlalinin görmezden gelinmesi tutarsız yönetimdir.",
    criteria: [
      "Hakeme yönelik kasıtlı temas",
      "Hakaret içeren jest veya söz cezasız bırakıldı",
      "Kural dışı kutlama (forma çıkarma, seyirciye gitme) görmezden gelindi",
    ],
  },
};
