"use client";

const MAX_PRICE_LIMIT = 20_000_000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback) {
  const numeric = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatWon(value) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function PriceRangeControl({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}) {
  const sliderMin = clamp(toNumber(minPrice, 0), 0, MAX_PRICE_LIMIT);
  const rawMax = maxPrice === "" ? MAX_PRICE_LIMIT : toNumber(maxPrice, MAX_PRICE_LIMIT);
  const sliderMax = clamp(rawMax, sliderMin, MAX_PRICE_LIMIT);
  const leftPercent = (sliderMin / MAX_PRICE_LIMIT) * 100;
  const rightPercent = (sliderMax / MAX_PRICE_LIMIT) * 100;

  function handleMinSliderChange(event) {
    const nextValue = clamp(Number(event.target.value), 0, sliderMax);
    onMinPriceChange(String(nextValue));
  }

  function handleMaxSliderChange(event) {
    const nextValue = clamp(Number(event.target.value), sliderMin, MAX_PRICE_LIMIT);
    onMaxPriceChange(nextValue >= MAX_PRICE_LIMIT ? "" : String(nextValue));
  }

  return (
    <div className="price-range-control">
      <div className="price-range-slider">
        <div className="price-range-slider__track" />
        <div
          className="price-range-slider__active"
          style={{
            left: `${leftPercent}%`,
            width: `${Math.max(0, rightPercent - leftPercent)}%`,
          }}
        />

        <input
          type="range"
          min="0"
          max={MAX_PRICE_LIMIT}
          step="10000"
          value={sliderMin}
          onChange={handleMinSliderChange}
          className="price-range-slider__input"
          aria-label="최소 가격 슬라이더"
        />
        <input
          type="range"
          min="0"
          max={MAX_PRICE_LIMIT}
          step="10000"
          value={sliderMax}
          onChange={handleMaxSliderChange}
          className="price-range-slider__input"
          aria-label="최대 가격 슬라이더"
        />
      </div>

      <div className="price-range-slider__labels" aria-hidden="true">
        <span>{formatWon(0)}</span>
        <span>{formatWon(sliderMin)}</span>
        <span>{maxPrice === "" ? "제한 없음" : formatWon(sliderMax)}</span>
        <span>{formatWon(MAX_PRICE_LIMIT)}</span>
      </div>
    </div>
  );
}
