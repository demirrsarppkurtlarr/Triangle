export type Locale = "tr" | "en";

export const DEFAULT_LOCALE: Locale = "tr";

export const LOCALE_COOKIE = "tb_locale";

export type Dictionary = {
  nav: {
    home: string;
    shop: string;
    inventory: string;
    market: string;
    marketplace: string;
    portfolio: string;
    send: string;
    profile: string;
    admin: string;
    notifications: string;
    alerts: string;
    bag: string;
    trade: string;
    rewards: string;
    leaderboard: string;
    news: string;
    settings: string;
  };
  common: {
    signOut: string;
    loading: string;
    save: string;
    cancel: string;
    success: string;
    error: string;
    back: string;
    virtualOnly: string;
    gameCash: string;
    viewAll: string;
    you: string;
  };
  rewards: {
    title: string;
    description: string;
    claim: string;
    claimed: string;
    streak: string;
    nextAmount: string;
    day: string;
    alreadyClaimed: string;
    claimSuccess: string;
    tip: string;
  };
  leaderboard: {
    title: string;
    description: string;
    rank: string;
    player: string;
    cash: string;
    portfolio: string;
    inventory: string;
    netWorth: string;
    empty: string;
    yourRank: string;
  };
  news: {
    title: string;
    description: string;
    apply: string;
    applied: string;
    bullish: string;
    bearish: string;
    neutral: string;
    impact: string;
    empty: string;
    symbols: string;
  };
  transfer: {
    title: string;
    description: string;
    recipient: string;
    amount: string;
    note: string;
    send: string;
    sending: string;
    quickContacts: string;
    noContacts: string;
    available: string;
    frozen: string;
    searchPlaceholder: string;
    manualPlaceholder: string;
  };
  inventory: {
    title: string;
    description: string;
    showcase: string;
    showcaseHint: string;
    equip: string;
    unequip: string;
    equipped: string;
    empty: string;
    sellShop: string;
    listMarket: string;
    garage: string;
    home: string;
    desk: string;
    display: string;
  };
  settings: {
    title: string;
    description: string;
    appearance: string;
    language: string;
    languageHint: string;
    notifications: string;
    emailNotifs: string;
    transferNotifs: string;
    marketNotifs: string;
    simulation: string;
    simulationBody: string;
    light: string;
    dark: string;
    system: string;
    saved: string;
    turkish: string;
    english: string;
  };
  admin: {
    overview: string;
    users: string;
    transfers: string;
    limits: string;
    logs: string;
    economy: string;
    economyTitle: string;
    economyDesc: string;
    dailyBase: string;
    streakBonus: string;
    shopEnabled: string;
    marketplaceEnabled: string;
    tradingEnabled: string;
    createNews: string;
    newsSlug: string;
    newsTitleEn: string;
    newsTitleTr: string;
    impact: string;
    symbolsCsv: string;
    toggleItems: string;
    active: string;
    inactive: string;
    saveSetting: string;
    publishNews: string;
  };
  dashboard: {
    welcome: string;
    subtitle: string;
    gameStart: string;
    gameStartBody: string;
    findPeople: string;
    findPeopleBody: string;
    claimReward: string;
    openLeaderboard: string;
    openNews: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  tr: {
    nav: {
      home: "Ana sayfa",
      shop: "Mağaza",
      inventory: "Envanter",
      market: "Piyasa",
      marketplace: "Pazar",
      portfolio: "Portföy",
      send: "Gönder",
      profile: "Profil",
      admin: "Yönetim",
      notifications: "Bildirimler",
      alerts: "Uyarılar",
      bag: "Çanta",
      trade: "Takas",
      rewards: "Ödül",
      leaderboard: "Sıralama",
      news: "Haberler",
      settings: "Ayarlar",
    },
    common: {
      signOut: "Çıkış yap",
      loading: "Yükleniyor…",
      save: "Kaydet",
      cancel: "İptal",
      success: "Başarılı",
      error: "Hata",
      back: "Geri",
      virtualOnly: "Sanal para · gerçek işlem yok",
      gameCash: "Oyun nakdi",
      viewAll: "Tümünü gör",
      you: "Sen",
    },
    rewards: {
      title: "Günlük ödül",
      description: "Her gün giriş yap, seriyi koru, oyun nakdi kazan",
      claim: "Ödülü al",
      claimed: "Bugün alındı",
      streak: "Seri",
      nextAmount: "Bugünkü ödül",
      day: "gün",
      alreadyClaimed: "Bugünkü ödülü zaten aldın",
      claimSuccess: "Günlük ödül hesabına eklendi",
      tip: "Seri kırılırsa ödül taban tutara döner. Saat dilimi: İstanbul.",
    },
    leaderboard: {
      title: "Liderlik tablosu",
      description: "Nakit + portföy + envanter değeri",
      rank: "Sıra",
      player: "Oyuncu",
      cash: "Nakit",
      portfolio: "Portföy",
      inventory: "Envanter",
      netWorth: "Net değer",
      empty: "Henüz sıralama yok",
      yourRank: "Senin sıran",
    },
    news: {
      title: "Piyasa haberleri",
      description: "Simüle edilmiş olaylar fiyatları hareket ettirir",
      apply: "Etkileri uygula",
      applied: "Haber etkileri fiyatlara yansıtıldı",
      bullish: "Yükseliş",
      bearish: "Düşüş",
      neutral: "Nötr",
      impact: "Etki",
      empty: "Aktif haber yok",
      symbols: "Hisseler",
    },
    transfer: {
      title: "Para gönder",
      description: "Triangle ID ile anında sanal transfer",
      recipient: "Alıcı",
      amount: "Tutar (USD)",
      note: "Not (isteğe bağlı)",
      send: "Gönder",
      sending: "Gönderiliyor…",
      quickContacts: "Hızlı kişiler",
      noContacts: "Henüz hızlı kişi yok — bir transfer yapınca burada görünür",
      available: "Kullanılabilir bakiye",
      frozen: "Hesabın dondurulmuş",
      searchPlaceholder: "Triangle ID veya kullanıcı adı ara",
      manualPlaceholder: "Veya Triangle ID gir",
    },
    inventory: {
      title: "Envanter",
      description: "Mağazaya geri sat, pazarda listele veya vitrine koy",
      showcase: "Vitrin",
      showcaseHint: "Profilinde gösterilecek araç, ev, gadget ve koleksiyon",
      equip: "Vitrine koy",
      unequip: "Vitrinden kaldır",
      equipped: "Vitrinde",
      empty: "Envanter boş. Mağazadan araç, ev ve gadget al.",
      sellShop: "Mağazaya sat",
      listMarket: "Pazarda listele",
      garage: "Garaj",
      home: "Ev",
      desk: "Masa",
      display: "Teşhir",
    },
    settings: {
      title: "Ayarlar",
      description: "Dil, görünüm ve bildirim tercihleri",
      appearance: "Görünüm",
      language: "Dil",
      languageHint: "Arayüz dili (Türkçe / English)",
      notifications: "Bildirimler",
      emailNotifs: "E-posta bildirimleri",
      transferNotifs: "Transfer bildirimleri",
      marketNotifs: "Piyasa bildirimleri",
      simulation: "Simülasyon uyarısı",
      simulationBody:
        "TriangleBank yalnızca sanal para kullanır. Gerçek finansal işlem yapılmaz.",
      light: "Açık",
      dark: "Koyu",
      system: "Sistem",
      saved: "Ayarlar kaydedildi",
      turkish: "Türkçe",
      english: "English",
    },
    admin: {
      overview: "Özet",
      users: "Kullanıcılar",
      transfers: "Transferler",
      limits: "Limitler",
      logs: "Kayıtlar",
      economy: "Ekonomi",
      economyTitle: "Ekonomi araçları",
      economyDesc: "Günlük ödül, mağaza ve piyasa haberleri",
      dailyBase: "Günlük ödül tabanı",
      streakBonus: "Seri bonusu",
      shopEnabled: "Mağaza açık",
      marketplaceEnabled: "Pazar açık",
      tradingEnabled: "Hisse işlemi açık",
      createNews: "Haber oluştur",
      newsSlug: "Slug",
      newsTitleEn: "Başlık (EN)",
      newsTitleTr: "Başlık (TR)",
      impact: "Etki %",
      symbolsCsv: "Semboller (virgülle)",
      toggleItems: "Mağaza ürünleri",
      active: "Aktif",
      inactive: "Pasif",
      saveSetting: "Ayarı kaydet",
      publishNews: "Haberi yayınla",
    },
    dashboard: {
      welcome: "Tekrar hoş geldin",
      subtitle: "Oyun nakdi · hisseler · mağaza · oyuncu pazarı",
      gameStart: "Oyuna başla",
      gameStartBody:
        "Yeni hesaplar $1000 oyun nakdi ile başlar. Hisse al veya mağazada harca.",
      findPeople: "Kişi bul",
      findPeopleBody: "Para göndermeden önce Triangle ID veya kullanıcı adı ara.",
      claimReward: "Günlük ödülü al",
      openLeaderboard: "Sıralamayı gör",
      openNews: "Piyasa haberleri",
    },
  },
  en: {
    nav: {
      home: "Home",
      shop: "Shop",
      inventory: "Inventory",
      market: "Market",
      marketplace: "Marketplace",
      portfolio: "Portfolio",
      send: "Send",
      profile: "Profile",
      admin: "Admin",
      notifications: "Notifications",
      alerts: "Alerts",
      bag: "Bag",
      trade: "Trade",
      rewards: "Rewards",
      leaderboard: "Ranks",
      news: "News",
      settings: "Settings",
    },
    common: {
      signOut: "Sign out",
      loading: "Loading…",
      save: "Save",
      cancel: "Cancel",
      success: "Success",
      error: "Error",
      back: "Back",
      virtualOnly: "Virtual money · no real transactions",
      gameCash: "Game cash",
      viewAll: "View all",
      you: "You",
    },
    rewards: {
      title: "Daily reward",
      description: "Check in every day, keep your streak, earn game cash",
      claim: "Claim reward",
      claimed: "Claimed today",
      streak: "Streak",
      nextAmount: "Today's reward",
      day: "day",
      alreadyClaimed: "You already claimed today's reward",
      claimSuccess: "Daily reward added to your balance",
      tip: "If the streak breaks, reward returns to base. Timezone: Istanbul.",
    },
    leaderboard: {
      title: "Leaderboard",
      description: "Cash + portfolio + inventory value",
      rank: "Rank",
      player: "Player",
      cash: "Cash",
      portfolio: "Portfolio",
      inventory: "Inventory",
      netWorth: "Net worth",
      empty: "No rankings yet",
      yourRank: "Your rank",
    },
    news: {
      title: "Market news",
      description: "Simulated events move prices",
      apply: "Apply effects",
      applied: "News impact applied to prices",
      bullish: "Bullish",
      bearish: "Bearish",
      neutral: "Neutral",
      impact: "Impact",
      empty: "No active news",
      symbols: "Symbols",
    },
    transfer: {
      title: "Send money",
      description: "Instant virtual transfers with Triangle ID",
      recipient: "Recipient",
      amount: "Amount (USD)",
      note: "Note (optional)",
      send: "Send",
      sending: "Sending…",
      quickContacts: "Quick contacts",
      noContacts: "No quick contacts yet — send a transfer and they appear here",
      available: "Available balance",
      frozen: "Your account is frozen",
      searchPlaceholder: "Search by Triangle ID or username",
      manualPlaceholder: "Or enter Triangle ID manually",
    },
    inventory: {
      title: "Inventory",
      description: "Sell back, list on market, or showcase items",
      showcase: "Showcase",
      showcaseHint: "Vehicle, home, gadget and collectible shown on your profile",
      equip: "Put on showcase",
      unequip: "Remove from showcase",
      equipped: "Showcased",
      empty: "Empty inventory. Visit the shop for cars, homes, and gadgets.",
      sellShop: "Sell to shop",
      listMarket: "List on marketplace",
      garage: "Garage",
      home: "Home",
      desk: "Desk",
      display: "Display",
    },
    settings: {
      title: "Settings",
      description: "Language, appearance, and notification preferences",
      appearance: "Appearance",
      language: "Language",
      languageHint: "Interface language (Turkish / English)",
      notifications: "Notifications",
      emailNotifs: "Email notifications",
      transferNotifs: "Transfer notifications",
      marketNotifs: "Market notifications",
      simulation: "Simulation notice",
      simulationBody:
        "TriangleBank uses virtual money only. No real financial transactions occur.",
      light: "Light",
      dark: "Dark",
      system: "System",
      saved: "Settings saved",
      turkish: "Türkçe",
      english: "English",
    },
    admin: {
      overview: "Overview",
      users: "Users",
      transfers: "Transfers",
      limits: "Limits",
      logs: "Logs",
      economy: "Economy",
      economyTitle: "Economy tools",
      economyDesc: "Daily reward, shop toggles, and market news",
      dailyBase: "Daily reward base",
      streakBonus: "Streak bonus",
      shopEnabled: "Shop enabled",
      marketplaceEnabled: "Marketplace enabled",
      tradingEnabled: "Stock trading enabled",
      createNews: "Create news",
      newsSlug: "Slug",
      newsTitleEn: "Title (EN)",
      newsTitleTr: "Title (TR)",
      impact: "Impact %",
      symbolsCsv: "Symbols (comma-separated)",
      toggleItems: "Shop items",
      active: "Active",
      inactive: "Inactive",
      saveSetting: "Save setting",
      publishNews: "Publish news",
    },
    dashboard: {
      welcome: "Welcome back",
      subtitle: "Game cash · stocks · shop · player marketplace",
      gameStart: "Game start",
      gameStartBody:
        "New accounts begin with $1000 game cash. Trade stocks or spend in the shop.",
      findPeople: "Find people",
      findPeopleBody: "Search by Triangle ID or username before sending money.",
      claimReward: "Claim daily reward",
      openLeaderboard: "View leaderboard",
      openNews: "Market news",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.tr;
}
