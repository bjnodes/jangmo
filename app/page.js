"use client";

import { useEffect, useRef, useState } from "react";

const BRAND_NAME = "\uC7A5\uD130\uBAA8\uC544";
const RECENT_SEARCHES_KEY = "jangteomoa-web.recent-searches";
const MAX_RECENT_SEARCHES = 10;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const CATEGORY_PRESETS = [
  { id: "bike", label: "Bike", common: "Sports / Bicycle", map: { daangn: "Sports", joongna: "Sports", bunjang: "Bicycle" } },
  { id: "phone", label: "Phone", common: "Digital / Phone", map: { daangn: "Digital", joongna: "Phone", bunjang: "Phone" } },
  { id: "laptop", label: "Laptop", common: "Digital / Laptop", map: { daangn: "Digital", joongna: "Laptop", bunjang: "Laptop" } },
  { id: "camera", label: "Camera", common: "Digital / Camera", map: { daangn: "Digital", joongna: "Camera", bunjang: "Camera" } },
  { id: "game", label: "Gaming", common: "Hobby / Gaming", map: { daangn: "Hobby", joongna: "Game", bunjang: "Game" } },
  { id: "fashion", label: "Fashion", common: "Fashion / Clothes", map: { daangn: "Fashion", joongna: "Clothes", bunjang: "Fashion" } },
];

