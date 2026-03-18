"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PROVIDERS,
  PROVIDER_LINKS,
  SELL_PRESETS,
  cleanText,
  formatPrice,
} from "@/lib/market-ui";

const LABELS = {
  title: "판매 초안",
  body: "한 번 작성한 내용을 바탕으로 플랫폼별 등록 페이지에 바로 옮겨 적을 수 있어요.",
  draftCopy: "초안 복사",
  productTitle: "제목",
  price: "가격",
  preset: "카테고리 예시",
  commonCategory: "공통 카테고리",
  region: "지역",
  description: "설명",
  photos: "사진",
  platforms: "플랫폼",
  daangnCategory: "당근마켓 카테고리",
  joongnaCategory: "중고나라 카테고리",
  bunjangCategory: "번개장터 카테고리",
  custom: "직접 입력",
  titlePlaceholder: "비앙키 니로네 로드 자전거",
  pricePlaceholder: "430000",
  categoryPlaceholder: "스포츠 / 자전거",
  regionPlaceholder: "광명시 하안동",
  categoryFallback: "비워두면 공통 카테고리를 사용해요",
  descriptionPlaceholder: "구매 시기, 상태, 구성품, 거래 방식, 네고 여부 등을 적어주세요.",
  photoHelp: "사진을 고른 뒤 각 플랫폼 등록 폼에서 첨부해 주세요.",
  photoReady: "장 준비됨",
  summary: "초안 요약",
  photoPreview: "사진 미리보기",
  handoff: "플랫폼 등록 연결",
  handoffBody: "플랫폼별 카테고리와 초안 내용을 복사한 뒤 공식 등록 페이지로 이동할 수 있어요.",
  openOfficial: "공식 페이지 열기",
  notSet: "미입력",
  none: "없음",
  photoEmpty: "아직 추가한 사진이 없어요.",
};

