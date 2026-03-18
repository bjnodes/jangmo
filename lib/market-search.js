const SEARCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SEARCH_HEADERS = {
  "user-agent": SEARCH_USER_AGENT,
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8",
};

const MAX_JOONGNA_PAGES = 30;
const MAX_BUNJANG_PAGES = 30;

const PROVIDERS = [
  { id: "daangn", name: "당근마켓", accent: "#ff6f0f", description: "동네 기반 중고거래" },
  { id: "joongna", name: "중고나라", accent: "#2f80ed", description: "전국 단위 중고거래" },
  { id: "bunjang", name: "번개장터", accent: "#ef466f", description: "빠른 매물 탐색" },
];

let daangnBaseRegionOptionsPromise = null;
const daangnRegionSuggestionCache = new Map();
let daangnChildRegionOptions = [];
let daangnScannedParentRegionValues = new Set();

function cleanText(value) {
  return String(value || "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumericPrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  const text = cleanText(value);
  if (!text) {
    return 0;
  }

  const normalized = text.replace(/,/g, "").replace(/won/gi, "").replace(/원/g, "").trim();
  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return Math.round(Number(normalized));
  }

  const digits = normalized.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatPrice(value) {
  const numeric = parseNumericPrice(value);
  if (numeric) {
    return `${numeric.toLocaleString("ko-KR")}원`;
  }

  const text = cleanText(value);
  return text || "가격 정보 없음";
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }

  const text = cleanText(value);
  if (!text) {
    return 0;
  }

  const asNumber = Number(text);
  if (Number.isFinite(asNumber)) {
    return parseTimestamp(asNumber);
  }

  const parsed = Date.parse(text.replace(/\./g, "-"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || `${item.providerId}:${item.title}:${item.price}`;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchText(url) {
  const response = await fetch(url, { headers: SEARCH_HEADERS, cache: "no-store" });
  return {
    status: response.status,
    text: await response.text(),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: SEARCH_HEADERS, cache: "no-store" });
  return {
    status: response.status,
    data: await response.json(),
  };
}

function parseDaangnRemixContext(html) {
  const marker = "window.__remixContext = ";
  const start = html.indexOf(marker);
  if (start < 0) {
    return null;
  }
  const end = html.indexOf(";</script>", start);
  if (end < 0) {
    return null;
  }
  return JSON.parse(html.slice(start + marker.length, end));
}

function buildDaangnInValue(regionName, regionId) {
  return `${cleanText(regionName)}-${regionId}`;
}

function normalizeDaangnRegionOption(option) {
  return {
    label: cleanText(option.label),
    fullLabel: cleanText(option.fullLabel || option.label),
    inValue: cleanText(option.inValue),
    depth: Number(option.depth || 0),
  };
}

function dedupeDaangnRegionOptions(options) {
  const unique = new Map();
  options.forEach((option) => {
    if (!option?.inValue || unique.has(option.inValue)) {
      return;
    }
    unique.set(option.inValue, normalizeDaangnRegionOption(option));
  });
  return [...unique.values()];
}

async function loadDaangnBaseRegionOptions() {
  if (!daangnBaseRegionOptionsPromise) {
    daangnBaseRegionOptionsPromise = (async () => {
      const { text } = await fetchText("https://www.daangn.com/kr/regions");
      const remixContext = parseDaangnRemixContext(text);
      const loaderData = remixContext?.state?.loaderData || {};
      const rootData = loaderData.root || {};
      const regionData = loaderData["routes/kr.regions._index"] || {};
      const options = [];

      const fallbackLocations = rootData.__locationSelectModal?.fallbackLocations || [];
      fallbackLocations.forEach((location) => {
        options.push({
          label: cleanText(location.name3 || location.name),
          fullLabel: cleanText([location.name1, location.name2, location.name3 || location.name].filter(Boolean).join(" ")),
          inValue: buildDaangnInValue(location.name3 || location.name, location.id),
          depth: location.depth || 3,
        });
      });

      const allRegions = Array.isArray(regionData.allRegions) ? regionData.allRegions : [];
      allRegions.forEach((group) => {
        const parentName = cleanText(group.regionName);
        const children = Array.isArray(group.childrenRegion) ? group.childrenRegion : [];
        children.forEach((region) => {
          options.push({
            label: cleanText(region.regionName),
            fullLabel: cleanText([parentName, region.regionName].join(" ")),
            inValue: buildDaangnInValue(region.regionName, region.regionId),
            depth: region.depth || 2,
          });
        });
      });

      return dedupeDaangnRegionOptions(options);
    })().catch((error) => {
      daangnBaseRegionOptionsPromise = null;
      throw error;
    });
  }

  return daangnBaseRegionOptionsPromise;
}

function scoreDaangnRegionOption(option, query) {
  const normalizedQuery = cleanText(query).toLowerCase();
  const label = cleanText(option.label).toLowerCase();
  const fullLabel = cleanText(option.fullLabel).toLowerCase();
  if (!normalizedQuery) return 0;
  if (label === normalizedQuery) return 1000;
  if (fullLabel === normalizedQuery) return 950;
  if (label.startsWith(normalizedQuery)) return 900;
  if (fullLabel.startsWith(normalizedQuery)) return 850;
  if (label.includes(normalizedQuery)) return 800;
  if (fullLabel.includes(normalizedQuery)) return 750;
  return 0;
}

function sortDaangnRegionOptions(options, query) {
  return [...options].sort((left, right) => {
    const scoreDiff = scoreDaangnRegionOption(right, query) - scoreDaangnRegionOption(left, query);
    if (scoreDiff !== 0) return scoreDiff;
    const depthDiff = (right.depth || 0) - (left.depth || 0);
    if (depthDiff !== 0) return depthDiff;
    return left.fullLabel.localeCompare(right.fullLabel, "ko");
  });
}

function extractDaangnInValuesFromHtml(html) {
  const values = new Set();
  const pattern = /in=([^"'<>\s)]+)/gi;
  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    const normalized = decodeURIComponent(String(match[1] || ""))
      .replace(/&amp;.*$/i, "")
      .replace(/&.*$/i, "")
      .trim();
    if (/-\d+$/.test(normalized)) {
      values.add(normalized);
    }
  }
  return [...values];
}

function buildDaangnChildRegionOption(parentOption, inValue) {
  const label = cleanText(inValue.replace(/-\d+$/, ""));
  if (!label || label === parentOption.label) {
    return null;
  }
  return {
    label,
    fullLabel: cleanText([parentOption.fullLabel, label].join(" ")),
    inValue,
    depth: Math.max(3, Number(parentOption.depth || 2) + 1),
  };
}

async function fetchDaangnChildRegionOptionsForParent(parentOption) {
  const url = `https://www.daangn.com/kr/buy-sell/s/?in=${encodeURIComponent(parentOption.inValue)}`;
  const { text } = await fetchText(url);
  return dedupeDaangnRegionOptions(
    extractDaangnInValuesFromHtml(text)
      .map((inValue) => buildDaangnChildRegionOption(parentOption, inValue))
      .filter(Boolean),
  );
}

async function discoverDaangnChildRegionOptions(query) {
  const normalizedQuery = cleanText(query);
  const parents = (await loadDaangnBaseRegionOptions()).filter((option) => Number(option.depth) === 2);
  let matches = daangnChildRegionOptions.filter((option) => scoreDaangnRegionOption(option, normalizedQuery) > 0);
  if (matches.length >= 8) {
    return matches;
  }

  for (const parent of parents) {
    if (daangnScannedParentRegionValues.has(parent.inValue)) {
      continue;
    }

    try {
      const discovered = await fetchDaangnChildRegionOptionsForParent(parent);
      if (discovered.length) {
        daangnChildRegionOptions = dedupeDaangnRegionOptions([...daangnChildRegionOptions, ...discovered]);
      }
    } catch {
      // Continue scanning other parent regions.
    } finally {
      daangnScannedParentRegionValues.add(parent.inValue);
    }

    matches = daangnChildRegionOptions.filter((option) => scoreDaangnRegionOption(option, normalizedQuery) > 0);
    if (matches.length >= 8) {
      break;
    }
  }

  return matches;
}

export async function suggestDaangnRegions(query) {
  const normalizedQuery = cleanText(query);
  if (!normalizedQuery) {
    return [];
  }

  const cacheKey = normalizedQuery.toLowerCase();
  if (daangnRegionSuggestionCache.has(cacheKey)) {
    return daangnRegionSuggestionCache.get(cacheKey);
  }

  const baseOptions = await loadDaangnBaseRegionOptions();
  const localMatches = dedupeDaangnRegionOptions([
    ...baseOptions.filter((option) => scoreDaangnRegionOption(option, normalizedQuery) > 0),
    ...daangnChildRegionOptions.filter((option) => scoreDaangnRegionOption(option, normalizedQuery) > 0),
  ]);

  const discovered = localMatches.length < 8 ? await discoverDaangnChildRegionOptions(normalizedQuery) : [];
  const merged = dedupeDaangnRegionOptions([...localMatches, ...discovered]);
  const sorted = sortDaangnRegionOptions(merged, normalizedQuery).slice(0, 8);
  daangnRegionSuggestionCache.set(cacheKey, sorted);
  return sorted;
}

async function resolveDaangnRegion(options = {}) {
  const explicitInValue = cleanText(options.daangnRegionInValue);
  if (explicitInValue) {
    const known = [...(await loadDaangnBaseRegionOptions().catch(() => [])), ...daangnChildRegionOptions].find(
      (option) => option.inValue === explicitInValue,
    );
    return {
      label: cleanText(options.daangnRegionLabel || known?.label || explicitInValue.split("-")[0]),
      fullLabel: cleanText(options.daangnRegionLabel || known?.fullLabel || explicitInValue),
      inValue: explicitInValue,
    };
  }

  const input = cleanText(options.daangnRegion);
  if (!input) {
    return null;
  }

  const suggestions = await suggestDaangnRegions(input);
  const exact =
    suggestions.find((option) => cleanText(option.label) === input) ||
    suggestions.find((option) => cleanText(option.fullLabel) === input);

  return exact || null;
}

function buildDaangnSearchUrl(query, inValue) {
  const url = new URL("https://www.daangn.com/kr/buy-sell/s/");
  url.searchParams.set("search", query);
  if (inValue) {
    url.searchParams.set("in", inValue);
  }
  return url.toString();
}

function extractDaangnArticlesFromHtml(html) {
  const remixContext = parseDaangnRemixContext(html);
  const loaderData = remixContext?.state?.loaderData || {};
  const stack = [loaderData];
  const visited = new WeakSet();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (current.allPage && Array.isArray(current.allPage.fleamarketArticles)) {
      return current.allPage.fleamarketArticles;
    }

    if (Array.isArray(current)) {
      current.forEach((item) => stack.push(item));
    } else {
      Object.values(current).forEach((item) => stack.push(item));
    }
  }

  return [];
}

function attachProviderMetadata(provider, items) {
  return dedupeItems(
    items.map((item, index) => ({
      ...item,
      providerId: provider.id,
      providerName: provider.name,
      providerAccent: provider.accent,
      sourceOrder: item.sourceOrder || index + 1,
      rank: index + 1,
      timestampMs: Number(item.timestampMs || 0),
    })),
  );
}

async function scrapeDaangn(query, options = {}) {
  const provider = PROVIDERS.find((entry) => entry.id === "daangn");
  const resolvedRegion = await resolveDaangnRegion(options).catch(() => null);
  const url = buildDaangnSearchUrl(query, resolvedRegion?.inValue || "");

  try {
    const { text } = await fetchText(url);
    const rawItems = extractDaangnArticlesFromHtml(text);
    const items = rawItems
      .map((item, index) => {
        const href = cleanText(item?.href || item?.url || "");
        if (!href) {
          return null;
        }

        return {
          title: cleanText(item?.title),
          price: formatPrice(item?.price),
          url: /^https?:/i.test(href) ? href : new URL(href, "https://www.daangn.com").toString(),
          imageUrl: cleanText(item?.thumbnail || item?.imageUrl || item?.images?.[0]?.url || ""),
          meta: [cleanText(item?.region?.name || item?.locationName), cleanText(item?.createdAt || item?.boostedAt)].filter(Boolean),
          timestampMs: parseTimestamp(item?.boostedAt || item?.createdAt || item?.updatedAt),
          sourceOrder: index + 1,
        };
      })
      .filter(Boolean);

    return {
      ...provider,
      items: attachProviderMetadata(provider, items),
      rawCount: rawItems.length || items.length,
      error: null,
      resolvedRegion,
    };
  } catch (error) {
    return {
      ...provider,
      items: [],
      rawCount: 0,
      error: error instanceof Error ? error.message : "당근마켓 검색에 실패했어요.",
      resolvedRegion,
    };
  }
}

function extractNextDataJson(html) {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  if (start < 0) {
    return null;
  }
  const end = html.indexOf("</script>", start);
  if (end < 0) {
    return null;
  }
  return JSON.parse(html.slice(start + marker.length, end));
}

function parseJoongnaPage(html) {
  const nextData = extractNextDataJson(html);
  if (!nextData) {
    return { items: [], totalSize: 0, pageCount: 0, error: "중고나라 데이터를 찾지 못했어요." };
  }

  const queries = nextData.props?.pageProps?.dehydratedState?.queries || [];
  const searchQuery = queries.find(
    (query) => query.queryKey?.[0] === "get-search-products" && Array.isArray(query.state?.data?.data?.items),
  );

  if (!searchQuery) {
    return { items: [], totalSize: 0, pageCount: 0, error: "중고나라 상품 데이터를 찾지 못했어요." };
  }

  const payload = searchQuery.state.data.data;
  const items = (payload.items || []).map((product) => ({
    title: cleanText(product.title),
    price: formatPrice(product.price),
    url: product.articleUrl || `https://web.joongna.com/product/${product.seq}`,
    imageUrl: cleanText(product.url || product.detailImgUrl || ""),
    meta: [cleanText(product.mainLocationName || product.locationNames?.[0]), cleanText(product.sortDate)].filter(Boolean),
    timestampMs: parseTimestamp(product.sortDate),
  }));

  const totalSize = Number(payload.totalSize || 0);
  return {
    items,
    totalSize,
    pageCount: totalSize > 0 ? Math.ceil(totalSize / 50) : 0,
    error: null,
  };
}

async function scrapeJoongna(query) {
  const provider = PROVIDERS.find((entry) => entry.id === "joongna");
  const items = [];
  let totalSize = 0;
  let pageCount = 0;
  let error = null;

  for (let page = 0; page < MAX_JOONGNA_PAGES; page += 1) {
    try {
      const { text } = await fetchText(`https://web.joongna.com/search/${encodeURIComponent(query)}?page=${page}`);
      const parsed = parseJoongnaPage(text);
      if (parsed.error && page === 0) {
        error = parsed.error;
      }

      totalSize = parsed.totalSize || totalSize;
      pageCount = parsed.pageCount || pageCount;

      if (!parsed.items.length) {
        break;
      }

      items.push(...parsed.items);

      if (pageCount > 0 && page + 1 >= pageCount) {
        break;
      }
    } catch (pageError) {
      error = pageError instanceof Error ? pageError.message : "중고나라 검색에 실패했어요.";
      break;
    }
  }

  return {
    ...provider,
    items: attachProviderMetadata(provider, items),
    rawCount: totalSize || items.length,
    error,
  };
}

function mapBunjangItem(rawItem) {
  if (!rawItem || rawItem.type !== "PRODUCT" || !rawItem.pid) {
    return null;
  }

  return {
    title: cleanText(rawItem.name),
    price: formatPrice(rawItem.price),
    url: `https://m.bunjang.co.kr/products/${rawItem.pid}`,
    imageUrl: cleanText(String(rawItem.product_image || "").replace("{res}", "720")),
    meta: [cleanText(rawItem.location), rawItem.free_shipping ? "무료배송" : "", cleanText(rawItem.tag)].filter(Boolean),
    timestampMs: parseTimestamp(rawItem.update_time),
  };
}

function buildBunjangQueryVariants(query) {
  const normalized = cleanText(query);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(/\s+/).filter((token) => token.length >= 2);
  const variants = [normalized];
  const condensed = normalized.replace(/\s+/g, "");
  if (condensed && condensed !== normalized) {
    variants.push(condensed);
  }
  if (tokens.length > 1) {
    variants.push(tokens[tokens.length - 1]);
    variants.push(tokens.slice(-2).join(" "));
    tokens
      .slice()
      .sort((left, right) => right.length - left.length)
      .forEach((token) => variants.push(token));
  }
  return [...new Set(variants.map(cleanText).filter(Boolean))];
}

function scoreBunjangItem(item, originalQuery, variant, variantIndex) {
  const title = cleanText(item.title).toLowerCase();
  const full = cleanText(originalQuery).toLowerCase();
  const short = cleanText(variant).toLowerCase();
  const tokens = full.split(/\s+/).filter(Boolean);
  let score = 0;
  if (title.includes(full)) score += 10000;
  if (tokens.length > 1 && tokens.every((token) => title.includes(token))) score += 6000;
  if (title.includes(short)) score += 2500;
  score += Math.max(0, 1000 - variantIndex * 120);
  score += Math.max(0, 100 - Number(item.variantRank || 0));
  return score;
}

async function scrapeBunjang(query, options = {}) {
  const provider = PROVIDERS.find((entry) => entry.id === "bunjang");
  const items = [];
  const seenUrls = new Set();
  let totalFetched = 0;
  let error = null;
  const order = options.sort === "latest" ? "&order=date" : "";
  const variants = buildBunjangQueryVariants(query);

  for (const [variantIndex, variant] of variants.entries()) {
    const maxPages = variantIndex === 0 ? MAX_BUNJANG_PAGES : Math.min(5, MAX_BUNJANG_PAGES);
    for (let page = 1; page <= maxPages; page += 1) {
      try {
        const url =
          `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(variant)}` +
          `&n=100&page=${page}&req_ref=search&stat_device=w&version=5${order}`;
        const { data } = await fetchJson(url);
        const batch = Array.isArray(data.list) ? data.list.map(mapBunjangItem).filter(Boolean) : [];
        totalFetched += batch.length;

        if (!batch.length) {
          break;
        }

        batch.forEach((item, itemIndex) => {
          if (!item?.url || seenUrls.has(item.url)) {
            return;
          }
          seenUrls.add(item.url);
          items.push({
            ...item,
            variantRank: itemIndex + 1 + (page - 1) * 100,
            matchScore: scoreBunjangItem(item, query, variant, variantIndex),
          });
        });

        if (batch.length < 100) {
          break;
        }
      } catch (pageError) {
        error = pageError instanceof Error ? pageError.message : "번개장터 검색에 실패했어요.";
        break;
      }
    }
  }

  const ranked = [...items].sort((left, right) => {
    if ((right.matchScore || 0) !== (left.matchScore || 0)) {
      return (right.matchScore || 0) - (left.matchScore || 0);
    }
    if ((right.timestampMs || 0) !== (left.timestampMs || 0)) {
      return (right.timestampMs || 0) - (left.timestampMs || 0);
    }
    return (left.variantRank || 0) - (right.variantRank || 0);
  });

  return {
    ...provider,
    items: attachProviderMetadata(provider, ranked),
    rawCount: totalFetched || ranked.length,
    error,
  };
}

function sortMergedItems(items, sort) {
  const cloned = [...items];
  if (sort === "priceAsc") {
    return cloned.sort((left, right) => {
      const leftPrice = parseNumericPrice(left.price) || Number.MAX_SAFE_INTEGER;
      const rightPrice = parseNumericPrice(right.price) || Number.MAX_SAFE_INTEGER;
      return leftPrice - rightPrice;
    });
  }
  if (sort === "priceDesc") {
    return cloned.sort((left, right) => (parseNumericPrice(right.price) || 0) - (parseNumericPrice(left.price) || 0));
  }
  if (sort === "latest") {
    return cloned.sort((left, right) => (right.timestampMs || 0) - (left.timestampMs || 0));
  }
  return cloned.sort((left, right) => (left.sourceOrder || 0) - (right.sourceOrder || 0));
}

export async function searchAllMarkets(options = {}) {
  const query = cleanText(options.query);
  if (!query) {
    return {
      query: "",
      providers: [],
      items: [],
      notices: [],
      searchedAt: new Date().toISOString(),
      daangnRegionResolved: null,
    };
  }

  const [daangn, joongna, bunjang] = await Promise.all([
    scrapeDaangn(query, options),
    scrapeJoongna(query),
    scrapeBunjang(query, options),
  ]);

  const providers = [daangn, joongna, bunjang];
  const items = sortMergedItems(
    providers.flatMap((provider) => provider.items).map((item, index) => ({
      ...item,
      sourceOrder: item.sourceOrder || index + 1,
    })),
    options.sort || "relevance",
  );

  const notices = [
    daangn.resolvedRegion
      ? `당근마켓은 "${daangn.resolvedRegion.fullLabel || daangn.resolvedRegion.label}" 지역 기준으로 검색했어요.`
      : "당근마켓은 지역을 선택하지 않으면 공개 검색 기준으로 조회해요.",
    "웹 버전은 서버에서 검색 결과를 모아 화면에 보여줍니다.",
    "각 플랫폼 구조가 바뀌면 검색 수가 달라질 수 있어요.",
  ];

  return {
    query,
    providers,
    items,
    notices,
    searchedAt: new Date().toISOString(),
    daangnRegionResolved: daangn.resolvedRegion || null,
  };
}