const PLATFORM_LABELS = {
  daangn: "Daangn",
  joongna: "Joongna",
  bunjang: "Bunjang",
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
  return amount ? `${amount.toLocaleString("ko-KR")} KRW` : "Price unavailable";
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
    "Prepare your draft and photos first, then open each marketplace form in a new tab.",
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
        throw new Error(payload.message || "Search request failed.");
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
        notices: [error instanceof Error ? error.message : "Search request failed."],
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
      setSellerHint("Add the item title first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildClipboardText(sellerDraft, platformId));
      setSellerHint(`${PLATFORM_LABELS[platformId]} draft copied.`);
    } catch {
      setSellerHint("Clipboard copy failed.");
    }
  }

  function openPlatform(platformId) {
    if (!sellerDraft.title || !sellerDraft.price || !sellerDraft.description) {
      setSellerHint("Fill in title, price, and description first.");
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
              <span>Unified secondhand search on the web</span>
            </div>
          </div>

          <div className="topbar-tabs">
            <button className={activeTab === "search" ? "topbar-tab topbar-tab--active" : "topbar-tab"} onClick={() => setActiveTab("search")}>
              Search
            </button>
            <button className={activeTab === "seller" ? "topbar-tab topbar-tab--active" : "topbar-tab"} onClick={() => setActiveTab("seller")}>
              Sell
            </button>
          </div>

          <div className="topbar-links">
            <a href="https://www.daangn.com/kr/buy-sell/s/" target="_blank" rel="noreferrer">Daangn</a>
            <a href="https://web.joongna.com/" target="_blank" rel="noreferrer">Joongna</a>
            <a href="https://m.bunjang.co.kr/" target="_blank" rel="noreferrer">Bunjang</a>
          </div>
        </div>
      </header>

      {activeTab === "search" ? (
        <section className="view">
          <div className="hero-grid">
            <article className="hero-card hero-card--primary">
              <span className="eyebrow">Unified Search</span>
              <h1>Compare Daangn, Joongna, and Bunjang in one place</h1>
              <p>Search all three marketplaces at once, then refine by platform, price range, and sorting order.</p>
            </article>

            <article className="hero-card">
              <div className="section-label">Recent Searches</div>
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
                  <div className="empty-copy">No recent searches yet.</div>
                )}
              </div>
            </article>
          </div>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Search Filters</h2>
                <p>Enter a keyword, optionally choose a Daangn area, then narrow results by price and platform.</p>
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
                    {size} per page
                  </button>
                ))}
              </div>
            </div>

            <div className="search-grid">
              <label className="field">
                <span>Keyword</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="iPhone 15, Brompton, PlayStation 5" />
              </label>

              <label className="field field--region">
                <span>Daangn region</span>
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
                  placeholder="Haan-dong, Seongsu-dong, Seocho-dong"
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
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="filter-grid">
              <label className="field">
                <span>Min price</span>
                <input type="number" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setCurrentPage(1); }} placeholder="0" />
              </label>
              <label className="field">
                <span>Max price</span>
                <input type="number" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setCurrentPage(1); }} placeholder="No limit" />
              </label>
              <label className="field">
                <span>Sort</span>
                <select value={sort} onChange={(event) => { setSort(event.target.value); setCurrentPage(1); }}>
                  <option value="latest">Latest</option>
                  <option value="relevance">Relevance</option>
                  <option value="priceAsc">Price low to high</option>
                  <option value="priceDesc">Price high to low</option>
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
              <div className="toolbar__status">{searchLoading ? "Fetching listings..." : ""}</div>
            </div>
          </section>

          <section className="summary-grid">
            <article className="summary-card">
              <span>Results</span>
              <strong>{filteredItems.length}</strong>
            </article>
            <article className="summary-card">
              <span>Page</span>
              <strong>{currentPage} / {totalPages}</strong>
            </article>
            <article className="summary-card">
              <span>Updated</span>
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
                    <p>{provider.error || `${provider.items?.length || 0} visible / ${provider.rawCount || 0} collected`}</p>
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
                        <div className="result-card__image-empty">No image</div>
                      )}
                      <span className="result-card__badge" style={{ color: item.providerAccent, background: `${item.providerAccent}18` }}>
                        {item.providerName}
                      </span>
                    </div>
                    <div className="result-card__body">
                      <strong className="result-card__price">{item.price || "Price unavailable"}</strong>
                      <h3>{item.title}</h3>
                      <p>{(item.meta || []).join(" · ") || "Open the original listing for more details."}</p>
                      <a className="result-card__link" href={item.url} target="_blank" rel="noreferrer">Open listing</a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">Search a keyword to load listings from all three platforms.</div>
            )}

            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>Prev</button>
              <span>{currentPage} / {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>Next</button>
            </div>
          </section>
        </section>
      ) : (
        <section className="view">
          <div className="seller-layout">
            <section className="panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">Sell Workspace</span>
                  <h2>Prepare one draft and open each marketplace form in a new tab</h2>
                  <p>The web version focuses on draft prep, photo preview, category mapping, and quick handoff to each official posting form.</p>
                </div>
                <button className="secondary-button" onClick={() => handleCopyDraft("joongna")}>Copy draft</button>
              </div>

              <div className="seller-form">
                <div className="seller-grid seller-grid--two">
                  <label className="field">
                    <span>Title</span>
                    <input value={sellerTitle} onChange={(event) => setSellerTitle(event.target.value)} placeholder="Bianchi Nirone road bike" />
                  </label>
                  <label className="field">
                    <span>Price</span>
                    <input type="number" value={sellerPrice} onChange={(event) => setSellerPrice(event.target.value)} placeholder="430000" />
                  </label>
                </div>

                <div className="seller-grid seller-grid--three">
                  <label className="field">
                    <span>Category preset</span>
                    <select value={sellerPreset} onChange={(event) => handlePresetChange(event.target.value)}>
                      <option value="">Custom</option>
                      {CATEGORY_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Shared category</span>
                    <input value={sellerCommonCategory} onChange={(event) => setSellerCommonCategory(event.target.value)} placeholder="Sports / Bicycle" />
                  </label>
                  <label className="field">
                    <span>Region</span>
                    <input value={sellerRegion} onChange={(event) => setSellerRegion(event.target.value)} placeholder="Gwangmyeong-si Haan-dong" />
                  </label>
                </div>

                <div className="seller-grid seller-grid--three">
                  <label className="field">
                    <span>Daangn category</span>
                    <input value={sellerCategoryMap.daangn} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, daangn: event.target.value }))} placeholder="Fallbacks to shared category" />
                  </label>
                  <label className="field">
                    <span>Joongna category</span>
                    <input value={sellerCategoryMap.joongna} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, joongna: event.target.value }))} placeholder="Fallbacks to shared category" />
                  </label>
                  <label className="field">
                    <span>Bunjang category</span>
                    <input value={sellerCategoryMap.bunjang} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, bunjang: event.target.value }))} placeholder="Fallbacks to shared category" />
                  </label>
                </div>

                <label className="field">
                  <span>Description</span>
                  <textarea rows={8} value={sellerDescription} onChange={(event) => setSellerDescription(event.target.value)} placeholder="Purchase date, condition, included parts, trade method, and negotiation notes." />
                </label>

                <div className="seller-grid seller-grid--split">
                  <label className="field">
                    <span>Photos</span>
                    <input type="file" multiple accept="image/*" onChange={(event) => setSellerPhotos([...(event.target.files || [])])} />
                    <small>{sellerPhotos.length ? `${sellerPhotos.length} photo(s) ready.` : "Pick photos here, then attach them on each marketplace form."}</small>
                  </label>

                  <div className="field">
                    <span>Platforms</span>
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
                <h3>Draft summary</h3>
                <div className="summary-list">
                  <div><span>Title</span><strong>{sellerDraft.title || "Not set"}</strong></div>
                  <div><span>Price</span><strong>{sellerDraft.price ? formatPrice(sellerDraft.price) : "Not set"}</strong></div>
                  <div><span>Shared category</span><strong>{sellerDraft.commonCategory || "Not set"}</strong></div>
                  <div><span>Region</span><strong>{sellerDraft.region || "Not set"}</strong></div>
                  <div><span>Platforms</span><strong>{sellerDraft.platforms.length ? sellerDraft.platforms.map((platformId) => PLATFORM_LABELS[platformId]).join(", ") : "None"}</strong></div>
                </div>
              </section>

              <section className="panel">
                <h3>Photo preview</h3>
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
                  <div className="empty-copy">No photos added yet.</div>
                )}
              </section>
            </aside>
          </div>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Marketplace handoff</h2>
                <p>Copy a platform-ready draft, then open the official posting page in a new tab.</p>
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
                          ? "Web flow uses draft copy plus external handoff."
                          : "Copy the draft, then paste it into the official form."}
                      </span>
                    </div>
                    <div className="seller-platform-card__body">
                      <div className="seller-platform-card__line">
                        <span>Category</span>
                        <strong>{sellerDraft.categoryMap[platformId] || "Shared category"}</strong>
                      </div>
                      <div className="seller-platform-card__line">
                        <span>Photos ready</span>
                        <strong>{sellerPhotos.length}</strong>
                      </div>
                      <div className="seller-platform-card__actions">
                        <button className="secondary-button" onClick={() => handleCopyDraft(platformId)}>Copy draft</button>
                        <button className="primary-button" onClick={() => openPlatform(platformId)}>Open official form</button>
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
