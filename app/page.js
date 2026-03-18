"use client";

import { useEffect, useRef, useState } from "react";

const BRAND_NAME = "장터모아";
const RECENT_SEARCHES_KEY = "jangteomoa-web.recent-searches";
const MAX_RECENT_SEARCHES = 10;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

const CATEGORY_PRESETS = [
  { id: "bike", label: "자전거", common: "스포츠 / 자전거", map: { daangn: "스포츠", joongna: "스포츠", bunjang: "자전거" } },
  { id: "phone", label: "휴대폰", common: "디지털 / 휴대폰", map: { daangn: "디지털", joongna: "휴대폰", bunjang: "휴대폰" } },
  { id: "laptop", label: "노트북", common: "디지털 / 노트북", map: { daangn: "디지털", joongna: "노트북", bunjang: "노트북" } },
  { id: "camera", label: "카메라", common: "디지털 / 카메라", map: { daangn: "디지털", joongna: "카메라", bunjang: "카메라" } },
  { id: "game", label: "게임", common: "취미 / 게임", map: { daangn: "취미", joongna: "게임", bunjang: "게임" } },
  { id: "fashion", label: "패션", common: "패션 / 의류", map: { daangn: "패션", joongna: "의류", bunjang: "패션" } },
];

const PLATFORM_LABELS = {
  daangn: "당근마켓",
  joongna: "중고나라",
  bunjang: "번개장터",
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
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPriceNumber(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatPrice(value) {
  const amount = toPriceNumber(value);
  return amount ? `${amount.toLocaleString("ko-KR")}원` : "가격 정보 없음";
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
    draft.price ? `가격: ${formatPrice(draft.price)}` : "",
    category ? `카테고리: ${category}` : "",
    draft.region ? `지역: ${draft.region}` : "",
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
    "초안과 사진을 먼저 준비한 뒤, 각 플랫폼 등록 페이지를 새 탭으로 열어주세요.",
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
        throw new Error(payload.message || "검색 요청에 실패했어요.");
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
        notices: [error instanceof Error ? error.message : "검색 요청에 실패했어요."],
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
      setSellerHint("제목을 먼저 입력해주세요.");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildClipboardText(sellerDraft, platformId));
      setSellerHint(`${PLATFORM_LABELS[platformId]} 용 초안을 복사했어요.`);
    } catch {
      setSellerHint("복사에 실패했어요.");
    }
  }

  function openPlatform(platformId) {
    if (!sellerDraft.title || !sellerDraft.price || !sellerDraft.description) {
      setSellerHint("제목, 가격, 설명을 먼저 입력해주세요.");
      return;
    }
    window.open(PLATFORM_LINKS[platformId], "_blank", "noopener,noreferrer");
  }

  return (
    <main className="web-page">
      <header className="shell-topbar">
        <div className="shell-topbar__inner">
          <div className="brand">
            <img className="brand__logo" src="/jangteomoa-logo.png" alt={`${BRAND_NAME} 로고`} />
            <div>
              <strong>{BRAND_NAME}</strong>
              <span>중고거래 통합검색 웹 앱</span>
            </div>
          </div>

          <div className="topbar-tabs">
            <button className={activeTab === "search" ? "topbar-tab topbar-tab--active" : "topbar-tab"} onClick={() => setActiveTab("search")}>
              검색
            </button>
            <button className={activeTab === "seller" ? "topbar-tab topbar-tab--active" : "topbar-tab"} onClick={() => setActiveTab("seller")}>
              판매글 작성
            </button>
          </div>

          <div className="topbar-links">
            <a href="https://www.daangn.com/kr/buy-sell/s/" target="_blank" rel="noreferrer">당근마켓</a>
            <a href="https://web.joongna.com/" target="_blank" rel="noreferrer">중고나라</a>
            <a href="https://m.bunjang.co.kr/" target="_blank" rel="noreferrer">번개장터</a>
          </div>
        </div>
      </header>

      {activeTab === "search" ? (
        <section className="view">
          <div className="hero-grid">
            <article className="hero-card hero-card--primary">
              <span className="eyebrow">통합 검색</span>
              <h1>당근마켓, 중고나라, 번개장터를 한 번에 비교해보세요</h1>
              <p>세 플랫폼을 동시에 검색하고, 플랫폼·가격대·정렬 기준으로 바로 걸러보세요.</p>
            </article>

            <article className="hero-card">
              <div className="section-label">최근 검색어</div>
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
                  <div className="empty-copy">아직 최근 검색어가 없어요.</div>
                )}
              </div>
            </article>
          </div>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>검색 필터</h2>
                <p>검색어를 입력하고 필요하면 당근 지역을 고른 뒤, 가격과 플랫폼으로 결과를 줄여보세요.</p>
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
                    한 페이지 {size}개
                  </button>
                ))}
              </div>
            </div>

            <div className="search-grid">
              <label className="field">
                <span>검색어</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="아이폰 15, 브롬톤, 플레이스테이션 5" />
              </label>

              <label className="field field--region">
                <span>당근 지역</span>
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
                  placeholder="하안동, 성수동, 서초동"
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
                {searchLoading ? "검색 중..." : "검색"}
              </button>
            </div>

            <div className="filter-grid">
              <label className="field">
                <span>최소 가격</span>
                <input type="number" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setCurrentPage(1); }} placeholder="0" />
              </label>
              <label className="field">
                <span>최대 가격</span>
                <input type="number" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setCurrentPage(1); }} placeholder="제한 없음" />
              </label>
              <label className="field">
                <span>정렬</span>
                <select value={sort} onChange={(event) => { setSort(event.target.value); setCurrentPage(1); }}>
                  <option value="latest">최신순</option>
                  <option value="relevance">관련순</option>
                  <option value="priceAsc">낮은 가격순</option>
                  <option value="priceDesc">높은 가격순</option>
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
              <div className="toolbar__status">{searchLoading ? "매물을 가져오는 중..." : ""}</div>
            </div>
          </section>

          <section className="summary-grid">
            <article className="summary-card">
              <span>검색 결과</span>
              <strong>{filteredItems.length}</strong>
            </article>
            <article className="summary-card">
              <span>페이지</span>
              <strong>{currentPage} / {totalPages}</strong>
            </article>
            <article className="summary-card">
              <span>업데이트</span>
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
                    <p>{provider.error || `${provider.items?.length || 0}개 표시 / ${provider.rawCount || 0}개 수집`}</p>
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
                        <div className="result-card__image-empty">이미지 없음</div>
                      )}
                      <span className="result-card__badge" style={{ color: item.providerAccent, background: `${item.providerAccent}18` }}>
                        {item.providerName}
                      </span>
                    </div>
                    <div className="result-card__body">
                      <strong className="result-card__price">{item.price || "가격 정보 없음"}</strong>
                      <h3>{item.title}</h3>
                      <p>{(item.meta || []).join(" · ") || "자세한 내용은 원본 매물에서 확인해주세요."}</p>
                      <a className="result-card__link" href={item.url} target="_blank" rel="noreferrer">게시글 보기</a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">검색어를 입력하면 세 플랫폼 매물을 한 번에 불러와요.</div>
            )}

            <div className="pagination">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>이전</button>
              <span>{currentPage} / {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>다음</button>
            </div>
          </section>
        </section>
      ) : (
        <section className="view">
          <div className="seller-layout">
            <section className="panel">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">판매 작성</span>
                  <h2>초안을 한 번 작성하고 각 플랫폼 등록 페이지로 이동해보세요</h2>
                  <p>웹 버전은 초안 준비, 사진 미리보기, 카테고리 매핑, 공식 등록 페이지 연결에 초점을 둔 구성입니다.</p>
                </div>
                <button className="secondary-button" onClick={() => handleCopyDraft("joongna")}>초안 복사</button>
              </div>

              <div className="seller-form">
                <div className="seller-grid seller-grid--two">
                  <label className="field">
                    <span>제목</span>
                    <input value={sellerTitle} onChange={(event) => setSellerTitle(event.target.value)} placeholder="비앙키 니로네 로드 자전거" />
                  </label>
                  <label className="field">
                    <span>가격</span>
                    <input type="number" value={sellerPrice} onChange={(event) => setSellerPrice(event.target.value)} placeholder="430000" />
                  </label>
                </div>

                <div className="seller-grid seller-grid--three">
                  <label className="field">
                    <span>카테고리 예시</span>
                    <select value={sellerPreset} onChange={(event) => handlePresetChange(event.target.value)}>
                      <option value="">직접 입력</option>
                      {CATEGORY_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>공통 카테고리</span>
                    <input value={sellerCommonCategory} onChange={(event) => setSellerCommonCategory(event.target.value)} placeholder="스포츠 / 자전거" />
                  </label>
                  <label className="field">
                    <span>지역</span>
                    <input value={sellerRegion} onChange={(event) => setSellerRegion(event.target.value)} placeholder="광명시 하안동" />
                  </label>
                </div>

                <div className="seller-grid seller-grid--three">
                  <label className="field">
                    <span>당근마켓 카테고리</span>
                    <input value={sellerCategoryMap.daangn} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, daangn: event.target.value }))} placeholder="비워두면 공통 카테고리를 사용해요" />
                  </label>
                  <label className="field">
                    <span>중고나라 카테고리</span>
                    <input value={sellerCategoryMap.joongna} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, joongna: event.target.value }))} placeholder="비워두면 공통 카테고리를 사용해요" />
                  </label>
                  <label className="field">
                    <span>번개장터 카테고리</span>
                    <input value={sellerCategoryMap.bunjang} onChange={(event) => setSellerCategoryMap((current) => ({ ...current, bunjang: event.target.value }))} placeholder="비워두면 공통 카테고리를 사용해요" />
                  </label>
                </div>

                <label className="field">
                  <span>설명</span>
                  <textarea rows={8} value={sellerDescription} onChange={(event) => setSellerDescription(event.target.value)} placeholder="구매 시기, 상태, 구성품, 거래 방식, 네고 여부 등을 적어주세요." />
                </label>

                <div className="seller-grid seller-grid--split">
                  <label className="field">
                    <span>사진</span>
                    <input type="file" multiple accept="image/*" onChange={(event) => setSellerPhotos([...(event.target.files || [])])} />
                    <small>{sellerPhotos.length ? `${sellerPhotos.length}장 준비됨` : "여기서 사진을 고른 뒤 각 플랫폼 등록 폼에 첨부해주세요."}</small>
                  </label>

                  <div className="field">
                    <span>플랫폼</span>
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
                <h3>초안 요약</h3>
                <div className="summary-list">
                  <div><span>제목</span><strong>{sellerDraft.title || "미입력"}</strong></div>
                  <div><span>가격</span><strong>{sellerDraft.price ? formatPrice(sellerDraft.price) : "미입력"}</strong></div>
                  <div><span>공통 카테고리</span><strong>{sellerDraft.commonCategory || "미입력"}</strong></div>
                  <div><span>지역</span><strong>{sellerDraft.region || "미입력"}</strong></div>
                  <div><span>플랫폼</span><strong>{sellerDraft.platforms.length ? sellerDraft.platforms.map((platformId) => PLATFORM_LABELS[platformId]).join(", ") : "없음"}</strong></div>
                </div>
              </section>

              <section className="panel">
                <h3>사진 미리보기</h3>
                {sellerPhotoUrls.length ? (
                  <div className="photo-grid">
                    {sellerPhotoUrls.map((url, index) => (
                      <div key={url} className="photo-item">
                        <img src={url} alt={`초안 사진 ${index + 1}`} />
                        <span>{index + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-copy">아직 추가된 사진이 없어요.</div>
                )}
              </section>
            </aside>
          </div>

          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>플랫폼 등록 연결</h2>
                <p>플랫폼별 초안을 복사한 뒤 공식 등록 페이지를 새 탭으로 열어주세요.</p>
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
                          ? "웹 버전은 초안 복사 후 외부 등록 페이지로 이동해요."
                          : "초안을 복사한 뒤 공식 폼에 붙여넣어주세요."}
                      </span>
                    </div>
                    <div className="seller-platform-card__body">
                      <div className="seller-platform-card__line">
                        <span>카테고리</span>
                        <strong>{sellerDraft.categoryMap[platformId] || "공통 카테고리"}</strong>
                      </div>
                      <div className="seller-platform-card__line">
                        <span>사진</span>
                        <strong>{sellerPhotos.length}</strong>
                      </div>
                      <div className="seller-platform-card__actions">
                        <button className="secondary-button" onClick={() => handleCopyDraft(platformId)}>초안 복사</button>
                        <button className="primary-button" onClick={() => openPlatform(platformId)}>공식 등록 페이지 열기</button>
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
