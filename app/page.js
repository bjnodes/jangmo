"use client";

import { useEffect, useRef, useState } from "react";

const BRAND_NAME = "\uC7A5\uD130\uBAA8\uC544";
const RECENT_SEARCHES_KEY = "jangteomoa-web.recent-searches";
const MAX_RECENT_SEARCHES = 10;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const CATEGORY_PRESETS = [
  { id: "bike", label: "\uC790\uC804\uAC70", common: "\uC2A4\uD3EC\uCE20 / \uC790\uC804\uAC70", map: { daangn: "\uC2A4\uD3EC\uCE20", joongna: "\uC2A4\uD3EC\uCE20", bunjang: "\uC790\uC804\uAC70" } },
  { id: "phone", label: "\uD734\uB300\uD3F0", common: "\uB514\uC9C0\uD138 / \uD734\uB300\uD3F0", map: { daangn: "\uB514\uC9C0\uD138", joongna: "\uD734\uB300\uD3F0", bunjang: "\uD734\uB300\uD3F0" } },
  { id: "laptop", label: "\uB178\uD2B8\uBD81", common: "\uB514\uC9C0\uD138 / \uB178\uD2B8\uBD81", map: { daangn: "\uB514\uC9C0\uD138", joongna: "\uB178\uD2B8\uBD81", bunjang: "\uB178\uD2B8\uBD81" } },
  { id: "camera", label: "\uCE74\uBA54\uB77C", common: "\uB514\uC9C0\uD138 / \uCE74\uBA54\uB77C", map: { daangn: "\uB514\uC9C0\uD138", joongna: "\uCE74\uBA54\uB77C", bunjang: "\uCE74\uBA54\uB77C" } },
  { id: "game", label: "\uAC8C\uC784", common: "\uCD94\uBBF8 / \uAC8C\uC784", map: { daangn: "\uCD94\uBBF8", joongna: "\uAC8C\uC784", bunjang: "\uAC8C\uC784" } },
  { id: "fashion", label: "\uD328\uC158", common: "\uD328\uC158 / \uC758\uB958", map: { daangn: "\uD328\uC158", joongna: "\uC758\uB958", bunjang: "\uD328\uC158" } },
];

const PLATFORM_LABELS = {
  daangn: "\uB2F9\uADFC\uB9C8\uCF13",
  joongna: "\uC911\uACE0\uB098\uB77C",
  bunjang: "\uBC88\uAC1C\uC7A5\uD130",
};

const PLATFORM_LINKS = {
  daangn: "https://www.daangn.com/kr/",
  joongna: "https://web.joongna.com/product/form?type=regist",
  bunjang: "https://m.bunjang.co.kr/products/new",
};