export default function SellDraftPage() {
  const [preset, setPreset] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [commonCategory, setCommonCategory] = useState("");
  const [categoryMap, setCategoryMap] = useState({ daangn: "", joongna: "", bunjang: "" });
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [platforms, setPlatforms] = useState({ daangn: true, joongna: true, bunjang: true });
  const [hint, setHint] = useState("초안과 사진을 먼저 준비한 뒤 각 플랫폼 등록 페이지로 이동해 주세요.");

  const photoUrls = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);

  useEffect(() => {
    return () => {
      photoUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoUrls]);

  const draft = useMemo(
    () => ({
      title: cleanText(title),
      price: cleanText(price),
      commonCategory: cleanText(commonCategory),
      categoryMap: {
        daangn: cleanText(categoryMap.daangn || commonCategory),
        joongna: cleanText(categoryMap.joongna || commonCategory),
        bunjang: cleanText(categoryMap.bunjang || commonCategory),
      },
      region: cleanText(region),
      description: cleanText(description),
      platforms: Object.entries(platforms)
        .filter(([, enabled]) => enabled)
        .map(([id]) => id),
    }),
    [title, price, commonCategory, categoryMap, region, description, platforms],
  );

  function applyPreset(nextPreset) {
    setPreset(nextPreset);
    const selected = SELL_PRESETS.find((item) => item.id === nextPreset);
    if (!selected) return;
    setCommonCategory(selected.common);
    setCategoryMap(selected.map);
  }

  async function copyDraft(providerId) {
    if (!draft.title) {
      setHint("제목을 먼저 입력해 주세요.");
      return;
    }

    const content = [
      draft.title,
      draft.price ? `${LABELS.price}: ${formatPrice(draft.price)}` : "",
      `${LABELS.commonCategory}: ${draft.categoryMap[providerId] || draft.commonCategory || LABELS.notSet}`,
      draft.region ? `${LABELS.region}: ${draft.region}` : "",
      draft.description,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(content);
      setHint(`${PROVIDERS[providerId]}용 초안을 복사했어요.`);
    } catch {
      setHint("초안 복사에 실패했어요.");
    }
  }

  function openPlatform(providerId) {
    if (!draft.title || !draft.price || !draft.description) {
      setHint("제목, 가격, 설명을 먼저 입력해 주세요.");
      return;
    }
    window.open(PROVIDER_LINKS[providerId], "_blank", "noopener,noreferrer");
  }

  return (
    <section className="view">
      <section className="seller-layout">
        <article className="panel seller-panel">
          <div className="panel__header">
            <div>
              <h2>{LABELS.title}</h2>
              <p>{LABELS.body}</p>
            </div>
          </div>

          <div className="seller-grid seller-grid--two">
            <label className="field">
              <span>{LABELS.productTitle}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={LABELS.titlePlaceholder} />
            </label>
            <label className="field">
              <span>{LABELS.price}</span>
              <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={LABELS.pricePlaceholder} />
            </label>
          </div>

          <div className="seller-grid seller-grid--three">
            <label className="field">
              <span>{LABELS.preset}</span>
              <select value={preset} onChange={(event) => applyPreset(event.target.value)}>
                <option value="">{LABELS.custom}</option>
                {SELL_PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{LABELS.commonCategory}</span>
              <input
                value={commonCategory}
                onChange={(event) => setCommonCategory(event.target.value)}
                placeholder={LABELS.categoryPlaceholder}
              />
            </label>
            <label className="field">
              <span>{LABELS.region}</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder={LABELS.regionPlaceholder} />
            </label>
          </div>

          <div className="seller-grid seller-grid--three">
            <label className="field">
              <span>{LABELS.daangnCategory}</span>
              <input
                value={categoryMap.daangn}
                onChange={(event) => setCategoryMap((current) => ({ ...current, daangn: event.target.value }))}
                placeholder={LABELS.categoryFallback}
              />
            </label>
            <label className="field">
              <span>{LABELS.joongnaCategory}</span>
              <input
                value={categoryMap.joongna}
                onChange={(event) => setCategoryMap((current) => ({ ...current, joongna: event.target.value }))}
                placeholder={LABELS.categoryFallback}
              />
            </label>
            <label className="field">
              <span>{LABELS.bunjangCategory}</span>
              <input
                value={categoryMap.bunjang}
                onChange={(event) => setCategoryMap((current) => ({ ...current, bunjang: event.target.value }))}
                placeholder={LABELS.categoryFallback}
              />
            </label>
          </div>

          <label className="field">
            <span>{LABELS.description}</span>
            <textarea
              rows={8}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={LABELS.descriptionPlaceholder}
            />
          </label>

          <div className="seller-grid seller-grid--split">
            <label className="field">
              <span>{LABELS.photos}</span>
              <input type="file" multiple accept="image/*" onChange={(event) => setPhotos([...(event.target.files || [])])} />
              <small>{photos.length ? `${photos.length}장 준비됨` : LABELS.photoHelp}</small>
            </label>

            <div className="field">
              <span>{LABELS.platforms}</span>
              <div className="toggle-group">
                {Object.entries(PROVIDERS).map(([providerId, name]) => (
                  <label key={providerId} className="toggle-pill">
                    <input
                      type="checkbox"
                      checked={platforms[providerId]}
                      onChange={(event) => setPlatforms((current) => ({ ...current, [providerId]: event.target.checked }))}
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="seller-hint">{hint}</div>
        </article>

        <aside className="seller-side">
          <article className="panel">
            <h2>{LABELS.summary}</h2>
            <div className="summary-list">
              <div><span>{LABELS.productTitle}</span><strong>{draft.title || LABELS.notSet}</strong></div>
              <div><span>{LABELS.price}</span><strong>{draft.price ? formatPrice(draft.price) : LABELS.notSet}</strong></div>
              <div><span>{LABELS.commonCategory}</span><strong>{draft.commonCategory || LABELS.notSet}</strong></div>
              <div><span>{LABELS.region}</span><strong>{draft.region || LABELS.notSet}</strong></div>
              <div><span>{LABELS.platforms}</span><strong>{draft.platforms.length ? draft.platforms.map((id) => PROVIDERS[id]).join(", ") : LABELS.none}</strong></div>
            </div>
          </article>

          <article className="panel">
            <h2>{LABELS.photoPreview}</h2>
            {photoUrls.length ? (
              <div className="photo-grid">
                {photoUrls.map((url, index) => (
                  <div key={url} className="photo-item">
                    <img src={url} alt={`초안 사진 ${index + 1}`} />
                    <span>{index + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-copy">{LABELS.photoEmpty}</div>
            )}
          </article>

          <article className="panel">
            <h2>{LABELS.handoff}</h2>
            <p>{LABELS.handoffBody}</p>
            <div className="seller-platform-grid">
              {Object.entries(PROVIDERS)
                .filter(([providerId]) => platforms[providerId])
                .map(([providerId, name]) => (
                  <article key={providerId} className="seller-platform-card">
                    <div className="seller-platform-card__top">
                      <strong>{name}</strong>
                    </div>
                    <div className="seller-platform-card__body">
                      <div className="seller-platform-card__line">
                        <span>{LABELS.commonCategory}</span>
                        <strong>{draft.categoryMap[providerId] || draft.commonCategory || LABELS.notSet}</strong>
                      </div>
                      <div className="seller-platform-card__line">
                        <span>{LABELS.photos}</span>
                        <strong>{photos.length}</strong>
                      </div>
                      <div className="seller-platform-card__actions">
                        <button className="secondary-button" onClick={() => copyDraft(providerId)}>
                          {LABELS.draftCopy}
                        </button>
                        <button className="primary-button" onClick={() => openPlatform(providerId)}>
                          {LABELS.openOfficial}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </article>
        </aside>
      </section>
    </section>
  );
}
