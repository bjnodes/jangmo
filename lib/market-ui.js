export const BRAND = "장터모아";
export const RECENT_KEY = "jangteomoa-web.recent-searches";
export const PAGE_SIZES = [25, 50, 100];

export const PROVIDERS = {
  daangn: "당근마켓",
  joongna: "중고나라",
  bunjang: "번개장터",
};

export const PROVIDER_LINKS = {
  daangn: "https://www.daangn.com/kr/",
  joongna: "https://web.joongna.com/product/form?type=regist",
  bunjang: "https://m.bunjang.co.kr/products/new",
};

export const PROVIDER_ACCENTS = {
  daangn: "#ff6f0f",
  joongna: "#2f80ed",
  bunjang: "#ef466f",
};

export const SELL_PRESETS = [
  {
    id: "bike",
    label: "자전거",
    common: "스포츠 / 자전거",
    map: { daangn: "스포츠", joongna: "스포츠", bunjang: "자전거" },
  },
  {
    id: "phone",
    label: "아이폰",
    common: "디지털기기 / 휴대폰",
    map: { daangn: "디지털기기", joongna: "휴대폰", bunjang: "휴대폰" },
  },
  {
    id: "laptop",
    label: "노트북",
    common: "디지털기기 / 노트북",
    map: { daangn: "디지털기기", joongna: "노트북", bunjang: "노트북" },
  },
  {
    id: "fashion",
    label: "패션",
    common: "패션 / 의류",
    map: { daangn: "패션", joongna: "의류", bunjang: "패션" },
  },
];

export function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function priceToNumber(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function formatPrice(value) {
  const numeric = priceToNumber(value);
  return numeric ? `${numeric.toLocaleString("ko-KR")}원` : "가격 정보 없음";
}

export function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export function buildSearchParams(values) {
  const params = new URLSearchParams();
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) {
      return;
    }
    params.set(key, String(value));
  });
  return params.toString();
}

export function readRecentSearches() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(saved) ? saved.map(cleanText).filter(Boolean).slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query) {
  if (typeof window === "undefined") {
    return [];
  }

  const normalized = cleanText(query);
  if (!normalized) {
    return readRecentSearches();
  }

  const next = [normalized, ...readRecentSearches().filter((item) => item !== normalized)].slice(0, 10);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