const PLATFORM_ACCENTS = {
  daangn: "#ff6f0f",
  joongna: "#2f80ed",
  bunjang: "#ef466f",
};

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPriceNumber(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatPrice(value) {
  const amount = toPriceNumber(value);
  return amount ? `${amount.toLocaleString("ko-KR")}\uC6D0` : "\uAC00\uACA9 \uC815\uBCF4 \uC5C6\uC74C";
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function buildClipboardText(draft, platformId) {
  const category = draft.categoryMap[platformId] || draft.commonCategory;
  return [
    draft.title,
    draft.price ? `Price: ${formatPrice(draft.price)}` : "",
    category ? `Category: ${category}` : "",
    draft.region ? `Region: ${draft.region}` : "",
    draft.description ? "" : "",
    draft.description || "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("");
  const [regionInput, setRegionInput] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionSuggestions, setRegionSuggestions] = useState([]);
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState({
    providers: [],
    items: [],
    notices: [],
    searchedAt: "",
  });
  const [providerFilter, setProviderFilter] = useState({
    daangn: true,
    joongna: true,
    bunjang: true,
  });
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("latest");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sellerPreset, setSellerPreset] = useState("");
  const [sellerTitle, setSellerTitle] = useState("");
  const [sellerPrice, setSellerPrice] = useState("");
  const [sellerCommonCategory, setSellerCommonCategory] = useState("");
  const [sellerCategoryMap, setSellerCategoryMap] = useState({
    daangn: "",
    joongna: "",
    bunjang: "",
  });
  const [sellerRegion, setSellerRegion] = useState("");
  const [sellerDescription, setSellerDescription] = useState("");
  const [sellerPlatforms, setSellerPlatforms] = useState({
    daangn: true,
    joongna: true,
    bunjang: true,
  });
  const [sellerPhotos, setSellerPhotos] = useState([]);
  const [sellerPhotoUrls, setSellerPhotoUrls] = useState([]);
  const [sellerHint, setSellerHint] = useState(
    "\uCD08\uC548\uACFC \uC0AC\uC9C4\uC744 \uBA3C\uC800 \uC900\uBE44\uD55C \uB4A4, \uAC01 \uD50C\uB7AB\uD3FC \uB4F1\uB85D \uD398\uC774\uC9C0\uB97C \uC0C8 \uD0ED\uC73C\uB85C \uC5F4\uC5B4\uC8FC\uC138\uC694.",
  );
  const regionBlurTimerRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      setRecentSearches(Array.isArray(saved) ? saved.map(cleanText).filter(Boolean).slice(0, MAX_RECENT_SEARCHES) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    if (!regionInput) {
      setRegionSuggestions([]);
      setShowRegionSuggestions(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/daangn-regions?query=${encodeURIComponent(regionInput)}`, { cache: "no-store" });
        const payload = await response.json();
        setRegionSuggestions(payload.suggestions || []);
        setShowRegionSuggestions(Boolean(payload.suggestions?.length));
        setActiveSuggestionIndex(payload.suggestions?.length ? 0 : -1);
      } catch {
        setRegionSuggestions([]);
        setShowRegionSuggestions(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [regionInput]);

  useEffect(() => {
    const urls = sellerPhotos.map((file) => URL.createObjectURL(file));
    setSellerPhotoUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [sellerPhotos]);

  const filteredItems = searchResponse.items
    .filter((item) => providerFilter[item.providerId])
    .filter((item) => {
      const price = toPriceNumber(item.price);
      if (minPrice && price && price < Number(minPrice)) return false;
      if (maxPrice && price && price > Number(maxPrice)) return false;
      return true;
    })
    .sort((left, right) => {
      if (sort === "priceAsc") return (toPriceNumber(left.price) || Number.MAX_SAFE_INTEGER) - (toPriceNumber(right.price) || Number.MAX_SAFE_INTEGER);
      if (sort === "priceDesc") return (toPriceNumber(right.price) || 0) - (toPriceNumber(left.price) || 0);
      if (sort === "relevance") return (left.sourceOrder || 0) - (right.sourceOrder || 0);
      return (right.timestampMs || 0) - (left.timestampMs || 0);
    });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const sellerDraft = {
    title: cleanText(sellerTitle),
    price: cleanText(sellerPrice),
    commonCategory: cleanText(sellerCommonCategory),
    categoryMap: {
      daangn: cleanText(sellerCategoryMap.daangn || sellerCommonCategory),
      joongna: cleanText(sellerCategoryMap.joongna || sellerCommonCategory),
      bunjang: cleanText(sellerCategoryMap.bunjang || sellerCommonCategory),
    },
    region: cleanText(sellerRegion),
    description: cleanText(sellerDescription),
    platforms: Object.entries(sellerPlatforms)
      .filter(([, checked]) => checked)
      .map(([platformId]) => platformId),
  };

  async function handleSearch(searchTerm = query) {
    const normalizedQuery = cleanText(searchTerm);
    if (!normalizedQuery) return;

    setSearchLoading(true);
    setCurrentPage(1);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: normalizedQuery,
          daangnRegion: cleanText(regionInput),
          daangnRegionInValue: selectedRegion?.inValue || "",
          daangnRegionLabel: selectedRegion?.label || "",
          sort,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "\uAC80\uC0C9 \uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
      }

      setSearchResponse(payload);
      if (payload.daangnRegionResolved) {
        setSelectedRegion(payload.daangnRegionResolved);
        setRegionInput(payload.daangnRegionResolved.label || "");
      }

      setRecentSearches((current) => {
        const next = [normalizedQuery, ...current.filter((item) => item !== normalizedQuery)].slice(0, MAX_RECENT_SEARCHES);
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
        return next;
      });
    } catch (error) {
      setSearchResponse({
        providers: [],
        items: [],
        notices: [error instanceof Error ? error.message : "\uAC80\uC0C9 \uC694\uCCAD\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694."],
        searchedAt: new Date().toISOString(),
      });
    } finally {
      setSearchLoading(false);
    }
  }

  function pickRegionSuggestion(region) {
    setSelectedRegion(region);
    setRegionInput(region.label);
    setShowRegionSuggestions(false);
  }

  function handlePresetChange(presetId) {
    setSellerPreset(presetId);
    const preset = CATEGORY_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setSellerCommonCategory(preset.common);
    setSellerCategoryMap(preset.map);
  }

  async function handleCopyDraft(platformId) {
    if (!sellerDraft.title) {
      setSellerHint("\uC81C\uBAA9\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildClipboardText(sellerDraft, platformId));
      setSellerHint(`${PLATFORM_LABELS[platformId]} \uC6A9 \uCD08\uC548\uC744 \uBCF5\uC0AC\uD588\uC5B4\uC694.`);
    } catch {
      setSellerHint("\uBCF5\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");
    }
  }

  function openPlatform(platformId) {
    if (!sellerDraft.title || !sellerDraft.price || !sellerDraft.description) {
      setSellerHint("\uC81C\uBAA9, \uAC00\uACA9, \uC124\uBA85\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694.");
      return;
    }
    window.open(PLATFORM_LINKS[platformId], "_blank", "noopener,noreferrer");
  }

  return (
    <main className="web-page">
      <header className="shell-topbar">
        <div className="shell-topbar__inner">
          <div className="brand">
            <img className="brand__logo" src="/jangteomoa-logo.png" alt={`${BRAND_NAME} logo`} />
            <div>
              <strong>{BRAND_NAME}</strong>
              <span>\uC911\uACE0\uAC70\uB798 \uD1B5\uD569\uAC80\uC0C9 \uC6F9 \uC571</span>
            </div>
          </div>

          <div className="topbar-tabs">
            <button className={activeTab === "search" ? "topbar-tab topbar-tab--active" : "topbar-tab"} onClick={() => setActiveTab("search")}>
              \uAC80\uC0C9
            </button>
            <button className={activeTab === "seller" ? "topbar-tab topbar-tab--active" : "topbar-tab"} onClick={() => setActiveTab("seller")}>
              \uD310\uB9E4\uAE00 \uC791\uC131
            </button>
          </div>

          <div className="topbar-links">
            <a href="https://www.daangn.com/kr/buy-sell/s/" target="_blank" rel="noreferrer">\uB2F9\uADFC\uB9C8\uCF13</a>
            <a href="https://web.joongna.com/" target="_blank" rel="noreferrer">\uC911\uACE0\uB098\uB77C</a>
            <a href="https://m.bunjang.co.kr/" target="_blank" rel="noreferrer">\uBC88\uAC1C\uC7A5\uD130</a>
          </div>
        </div>
      </header>

      {activeTab === "search" ? (
        <section className="view">
          <div className="hero-grid">
            <article className="hero-card hero-card--primary">
              <span className="eyebrow">\uD1B5\uD569 \uAC80\uC0C9</span>
              <h1>\uB2F9\uADFC\uB9C8\uCF13, \uC911\uACE0\uB098\uB77C, \uBC88\uAC1C\uC7A5\uD130\uB97C \uD55C \uBC88\uC5D0 \uBE44\uAD50\uD574\uBCF4\uC138\uC694</h1>
              <p>\uC138 \uD50C\uB7AB\uD3FC\uC744 \uB3D9\uC2DC\uC5D0 \uAC80\uC0C9\uD558\uACE0, \uD50C\uB7AB\uD3FC\u00B7\uAC00\uACA9\uB300\u00B7\uC815\uB82C \uAE30\uC900\uC73C\uB85C \uBC14\uB85C \uAC78\uB7EC\uBCF4\uC138\uC694.</p>
            </article>

            <article className="hero-card">
              <div className="section-label">\uCD5C\uADFC \uAC80\uC0C9\uC5B4</div>
              <div className="chip-wrap">
                {recentSearches.length ? (
                  recentSearches.map((item) => (
                    <button
                      key={item}
                      className="chip"
                      onClick={() => {
                        setQuery(item);
                        handleSearch(item);
                      }}
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <div className="empty-copy">\uC544\uC9C1 \uCD5C\uADFC \uAC80\uC0C9\uC5B4\uAC00 \uC5C6\uC5B4\uC694.</div>
                )}
              </div>
            </article>
          </div>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>\uAC80\uC0C9 \uD544\uD130</h2>
                <p>\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uACE0 \uD544\uC694\uD558\uBA74 \uB2F9\uADFC \uC9C0\uC5ED\uC744 \uACE0\uB978 \uB4A4, \uAC00\uACA9\uACFC \uD50C\uB7AB\uD3FC\uB85C \uACB0\uACFC\uB97C \uC904\uC5EC\uBCF4\uC138\uC694.</p>
              </div>
              <div className="page-size">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    className={pageSize === size ? "page-size__button page-size__button--active" : "page-size__button"}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  >
                    \uD55C \uD398\uC774\uC9C0 {size}\uAC1C
                  </button>
                ))}
              </div>
            </div>

            <div className="search-grid">
              <label className="field">
                <span>\uAC80\uC0C9\uC5B4</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="\uC544\uC774\uD3F0 15, \uBE0C\uB86C\uD1A4, \uD50C\uB808\uC774\uC2A4\uD14C\uC774\uC158 5" />
              </label>

              <label className="field field--region">
                <span>\uB2F9\uADFC \uC9C0\uC5ED</span>
                <input
                  value={regionInput}
                  onChange={(event) => {
                    setRegionInput(event.target.value);
                    if (selectedRegion && cleanText(event.target.value) !== cleanText(selectedRegion.label)) {
                      setSelectedRegion(null);
                    }
                  }}
                  onFocus={() => setShowRegionSuggestions(Boolean(regionSuggestions.length))}
                  onBlur={() => {
                    regionBlurTimerRef.current = window.setTimeout(() => setShowRegionSuggestions(false), 120);
                  }}
                  onKeyDown={(event) => {
                    if (!regionSuggestions.length) return;
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveSuggestionIndex((value) => (value >= regionSuggestions.length - 1 ? 0 : value + 1));
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveSuggestionIndex((value) => (value <= 0 ? regionSuggestions.length - 1 : value - 1));
                    }
                    if (event.key === "Enter" && showRegionSuggestions) {
                      event.preventDefault();
                      const region = regionSuggestions[activeSuggestionIndex] || regionSuggestions[0];
                      if (region) pickRegionSuggestion(region);
                    }
                  }}
                  placeholder="\uD558\uC548\uB3D9, \uC131\uC218\uB3D9, \uC11C\uCD08\uB3D9"
                />

                {showRegionSuggestions && regionSuggestions.length > 0 ? (
                  <div className="suggestions">
                    {regionSuggestions.map((region, index) => (
                      <button
                        key={region.inValue}
                        className={index === activeSuggestionIndex ? "suggestion suggestion--active" : "suggestion"}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          if (regionBlurTimerRef.current) {
                            window.clearTimeout(regionBlurTimerRef.current);
                          }
                          pickRegionSuggestion(region);
                        }}
                      >
                        <strong>{region.label}</strong>
                        <span>{region.fullLabel || region.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>

              <button className="primary-button" onClick={() => handleSearch()}>
                {searchLoading ? "\uAC80\uC0C9 \uC911..." : "\uAC80\uC0C9"}
              </button>
            </div>

            <div className="filter-grid">
              <label className="field">
                <span>\uCD5C\uC18C \uAC00\uACA9</span>
                <input type="number" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setCurrentPage(1); }} placeholder="0" />
              </label>
              <label className="field">
                <span>\uCD5C\uB300 \uAC00\uACA9</span>
                <input type="number" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setCurrentPage(1); }} placeholder="\uC81C\uD55C \uC5C6\uC74C" />
              </label>
              <label className="field">
                <span>\uC815\uB82C</span>
                <select value={sort} onChange={(event) => { setSort(event.target.value); setCurrentPage(1); }}>
                  <option value="latest">\uCD5C\uC2E0\uC21C</option>
                  <option value="relevance">\uAD00\uB828\uC21C</option>
                  <option value="priceAsc">\uB0AE\uC740 \uAC00\uACA9\uC21C</option>
                  <option value="priceDesc">\uB192\uC740 \uAC00\uACA9\uC21C</option>
                </select>
              </label>
            </div>

            <div className="toolbar">
              <div className="toggle-group">
                {Object.keys(PLATFORM_LABELS).map((platformId) => (
                  <label key={platformId} className="toggle-pill">
                    <input
                      type="checkbox"
                      checked={providerFilter[platformId]}
                      onChange={(event) => {
                        setProviderFilter((current) => ({ ...current, [platformId]: event.target.checked }));
                        setCurrentPage(1);
                      }}
                    />
                    <span>{PLATFORM_LABELS[platformId]}</span>
                  </label>
                ))}
              </div>
              <div className="toolbar__status">{searchLoading ? "\uB9E4\uBB3C\uC744 \uAC00\uC838\uC624\uB294 \uC911..." : ""}</div>
            </div>
          </section>

          <section className="summary-grid">
            <article className="summary-card">
              <span>\uAC80\uC0C9 \uACB0\uACFC</span>
              <strong>{filteredItems.length}</strong>
            </article>
            <article className="summary-card">
              <span>\uD398\uC774\uC9C0</span>
              <strong>{currentPage} / {totalPages}</strong>
            </article>
            <article className="summary-card">
              <span>\uC5C5\uB370\uC774\uD2B8</span>
              <strong>{formatDate(searchResponse.searchedAt)}</strong>
            </article>
          </section>

          <section className="panel">
            <div className="provider-grid">
              {(searchResponse.providers.length
                ? searchResponse.providers
                : Object.keys(PLATFORM_LABELS).map((platformId) => ({
                    id: platformId,
                    name: PLATFORM_LABELS[platformId],
                    items: [],
                    rawCount: 0,
                    accent: PLATFORM_ACCENTS[platformId],
                  })))
                .map((provider) => (
                  <article key={provider.id || provider.name} className="provider-card">
                    <div className="provider-card__title">
                      <span className="provider-card__dot" style={{ background: provider.accent }} />
                      <strong>{provider.name}</strong>
                    </div>
                    <p>{provider.error || `${provider.items?.length || 0}\uAC1C \uD45C\uC2DC / ${provider.rawCount || 0}\uAC1C \uC218\uC9D1`}</p>
                  </article>
                ))}
            </div>
          </section>

          <section className="panel">
            <div className="notice-wrap">
              {searchResponse.notices.map((notice) => (
                <div key={notice} className="notice-pill">{notice}</div>
              ))}
            </div>

            {visibleItems.length ? (
              <div className="results-grid">
                {visibleItems.map((item) => (
                  <article key={item.url} className="result-card">
                    <div className="result-card__image-wrap">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="result-card__image-empty">\uC774\uBBF8\uC9C0 \uC5C6\uC74C</div>
                      )}
                      <span className="result-card__badge" style={{ color: item.providerAccent, background: `${item.providerAccent}18` }}>
                        {item.providerName}
                      </span>
                    </div>
                    <div className="result-card__body">
                      <strong className="result-card__price">{item.price || "\uAC00\uACA9 \uC815\uBCF4 \uC5C6\uC74C"}</strong>
                      <h3>{item.title}</h3>
                      <p>{(item.meta || []).join(" · ") || "\uC790\uC138\uD55C \uB0B4\uC6A9\uC740 \uC6D0\uBCF8 \uB9E4\uBB3C\uC5D0\uC11C \uD655\uC778\uD574\uC8FC\uC138\uC694."}</p>
                      <a className="result-card__link" href={item.url} target="_blank" rel="noreferrer">\uAC8C\uC2DC\uAE00 \uBCF4\uAE30</a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uBA74 \uC138 \uD50C\uB7AB\uD3FC \uB9E4\uBB3C\uC744 \uD55C \uBC88\uC5D0 \uBD88\uB7EC\uC640\uC694.</div>
            )}

            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>\uC774\uC804</button>
              <span>{currentPage} / {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>\uB2E4\uC74C</button>
            </div>
          </section>
        </section>
      ) : (
        <section className="view">
          <div className="seller-layout">
            <section className="panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">\uD310\uB9E4 \uC791\uC131</span>
                  <h2>\uCD08\uC548\uC744 \uD55C \uBC88 \uC791\uC131\uD558\uACE0 \uAC01 \uD50C\uB7AB\uD3FC \uB4F1\uB85D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD574\uBCF4\uC138\uC694</h2>
                  <p>\uC6F9 \uBC84\uC804\uC740 \uCD08\uC548 \uC900\uBE44, \uC0AC\uC9C4 \uBBF8\uB9AC\uBCF4\uAE30, \uCE74\uD14C\uACE0\uB9AC \uB9E4\uD551, \uACF5\uC2DD \uB4F1\uB85D \uD398\uC774\uC9C0 \uC5F0\uACB0\uC5D0 \uCD08\uC810\uC744 \uB461 \uAD6C\uC131\uC785\uB2C8\uB2E4.</p>
                </div>
                <button className="secondary-button" onClick={() => handleCopyDraft("joongna")}>\uCD08\uC548 \uBCF5\uC0AC</button>
              </div>

              <div className="seller-form">
                <div className="seller-grid seller-grid--two">
                  <label className="field">
                    <span>\uC81C\uBAA9</span>
                    <input value={sellerTitle} onChange={(event) => setSellerTitle(event.target.value)} placeholder="\uBE44\uC559\uD0A4 \uB2C8\uB85C\uB124 \uB85C\uB4DC \uC790\uC804\uAC70" />
                  </label>
                  <label className="field">
                    <span>\uAC00\uACA9</span>
                    <input type="number" value={sellerPrice} onChange={(event) => setSellerPrice(event.target.value)} placeholder="430000" />
                  </label>
                </div>

                <div className="seller-grid seller-grid--three">
                  <label className="field">
                    <span>\uCE74\uD14C\uACE0\uB9AC \uC608\uC2DC</span>
                    <select value={sellerPreset} onChange={(event) => handlePresetChange(event.target.value)}>
                      <option value="">\uC9C1\uC811 \uC785\uB825</option>
                      {CATEGORY_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>\uACF5\uD1B5 \uCE74\uD14C\uACE0\uB9AC</span>
                    <input value={sellerCommonCategory} onChange={(event) => setSellerCommonCategory(event.target.value)} placeholder="\uC2A4\uD3EC\uCE20 / \uC790\uC804\uAC70" />
                  </label>
                  <label className="field">
                    <span>\uC9C0\uC5ED</span>
                    <input value={sellerRegion} onChange={(event) => setSellerRegion(event.target.value)} placeholder="\uAD11\uBA85\uC2DC \uD558\uC548\uB3D9" />
                  </label>
                </div>

                <div className="seller-grid seller-grid--three">
                  <label className="field">
                    <span>\uB2F9\uADFC\uB9C8\uCF13 \uCE74\uD14C\uACE0\uB9AC</span>
                    <input value={sellerCategoryMap.daangn} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, daangn: event.target.value }))} placeholder="\uBE44\uC6CC\uB450\uBA74 \uACF5\uD1B5 \uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AC\uC6A9\uD574\uC694" />
                  </label>
                  <label className="field">
                    <span>\uC911\uACE0\uB098\uB77C \uCE74\uD14C\uACE0\uB9AC</span>
                    <input value={sellerCategoryMap.joongna} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, joongna: event.target.value }))} placeholder="\uBE44\uC6CC\uB450\uBA74 \uACF5\uD1B5 \uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AC\uC6A9\uD574\uC694" />
                  </label>
                  <label className="field">
                    <span>\uBC88\uAC1C\uC7A5\uD130 \uCE74\uD14C\uACE0\uB9AC</span>
                    <input value={sellerCategoryMap.bunjang} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, bunjang: event.target.value }))} placeholder="\uBE44\uC6CC\uB450\uBA74 \uACF5\uD1B5 \uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AC\uC6A9\uD574\uC694" />
                  </label>
                </div>

                <label className="field">
                  <span>\uC124\uBA85</span>
                  <textarea rows={8} value={sellerDescription} onChange={(event) => setSellerDescription(event.target.value)} placeholder="\uAD6C\uB9E4 \uC2DC\uAE30, \uC0C1\uD0DC, \uAD6C\uC131\uD488, \uAC70\uB798 \uBC29\uC2DD, \uB124\uACE0 \uC5EC\uBD80 \uB4F1\uC744 \uC801\uC5B4\uC8FC\uC138\uC694." />
                </label>

                <div className="seller-grid seller-grid--split">
                  <label className="field">
                    <span>\uC0AC\uC9C4</span>
                    <input type="file" multiple accept="image/*" onChange={(event) => setSellerPhotos([...(event.target.files || [])])} />
                    <small>{sellerPhotos.length ? `${sellerPhotos.length}\uC7A5 \uC900\uBE44\uB428` : "\uC5EC\uAE30\uC11C \uC0AC\uC9C4\uC744 \uACE0\uB978 \uB4A4 \uAC01 \uD50C\uB7AB\uD3FC \uB4F1\uB85D \uD3FC\uC5D0 \uCCA8\uBD80\uD574\uC8FC\uC138\uC694."}</small>
                  </label>

                  <div className="field">
                    <span>\uD50C\uB7AB\uD3FC</span>
                    <div className="toggle-group">
                      {Object.keys(PLATFORM_LABELS).map((platformId) => (
                        <label key={platformId} className="toggle-pill">
                          <input
                            type="checkbox"
                            checked={sellerPlatforms[platformId]}
                            onChange={(event) => setSellerPlatforms((current) => ({ ...current, [platformId]: event.target.checked }))}
                          />
                          <span>{PLATFORM_LABELS[platformId]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="seller-hint">{sellerHint}</div>
              </div>
            </section>

            <aside className="seller-sidebar">
              <section className="panel">
                <h3>\uCD08\uC548 \uC694\uC57D</h3>
                <div className="summary-list">
                  <div><span>\uC81C\uBAA9</span><strong>{sellerDraft.title || "\uBBF8\uC785\uB825"}</strong></div>
                  <div><span>\uAC00\uACA9</span><strong>{sellerDraft.price ? formatPrice(sellerDraft.price) : "\uBBF8\uC785\uB825"}</strong></div>
                  <div><span>\uACF5\uD1B5 \uCE74\uD14C\uACE0\uB9AC</span><strong>{sellerDraft.commonCategory || "\uBBF8\uC785\uB825"}</strong></div>
                  <div><span>\uC9C0\uC5ED</span><strong>{sellerDraft.region || "\uBBF8\uC785\uB825"}</strong></div>
                  <div><span>\uD50C\uB7AB\uD3FC</span><strong>{sellerDraft.platforms.length ? sellerDraft.platforms.map((platformId) => PLATFORM_LABELS[platformId]).join(", ") : "\uC5C6\uC74C"}</strong></div>
                </div>
              </section>

              <section className="panel">
                <h3>\uC0AC\uC9C4 \uBBF8\uB9AC\uBCF4\uAE30</h3>
                {sellerPhotoUrls.length ? (
                  <div className="photo-grid">
                    {sellerPhotoUrls.map((url, index) => (
                      <div key={url} className="photo-item">
                        <img src={url} alt={`Draft photo ${index + 1}`} />
                        <span>{index + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-copy">\uC544\uC9C1 \uCD94\uAC00\uB41C \uC0AC\uC9C4\uC774 \uC5C6\uC5B4\uC694.</div>
                )}
              </section>
            </aside>
          </div>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>\uD50C\uB7AB\uD3FC \uB4F1\uB85D \uC5F0\uACB0</h2>
                <p>\uD50C\uB7AB\uD3FC\uBCC4 \uCD08\uC548\uC744 \uBCF5\uC0AC\uD55C \uB4A4 \uACF5\uC2DD \uB4F1\uB85D \uD398\uC774\uC9C0\uB97C \uC0C8 \uD0ED\uC73C\uB85C \uC5F4\uC5B4\uC8FC\uC138\uC694.</p>
              </div>
            </div>

            <div className="seller-platform-grid">
              {Object.keys(PLATFORM_LABELS)
                .filter((platformId) => sellerPlatforms[platformId])
                .map((platformId) => (
                  <article key={platformId} className="seller-platform-card">
                    <div className="seller-platform-card__top">
                      <strong>{PLATFORM_LABELS[platformId]}</strong>
                      <span>
                        {platformId === "daangn"
                          ? "\uC6F9 \uBC84\uC804\uC740 \uCD08\uC548 \uBCF5\uC0AC \uD6C4 \uC678\uBD80 \uB4F1\uB85D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD574\uC694."
                          : "\uCD08\uC548\uC744 \uBCF5\uC0AC\uD55C \uB4A4 \uACF5\uC2DD \uD3FC\uC5D0 \uBD99\uC5EC\uB123\uC5B4\uC8FC\uC138\uC694."}
                      </span>
                    </div>
                    <div className="seller-platform-card__body">
                      <div className="seller-platform-card__line">
                        <span>\uCE74\uD14C\uACE0\uB9AC</span>
                        <strong>{sellerDraft.categoryMap[platformId] || "\uACF5\uD1B5 \uCE74\uD14C\uACE0\uB9AC"}</strong>
                      </div>
                      <div className="seller-platform-card__line">
                        <span>\uC0AC\uC9C4</span>
                        <strong>{sellerPhotos.length}</strong>
                      </div>
                      <div className="seller-platform-card__actions">
                        <button className="secondary-button" onClick={() => handleCopyDraft(platformId)}>\uCD08\uC548 \uBCF5\uC0AC</button>
                        <button className="primary-button" onClick={() => openPlatform(platformId)}>\uACF5\uC2DD \uB4F1\uB85D \uD398\uC774\uC9C0 \uC5F4\uAE30</button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
