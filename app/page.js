"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PAGE_SIZES,
  PROVIDERS,
  PROVIDER_ACCENTS,
  buildSearchParams,
  cleanText,
  formatPrice,
  readRecentSearches,
  saveRecentSearch,
} from "@/lib/market-ui";

const QUICK_KEYWORDS = ["아이폰 15", "비앙키", "브롬톤", "플레이스테이션 5"];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "relevance", label: "관련순" },
  { value: "priceAsc", label: "낮은 가격순" },
  { value: "priceDesc", label: "높은 가격순" },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("latest");
  const [pageSize, setPageSize] = useState(50);
  const [platforms, setPlatforms] = useState({ daangn: true, joongna: true, bunjang: true });
  const [recentSearches, setRecentSearches] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [regionSuggestions, setRegionSuggestions] = useState([]);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);

    fetch("/api/home-feed", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setFeedItems(Array.isArray(payload.items) ? payload.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeedItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFeedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!region.trim()) {
      setRegionSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/daangn-regions?query=${encodeURIComponent(region)}`, {
          cache: "no-store",
        });
        const payload = await response.json();
        setRegionSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions.slice(0, 6) : []);
      } catch {
        setRegionSuggestions([]);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [region]);

  const visibleFeed = useMemo(() => feedItems.slice(0, 30), [feedItems]);

  function submitSearch(nextQuery = query) {
    const normalizedQuery = cleanText(nextQuery);
    if (!normalizedQuery) {
      return;
    }

    const params = buildSearchParams({
      q: normalizedQuery,
      region: cleanText(region),
      min: cleanText(minPrice),
      max: cleanText(maxPrice),
      sort,
      pageSize,
      daangn: platforms.daangn ? "1" : "0",
      joongna: platforms.joongna ? "1" : "0",
      bunjang: platforms.bunjang ? "1" : "0",
    });

    setRecentSearches(saveRecentSearch(normalizedQuery));
    router.push(`/search?${params}`);
  }

  return (
    <main className="market-home">
      <section className="home-shell">
        <header className="home-topbar">
          <form
            className="home-search-panel"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <div className="home-search-panel__header">
              <span className="section-label">통합 검색</span>
              <div className="home-search-panel__title">
                <strong>상품명, 지역명, 브랜드를 한 번에 찾아보세요</strong>
                <p>당근마켓, 중고나라, 번개장터 결과를 한 화면에서 바로 비교할 수 있어요.</p>
              </div>
            </div>

            <div className="home-search-panel__searchline">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="아이폰 15, 비앙키 니로네, 브롬톤"
                className="home-search-panel__input"
              />
              <button type="submit" className="home-search-panel__submit">
                통합 검색 시작
              </button>
            </div>

            <div className="home-search-panel__details">
              <label className="field field--span-2">
                <span>당근 지역</span>
                <input
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  placeholder="하안동, 성수동, 서초동"
                />
                {regionSuggestions.length ? (
                  <div className="suggestions">
                    {regionSuggestions.map((item) => (
                      <button
                        key={item.inValue}
                        type="button"
                        className="suggestion"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setRegion(item.label);
                          setRegionSuggestions([]);
                        }}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.fullLabel || item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>

              <label className="field">
                <span>최소 가격</span>
                <input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" />
              </label>

              <label className="field">
                <span>최대 가격</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="제한 없음"
                />
              </label>

              <label className="field">
                <span>정렬</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field field--span-2">
                <span>플랫폼</span>
                <div className="toggle-group">
                  {Object.entries(PROVIDERS).map(([providerId, providerName]) => (
                    <label key={providerId} className="toggle-pill">
                      <input
                        type="checkbox"
                        checked={platforms[providerId]}
                        onChange={(event) =>
                          setPlatforms((current) => ({ ...current, [providerId]: event.target.checked }))
                        }
                      />
                      <span>{providerName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <span>페이지당 보기</span>
                <div className="page-size">
                  {PAGE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`page-size__button ${pageSize === size ? "page-size__button--active" : ""}`}
                      onClick={() => setPageSize(size)}
                    >
                      {size}개
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="home-search-panel__footer">
              <div className="home-search-panel__quick">
                <span className="sidebar-title">빠른 검색</span>
                <div className="chip-wrap">
                  {QUICK_KEYWORDS.map((keyword) => (
                    <button key={keyword} type="button" className="chip" onClick={() => submitSearch(keyword)}>
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>

          <aside className="home-card home-recent">
            <span className="section-label">최근 검색어</span>
            <div className="chip-wrap">
              {recentSearches.length ? (
                recentSearches.map((keyword) => (
                  <button key={keyword} type="button" className="chip" onClick={() => submitSearch(keyword)}>
                    {keyword}
                  </button>
                ))
              ) : (
                <div className="empty-copy">최근 검색어가 아직 없어요.</div>
              )}
            </div>
          </aside>
        </header>

        <section className="feed-section">
          <div className="feed-section__header">
            <div>
              <h2>방금 올라온 매물</h2>
              <p>세 플랫폼의 최신 매물을 한 화면에서 빠르게 둘러볼 수 있어요.</p>
            </div>
            <div className="feed-section__meta">
              <strong>{visibleFeed.length}</strong>
              <span>개 표시 중</span>
            </div>
          </div>

          {feedLoading ? (
            <div className="empty-state">매물 피드를 불러오는 중이에요.</div>
          ) : (
            <div className="results-grid results-grid--home">
              {visibleFeed.map((item) => (
                <article key={item.url} className="result-card result-card--compact">
                  <div className="result-card__image-wrap">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="result-card__image-empty">이미지 없음</div>
                    )}
                    <span
                      className="result-card__badge"
                      style={{
                        color: PROVIDER_ACCENTS[item.providerId] || item.providerAccent,
                        background: `${PROVIDER_ACCENTS[item.providerId] || item.providerAccent || "#2f80ed"}18`,
                      }}
                    >
                      {PROVIDERS[item.providerId] || item.providerName}
                    </span>
                  </div>

                  <div className="result-card__body">
                    <strong className="result-card__price">{item.price || formatPrice("")}</strong>
                    <h3>{item.title}</h3>
                    <p>{(item.meta || []).join(" · ") || "원문에서 자세한 정보를 확인해 주세요."}</p>
                    <a className="result-card__link result-card__link--compact" href={item.url} target="_blank" rel="noreferrer">
                      원문 보기
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
