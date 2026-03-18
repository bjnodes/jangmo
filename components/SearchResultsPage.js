"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PriceRangeControl from "@/components/PriceRangeControl";
import {
  PAGE_SIZES,
  PROVIDERS,
  PROVIDER_ACCENTS,
  buildSearchParams,
  cleanText,
  formatPrice,
  priceToNumber,
  saveRecentSearch,
} from "@/lib/market-ui";

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "relevance", label: "관련순" },
  { value: "priceAsc", label: "낮은 가격순" },
  { value: "priceDesc", label: "높은 가격순" },
];

function toProviderFilter(searchParams) {
  return {
    daangn: searchParams.get("daangn") !== "0",
    joongna: searchParams.get("joongna") !== "0",
    bunjang: searchParams.get("bunjang") !== "0",
  };
}

function createEmptyData() {
  return {
    providers: [],
    items: [],
    searchedAt: "",
    daangnRegionResolved: null,
  };
}

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [region, setRegion] = useState(searchParams.get("region") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize") || 50));
  const [filter, setFilter] = useState(toProviderFilter(searchParams));
  const [data, setData] = useState(createEmptyData());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("검색을 준비하고 있어요.");

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    const nextRegion = searchParams.get("region") || "";
    const nextMin = searchParams.get("min") || "";
    const nextMax = searchParams.get("max") || "";
    const nextSort = searchParams.get("sort") || "latest";
    const nextPageSize = Number(searchParams.get("pageSize") || 50);

    setQuery(nextQuery);
    setRegion(nextRegion);
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    setSort(nextSort);
    setPageSize(nextPageSize);
    setFilter(toProviderFilter(searchParams));
    setPage(1);

    if (!nextQuery) {
      setData(createEmptyData());
      setLoading(false);
      setProgress(0);
      return;
    }

    let cancelled = false;
    let finishTimer = null;
    const timers = [];

    setLoading(true);
    setProgress(8);
    setProgressLabel("검색을 시작하고 있어요.");

    const stagedUpdates = [
      { delay: 240, value: 22, label: "세 플랫폼에 검색 요청을 보내고 있어요." },
      { delay: 760, value: 46, label: "당근마켓, 중고나라, 번개장터 결과를 모으는 중이에요." },
      { delay: 1500, value: 71, label: "가격과 게시글 정보를 정리하고 있어요." },
      { delay: 2300, value: 88, label: "화면에 맞게 검색 결과를 묶고 있어요." },
    ];

    stagedUpdates.forEach((stage) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) {
            setProgress((current) => Math.max(current, stage.value));
            setProgressLabel(stage.label);
          }
        }, stage.delay),
      );
    });

    const driftTimer = window.setInterval(() => {
      if (cancelled) {
        return;
      }
      setProgress((current) => {
        if (current >= 94) {
          return current;
        }
        if (current < 60) {
          return current + 2;
        }
        if (current < 82) {
          return current + 1.2;
        }
        return current + 0.45;
      });
    }, 180);

    fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: nextQuery,
        daangnRegion: nextRegion,
        sort: nextSort,
        pageSize: nextPageSize,
      }),
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setData({
            providers: Array.isArray(payload.providers) ? payload.providers : [],
            items: Array.isArray(payload.items) ? payload.items : [],
            searchedAt: payload.searchedAt || new Date().toISOString(),
            daangnRegionResolved: payload.daangnRegionResolved || null,
          });
          setProgress(100);
          setProgressLabel("검색이 완료됐어요.");
          finishTimer = window.setTimeout(() => {
            if (!cancelled) {
              setLoading(false);
            }
          }, 260);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(createEmptyData());
          setProgress(100);
          setProgressLabel("검색 결과를 불러오지 못했어요.");
          finishTimer = window.setTimeout(() => {
            if (!cancelled) {
              setLoading(false);
            }
          }, 260);
        }
      });

    return () => {
      cancelled = true;
      window.clearInterval(driftTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
      if (finishTimer) {
        window.clearTimeout(finishTimer);
      }
    };
  }, [searchParams]);

  useEffect(() => {
    setPage((current) => Math.max(1, current));
  }, [pageSize]);

  const filteredItems = useMemo(() => {
    return (data.items || [])
      .filter((item) => filter[item.providerId])
      .filter((item) => {
        const numeric = priceToNumber(item.price);
        if (minPrice && numeric && numeric < Number(minPrice)) return false;
        if (maxPrice && numeric && numeric > Number(maxPrice)) return false;
        return true;
      });
  }, [data.items, filter, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const pagedItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize, totalPages]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const avgPrice = useMemo(() => {
    const numericPrices = filteredItems.map((item) => priceToNumber(item.price)).filter((value) => value > 0);
    if (!numericPrices.length) return "-";
    const average = Math.round(numericPrices.reduce((sum, value) => sum + value, 0) / numericPrices.length);
    return `${average.toLocaleString("ko-KR")}원`;
  }, [filteredItems]);

  const providerCards = useMemo(
    () =>
      Object.entries(PROVIDERS).map(([providerId, providerName]) => {
        const provider = (data.providers || []).find((entry) => entry.id === providerId) || {};
        const visible = filteredItems.filter((item) => item.providerId === providerId).length;
        return {
          id: providerId,
          name: providerName,
          visible,
          rawCount: Number(provider.rawCount || 0),
          accent: PROVIDER_ACCENTS[providerId],
        };
      }),
    [data.providers, filteredItems],
  );

  function runSearch() {
    const normalizedQuery = cleanText(query);
    if (!normalizedQuery) return;

    const params = buildSearchParams({
      q: normalizedQuery,
      region: cleanText(region),
      min: cleanText(minPrice),
      max: cleanText(maxPrice),
      sort,
      pageSize,
      daangn: filter.daangn ? "1" : "0",
      joongna: filter.joongna ? "1" : "0",
      bunjang: filter.bunjang ? "1" : "0",
    });

    saveRecentSearch(normalizedQuery);
    router.push(`/search?${params}`);
  }

  const headerDescription = data.daangnRegionResolved?.fullLabel
    ? `당근마켓은 ${data.daangnRegionResolved.fullLabel} 기준으로 검색했어요.`
    : "모든 중고 플랫폼들의 상품 검색 결과입니다.";

  return (
    <main className="results-page">
      <section className="results-shell">
        <header className="results-header">
          <div>
            <h1>{cleanText(query) || "통합 검색 결과"}</h1>
            <p>{headerDescription}</p>
          </div>
          <div className="results-header__mobile-summary">
            <div className="results-header__mobile-stats">
              <div className="results-header__mobile-chip">
                <span>총 결과</span>
                <strong>{filteredItems.length}개</strong>
              </div>
              <div className="results-header__mobile-chip results-header__mobile-chip--wide">
                <span>평균 시세</span>
                <strong>{avgPrice}</strong>
              </div>
            </div>

            <div className="results-header__mobile-providers">
              {providerCards.map((provider) => (
                <div key={provider.id} className="results-header__mobile-provider">
                  <div className="results-header__mobile-provider-title">
                    <span className="provider-card__dot" style={{ background: provider.accent }} />
                    <strong>{provider.name}</strong>
                  </div>
                  <small>{provider.visible}개 표시</small>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="results-overview">
          <div className="results-overview__providers">
            {providerCards.map((provider) => (
              <article key={provider.id} className="provider-card provider-card--equal">
                <div className="provider-card__title">
                  <span className="provider-card__dot" style={{ background: provider.accent }} />
                  <strong>{provider.name}</strong>
                </div>
                <p>{provider.visible}개 표시 / {provider.rawCount || provider.visible}개 수집</p>
              </article>
            ))}
          </div>

          <div className="results-overview__summary">
            <article className="summary-card summary-card--equal">
              <span>총 결과 수</span>
              <strong>{filteredItems.length}</strong>
            </article>
            <article className="summary-card summary-card--equal summary-card--wide">
              <span>평균 시세</span>
              <strong>{avgPrice}</strong>
            </article>
          </div>
        </section>

        <section className="results-layout">
          <div className="results-main">
            {loading ? (
              <article className="loading-panel">
                <div className="loading-panel__top">
                  <strong>검색 결과를 모으는 중이에요</strong>
                  <span>{Math.min(100, Math.max(0, Math.round(progress)))}%</span>
                </div>

                <div className="loading-bar" aria-hidden="true">
                  <div
                    className="loading-bar__fill"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>

                <p>{progressLabel}</p>
              </article>
            ) : pagedItems.length ? (
              <div className="results-grid results-grid--search">
                {pagedItems.map((item) => (
                  <article key={item.url} className="result-card result-card--search">
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
            ) : (
              <div className="empty-state">조건에 맞는 매물이 없어요.</div>
            )}

            <div className="pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                이전
              </button>
              <span>{Math.min(page, totalPages)} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                다음
              </button>
            </div>
          </div>

          <aside className="results-sidebar">
            <article className="panel panel--sticky">
              <div className="panel__header panel__header--stack">
                <div>
                  <h2>검색 조건</h2>
                  <p>검색 결과를 보면서 조건을 바로 수정하고 다시 검색할 수 있어요.</p>
                </div>
              </div>

              <label className="field">
                <span>검색어</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>

              <label className="field">
                <span>당근 지역</span>
                <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="하안동, 성수동, 서초동" />
              </label>

              <div className="price-range-block">
                <div className="field-row field-row--price">
                  <label className="field">
                    <span>최소 가격</span>
                    <input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
                  </label>
                  <label className="field">
                    <span>최대 가격</span>
                    <input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="제한 없음" />
                  </label>
                </div>

                <PriceRangeControl
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onMinPriceChange={setMinPrice}
                  onMaxPriceChange={setMaxPrice}
                />
              </div>

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

              <div className="field">
                <span>플랫폼</span>
                <div className="toggle-group">
                  {Object.entries(PROVIDERS).map(([providerId, providerName]) => (
                    <label key={providerId} className="toggle-pill">
                      <input
                        type="checkbox"
                        checked={filter[providerId]}
                        onChange={(event) => setFilter((current) => ({ ...current, [providerId]: event.target.checked }))}
                      />
                      <span>{providerName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="button" className="primary-button" onClick={runSearch}>
                조건 다시 검색
              </button>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
