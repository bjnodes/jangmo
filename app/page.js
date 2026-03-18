"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdSenseUnit from "@/components/AdSenseUnit";
import {
  BRAND,
  PAGE_SIZES,
  PROVIDERS,
  PROVIDER_ACCENTS,
  cleanText,
  buildSearchParams,
  formatPrice,
  readRecentSearches,
  saveRecentSearch,
} from "@/lib/market-ui";

const QUICK_KEYWORDS = ["아이폰 15", "브롬톤", "로드 자전거", "닌텐도 스위치"];

export default function HomePage() {
  const router = useRouter();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
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
    if (!region) {
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

  const visibleFeed = useMemo(() => feedItems.slice(0, 24), [feedItems]);

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
      daangn: platforms.daangn ? "1" : "",
      joongna: platforms.joongna ? "1" : "",
      bunjang: platforms.bunjang ? "1" : "",
    });

    setRecentSearches(saveRecentSearch(normalizedQuery));
    setIsPopupOpen(false);
    router.push(`/search?${params}`);
  }

  return (
    <main className="market-home">
      <section className="home-shell">
        <header className="home-topbar">
          <div className="home-brand">
            <img src="/jangteomoa-logo.png" alt={`${BRAND} 로고`} className="home-brand__logo" />
            <div className="home-brand__text">
              <strong>{BRAND}</strong>
              <span>중고장터 통합검색</span>
            </div>
          </div>

          <div className="home-search-anchor">
            <button type="button" className="home-searchbar" onClick={() => setIsPopupOpen(true)}>
              <span className="home-searchbar__placeholder">{cleanText(query) || "상품명, 지역명, 브랜드를 검색해보세요"}</span>
              <span className="home-searchbar__icon">검색</span>
            </button>

            {isPopupOpen ? (
              <div className="search-popup">
                <div className="search-popup__header">
                  <strong>검색 옵션</strong>
                  <button type="button" className="search-popup__close" onClick={() => setIsPopupOpen(false)}>
                    X
                  </button>
                </div>

                <div className="search-popup__body">
                  <label className="field">
                    <span>검색어</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="아이폰 15, 브롬톤, 비앙키 니로네" />
                  </label>

                  <label className="field field--region">
                    <span>당근 지역</span>
                    <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="하안동, 성수동, 서초동" />
                    {regionSuggestions.length ? (
                      <div className="suggestions suggestions--popup">
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

                  <div className="field-row">
                    <label className="field">
                      <span>최소 가격</span>
                      <input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" />
                    </label>
                    <label className="field">
                      <span>최대 가격</span>
                      <input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="제한 없음" />
                    </label>
                  </div>

                  <div className="field-row">
                    <label className="field">
                      <span>정렬</span>
                      <select value={sort} onChange={(event) => setSort(event.target.value)}>
                        <option value="latest">최신순</option>
                        <option value="relevance">관련순</option>
                        <option value="priceAsc">낮은 가격순</option>
                        <option value="priceDesc">높은 가격순</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>페이지 크기</span>
                      <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                        {PAGE_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}개
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="field">
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

                  <div className="search-popup__quick">
                    {QUICK_KEYWORDS.map((keyword) => (
                      <button key={keyword} type="button" className="chip" onClick={() => submitSearch(keyword)}>
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="search-popup__footer">
                  <button type="button" className="primary-button" onClick={() => submitSearch()}>
                    통합 검색
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="home-recent">
            <span className="section-label">최근 검색어</span>
            <div className="chip-wrap">
              {recentSearches.length ? (
                recentSearches.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    className="chip"
                    onClick={() => submitSearch(keyword)}
                  >
                    {keyword}
                  </button>
                ))
              ) : (
                <div className="empty-copy">아직 최근 검색어가 없어요.</div>
              )}
            </div>
          </aside>
        </header>

        <AdSenseUnit slot="1234567890" className="home-ad" />

        <section className="feed-section">
          <div className="feed-section__header">
            <div>
              <h2>방금 올라온 매물</h2>
              <p>세 플랫폼의 최근 매물을 한 피드에서 바로 둘러볼 수 있어요.</p>
            </div>
          </div>

          {feedLoading ? (
            <div className="empty-state">매물 피드를 불러오는 중이에요.</div>
          ) : (
            <div className="results-grid results-grid--home">
              {visibleFeed.map((item) => (
                <article key={item.url} className="result-card">
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
                    <p>{(item.meta || []).join(" · ") || "자세한 내용은 원본 게시글에서 확인해주세요."}</p>
                    <a className="result-card__link" href={item.url} target="_blank" rel="noreferrer">
                      게시글 보기
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
