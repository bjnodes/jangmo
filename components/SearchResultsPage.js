"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function toProviderFilter(searchParams) {
  return {
    daangn: searchParams.get("daangn") !== "0",
    joongna: searchParams.get("joongna") !== "0",
    bunjang: searchParams.get("bunjang") !== "0",
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
  const [data, setData] = useState({ providers: [], items: [], searchedAt: "", daangnRegionResolved: null });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

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
      setData({ providers: [], items: [], searchedAt: "", daangnRegionResolved: null });
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: nextQuery,
        daangnRegion: nextRegion,
        sort: nextSort,
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
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData({ providers: [], items: [], searchedAt: "", daangnRegionResolved: null });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
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

  return (
    <main className="results-page">
      <section className="results-shell">
        <header className="results-header">
          <div>
            <h1>{cleanText(query) || "통합 검색 결과"}</h1>
            <p>{data.daangnRegionResolved?.fullLabel ? `당근 지역은 ${data.daangnRegionResolved.fullLabel} 기준으로 검색했어요.` : "세 플랫폼 결과를 한 화면에서 비교해요."}</p>
          </div>
        </header>

        <section className="results-overview">
          <div className="results-overview__providers">
            {providerCards.map((provider) => (
              <article key={provider.id} className="provider-card">
                <div className="provider-card__title">
                  <span className="provider-card__dot" style={{ background: provider.accent }} />
                  <strong>{provider.name}</strong>
                </div>
                <p>{provider.visible}개 표시 / {provider.rawCount || provider.visible}개 수집</p>
              </article>
            ))}
          </div>

          <div className="results-overview__summary">
            <article className="summary-card">
              <span>총 결과 수</span>
              <strong>{filteredItems.length}</strong>
            </article>
            <article className="summary-card">
              <span>평균 시세</span>
              <strong>{avgPrice}</strong>
            </article>
          </div>
        </section>

        <section className="results-layout">
          <div className="results-main">
            {loading ? (
              <div className="empty-state">검색 결과를 불러오는 중이에요.</div>
            ) : pagedItems.length ? (
              <div className="results-grid results-grid--search">
                {pagedItems.map((item) => (
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
            ) : (
              <div className="empty-state">조건에 맞는 매물이 없어요.</div>
            )}

            <div className="pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                이전
              </button>
              <span>{page} / {totalPages}</span>
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
                  <p>검색 결과를 보면서 조건을 바로 수정할 수 있어요.</p>
                </div>
              </div>

              <label className="field">
                <span>검색어</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className="field">
                <span>당근 지역</span>
                <input value={region} onChange={(event) => setRegion(event.target.value)} />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>최소 가격</span>
                  <input type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
                </label>
                <label className="field">
                  <span>최대 가격</span>
                  <input type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
                </label>
              </div>
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
