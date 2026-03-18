"use client";
import { useEffect, useRef, useState } from "react";
const BRAND="\uC7A5\uD130\uBAA8\uC544";
const RECENT_KEY="jangteomoa-web.recent-searches";
const SIZES=[25,50,100];
const P={daangn:"\uB2F9\uADFC\uB9C8\uCF13",joongna:"\uC911\uACE0\uB098\uB77C",bunjang:"\uBC88\uAC1C\uC7A5\uD130"};
const L={daangn:"https://www.daangn.com/kr/",joongna:"https://web.joongna.com/product/form?type=regist",bunjang:"https://m.bunjang.co.kr/products/new"};
const A={daangn:"#ff6f0f",joongna:"#2f80ed",bunjang:"#ef466f"};
const PRESETS=[
{id:"bike",label:"\uC790\uC804\uAC70",common:"\uC2A4\uD3EC\uCE20 / \uC790\uC804\uAC70",map:{daangn:"\uC2A4\uD3EC\uCE20",joongna:"\uC2A4\uD3EC\uCE20",bunjang:"\uC790\uC804\uAC70"}},
{id:"phone",label:"\uD734\uB300\uD3F0",common:"\uB514\uC9C0\uD138 / \uD734\uB300\uD3F0",map:{daangn:"\uB514\uC9C0\uD138",joongna:"\uD734\uB300\uD3F0",bunjang:"\uD734\uB300\uD3F0"}},
{id:"laptop",label:"\uB178\uD2B8\uBD81",common:"\uB514\uC9C0\uD138 / \uB178\uD2B8\uBD81",map:{daangn:"\uB514\uC9C0\uD138",joongna:"\uB178\uD2B8\uBD81",bunjang:"\uB178\uD2B8\uBD81"}},
{id:"fashion",label:"\uD328\uC158",common:"\uD328\uC158 / \uC758\uB958",map:{daangn:"\uD328\uC158",joongna:"\uC758\uB958",bunjang:"\uD328\uC158"}},
];
const LABELS={
appSubtitle:"중고거래 통합검색 웹 앱",
search:"검색",
sell:"판매글 작성",
heroEyebrow:"통합 검색",
heroTitle:"세 플랫폼 매물을 한 번에 비교해보세요",
heroDescription:"당근마켓, 중고나라, 번개장터 결과를 한 화면에 모아보고 가격대·정렬·플랫폼 필터로 바로 걸러볼 수 있어요.",
recent:"최근 검색어",
recentEmpty:"아직 최근 검색어가 없어요.",
shortcuts:"바로 이동",
shortcutsBody:"원본 플랫폼로 이동해 매물이나 판매 페이지를 직접 확인해보세요.",
filters:"검색 조건",
filtersBody:"검색어, 당근 지역, 가격 범위, 정렬, 플랫폼 필터를 조합해보세요.",
pageSize:"페이지 크기",
keyword:"검색어",
keywordPlaceholder:"아이폰 15, 브롬톤, 플레이스테이션 5",
region:"당근 지역",
regionPlaceholder:"하안동, 성수동, 서초동",
minPrice:"최소 가격",
maxPrice:"최대 가격",
unlimited:"제한 없음",
sort:"정렬",
latest:"최신순",
relevance:"관련순",
lowPrice:"낮은 가격순",
highPrice:"높은 가격순",
searching:"검색 중...",
results:"검색 결과",
resultsBody:"플랫폼별 수집 결과를 통합 순서로 보여줘요.",
providerState:"플랫폼 상태",
updated:"업데이트",
page:"페이지",
visible:"표시",
collected:"수집",
fetchState:"매물을 가져오는 중...",
empty:"검색어를 입력하면 세 플랫폼 매물을 한 번에 불러와요.",
noImage:"이미지 없음",
detailFallback:"자세한 내용은 원본 게시글에서 확인해주세요.",
openListing:"게시글 보기",
prev:"이전",
next:"다음",
summaryResults:"결과 수",
summaryPage:"페이지",
summaryUpdated:"검색 시각",
sellerTitle:"판매 초안",
sellerBody:"웹 버전은 초안 작성, 사진 미리보기, 플랫폼별 카테고리 매핑, 공식 페이지 연결에 맞게 정리했어요.",
draftCopy:"초안 복사",
productTitle:"제목",
price:"가격",
preset:"카테고리 예시",
commonCategory:"공통 카테고리",
productRegion:"지역",
description:"설명",
photos:"사진",
platforms:"플랫폼",
daangnCategory:"당근마켓 카테고리",
joongnaCategory:"중고나라 카테고리",
bunjangCategory:"번개장터 카테고리",
customInput:"직접 입력",
titlePlaceholder:"비앙키 니로네 로드 자전거",
pricePlaceholder:"430000",
commonCategoryPlaceholder:"스포츠 / 자전거",
sellerRegionPlaceholder:"광명시 하안동",
categoryFallback:"비워두면 공통 카테고리를 사용해요",
descriptionPlaceholder:"구매 시기, 상태, 구성품, 거래 방식, 네고 여부 등을 적어주세요.",
photoHelp:"사진을 고른 뒤 각 플랫폼 등록 폼에 첨부해주세요.",
photoReady:"장 준비됨",
draftSummary:"초안 요약",
photoPreview:"사진 미리보기",
handoff:"플랫폼 등록 연결",
handoffBody:"초안을 복사한 뒤 공식 페이지를 새 탭으로 열어주세요.",
openOfficial:"공식 등록 페이지 열기",
notSet:"미입력",
none:"없음",
photoEmpty:"아직 추가된 사진이 없어요.",
daangnNotice:"당근마켓은 당근 공개 검색 기준으로 조회해요.",
marketplaceNote:"플랫폼 구조가 바뀌면 검색 결과 수가 달라질 수 있어요."
};
const t=(v)=>String(v||"").replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
const priceNum=(v)=>{const d=String(v||"").replace(/[^\d]/g,"");return d?Number(d):0;};
const price=(v)=>priceNum(v)?`${priceNum(v).toLocaleString("ko-KR")}\uC6D0`:"\uAC00\uACA9 \uC815\uBCF4 \uC5C6\uC74C";
const when=(v)=>{try{return v?new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v)):"-";}catch{return "-";}};
const init=()=>({providers:[],items:[],searchedAt:"",daangnRegionResolved:null});
export default function Page(){
const [tab,setTab]=useState("search"),[query,setQuery]=useState(""),[region,setRegion]=useState(""),[picked,setPicked]=useState(null),[sugs,setSugs]=useState([]),[showSugs,setShowSugs]=useState(false),[idx,setIdx]=useState(-1),[loading,setLoading]=useState(false),[data,setData]=useState(init()),[filter,setFilter]=useState({daangn:true,joongna:true,bunjang:true}),[minPrice,setMinPrice]=useState(""),[maxPrice,setMaxPrice]=useState(""),[sort,setSort]=useState("latest"),[pageSize,setPageSize]=useState(50),[page,setPage]=useState(1),[recent,setRecent]=useState([]),[preset,setPreset]=useState(""),[title,setTitle]=useState(""),[sellPrice,setSellPrice]=useState(""),[commonCategory,setCommonCategory]=useState(""),[categoryMap,setCategoryMap]=useState({daangn:"",joongna:"",bunjang:""}),[sellRegion,setSellRegion]=useState(""),[desc,setDesc]=useState(""),[sellPlatforms,setSellPlatforms]=useState({daangn:true,joongna:true,bunjang:true}),[photos,setPhotos]=useState([]),[photoUrls,setPhotoUrls]=useState([]),[hint,setHint]=useState("\uCD08\uC548\uACFC \uC0AC\uC9C4\uC744 \uBA3C\uC800 \uC900\uBE44\uD55C \uB4A4 \uAC01 \uD50C\uB7AB\uD3FC \uB4F1\uB85D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD574\uC8FC\uC138\uC694.");
const blurRef=useRef(null);
useEffect(()=>{try{const saved=JSON.parse(window.localStorage.getItem(RECENT_KEY)||"[]");setRecent(Array.isArray(saved)?saved.map(t).filter(Boolean).slice(0,10):[]);}catch{setRecent([]);}},[]);
useEffect(()=>{if(!region){setSugs([]);setShowSugs(false);return;} const timer=window.setTimeout(async()=>{try{const r=await fetch(`/api/daangn-regions?query=${encodeURIComponent(region)}`,{cache:"no-store"});const p=await r.json();const next=Array.isArray(p.suggestions)?p.suggestions:[];setSugs(next);setShowSugs(Boolean(next.length));setIdx(next.length?0:-1);}catch{setSugs([]);setShowSugs(false);}},220); return()=>window.clearTimeout(timer);},[region]);
useEffect(()=>{const urls=photos.map((f)=>URL.createObjectURL(f));setPhotoUrls(urls);return()=>urls.forEach((u)=>URL.revokeObjectURL(u));},[photos]);
const items=data.items.filter((it)=>filter[it.providerId]).filter((it)=>{const n=priceNum(it.price); if(minPrice&&n&&n<Number(minPrice)) return false; if(maxPrice&&n&&n>Number(maxPrice)) return false; return true;}).sort((a,b)=>sort==="priceAsc"?(priceNum(a.price)||Number.MAX_SAFE_INTEGER)-(priceNum(b.price)||Number.MAX_SAFE_INTEGER):sort==="priceDesc"?(priceNum(b.price)||0)-(priceNum(a.price)||0):sort==="relevance"?(a.sourceOrder||0)-(b.sourceOrder||0):(b.timestampMs||0)-(a.timestampMs||0));
const totalPages=Math.max(1,Math.ceil(items.length/pageSize));
const visible=items.slice((page-1)*pageSize,page*pageSize);
useEffect(()=>{if(page>totalPages)setPage(totalPages);},[page,totalPages]);
const providerCards=Object.keys(P).map((id)=>{const provider=data.providers.find((e)=>e.id===id)||{}; return {id,name:P[id],accent:A[id],visible:items.filter((it)=>it.providerId===id).length,collected:Number(provider.rawCount||data.items.filter((it)=>it.providerId===id).length||0),error:provider.error||""};});
const draft={title:t(title),price:t(sellPrice),commonCategory:t(commonCategory),categoryMap:{daangn:t(categoryMap.daangn||commonCategory),joongna:t(categoryMap.joongna||commonCategory),bunjang:t(categoryMap.bunjang||commonCategory)},region:t(sellRegion),description:t(desc),platforms:Object.entries(sellPlatforms).filter(([,v])=>v).map(([id])=>id)};
async function search(next=query){const q=t(next); if(!q)return; setLoading(true); setPage(1); try{const r=await fetch("/api/search",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:q,daangnRegion:t(region),daangnRegionInValue:picked?.inValue||"",daangnRegionLabel:picked?.label||"",sort})}); const p=await r.json(); if(!r.ok) throw new Error(); setData({providers:Array.isArray(p.providers)?p.providers:[],items:Array.isArray(p.items)?p.items:[],searchedAt:p.searchedAt||new Date().toISOString(),daangnRegionResolved:p.daangnRegionResolved||null}); if(p.daangnRegionResolved){setPicked(p.daangnRegionResolved);setRegion(p.daangnRegionResolved.label||"");} setRecent((current)=>{const nextRecent=[q,...current.filter((v)=>v!==q)].slice(0,10); window.localStorage.setItem(RECENT_KEY,JSON.stringify(nextRecent)); return nextRecent;});}catch{setData(init());}finally{setLoading(false);}}
function chooseRegion(item){setPicked(item);setRegion(item.label);setShowSugs(false);} 
function applyPreset(value){setPreset(value); const selected=PRESETS.find((item)=>item.id===value); if(!selected)return; setCommonCategory(selected.common); setCategoryMap(selected.map);} 
async function copyDraft(id){if(!draft.title){setHint("\uC81C\uBAA9\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694.");return;} try{await navigator.clipboard.writeText([draft.title,draft.price?`${LABELS.price}: ${price(draft.price)}`:"",`${LABELS.commonCategory}: ${draft.categoryMap[id]||draft.commonCategory}`,draft.region?`${LABELS.productRegion}: ${draft.region}`:"",draft.description].filter(Boolean).join("\n")); setHint(`${P[id]} \uC6A9 \uCD08\uC548\uC744 \uBCF5\uC0AC\uD588\uC5B4\uC694.`);}catch{setHint("\uBCF5\uC0AC\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694.");}}
function openPlatform(id){if(!draft.title||!draft.price||!draft.description){setHint("\uC81C\uBAA9, \uAC00\uACA9, \uC124\uBA85\uC744 \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694.");return;} window.open(L[id],"_blank","noopener,noreferrer");}
return <main className="web-page">
<header className="shell-topbar"><div className="shell-topbar__inner"><div className="brand"><img className="brand__logo" src="/jangteomoa-logo.png" alt={`${BRAND} \uB85C\uACE0`} /><div className="brand__text"><strong>{BRAND}</strong><span>{LABELS.appSubtitle}</span></div></div><div className="topbar-tabs"><button className={tab==="search"?"topbar-tab topbar-tab--active":"topbar-tab"} onClick={()=>setTab("search")}>{LABELS.search}</button><button className={tab==="seller"?"topbar-tab topbar-tab--active":"topbar-tab"} onClick={()=>setTab("seller")}>{LABELS.sell}</button></div><div className="topbar-links">{Object.keys(P).map((id)=><a key={id} href={L[id]} target="_blank" rel="noreferrer">{P[id]}</a>)}</div></div></header>
{tab==="search"?<section className="view"><section className="hero-layout"><article className="hero-banner"><span className="eyebrow">{LABELS.heroEyebrow}</span><h1>{LABELS.heroTitle}</h1><p>{LABELS.heroDescription}</p><div className="hero-badges">{Object.keys(P).map((id)=><span key={id} className="hero-badge">{P[id]}</span>)}</div></article><div className="hero-side"><article className="quick-card"><span className="section-label">{LABELS.recent}</span><div className="chip-wrap">{recent.length?recent.map((item)=><button key={item} className="chip" onClick={()=>{setQuery(item);search(item);}}>{item}</button>):<div className="empty-copy">{LABELS.recentEmpty}</div>}</div></article><article className="quick-card"><span className="section-label">{LABELS.shortcuts}</span><p>{LABELS.shortcutsBody}</p><div className="link-list">{Object.keys(P).map((id)=><a key={id} className="platform-link-card" href={L[id]} target="_blank" rel="noreferrer"><span className="platform-link-card__dot" style={{background:A[id]}} /><strong>{P[id]}</strong></a>)}</div></article></div></section><section className="search-layout"><aside className="search-sidebar"><article className="panel panel--sticky"><div className="panel__header panel__header--stack"><div><h2>{LABELS.filters}</h2><p>{LABELS.filtersBody}</p></div></div><div className="sidebar-group"><span className="sidebar-title">{LABELS.pageSize}</span><div className="page-size">{SIZES.map((size)=><button key={size} className={pageSize===size?"page-size__button page-size__button--active":"page-size__button"} onClick={()=>{setPageSize(size);setPage(1);}}>{size}개</button>)}</div></div><label className="field"><span>{LABELS.keyword}</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={LABELS.keywordPlaceholder} /></label><label className="field field--region"><span>{LABELS.region}</span><input value={region} onChange={(e)=>{setRegion(e.target.value); if(picked&&t(e.target.value)!==t(picked.label))setPicked(null);}} onFocus={()=>setShowSugs(Boolean(sugs.length))} onBlur={()=>{blurRef.current=window.setTimeout(()=>setShowSugs(false),120);}} onKeyDown={(e)=>{if(!sugs.length)return; if(e.key==="ArrowDown"){e.preventDefault();setIdx((v)=>v>=sugs.length-1?0:v+1);} if(e.key==="ArrowUp"){e.preventDefault();setIdx((v)=>v<=0?sugs.length-1:v-1);} if(e.key==="Enter"&&showSugs){e.preventDefault();const item=sugs[idx]||sugs[0]; if(item) chooseRegion(item);}}} placeholder={LABELS.regionPlaceholder} />{showSugs&&sugs.length>0?<div className="suggestions">{sugs.map((item,i)=><button key={item.inValue} className={i===idx?"suggestion suggestion--active":"suggestion"} onMouseDown={(e)=>{e.preventDefault(); if(blurRef.current)window.clearTimeout(blurRef.current); chooseRegion(item);}}><strong>{item.label}</strong><span>{item.fullLabel||item.label}</span></button>)}</div>:null}</label><div className="field-row"><label className="field"><span>{LABELS.minPrice}</span><input type="number" value={minPrice} onChange={(e)=>{setMinPrice(e.target.value);setPage(1);}} placeholder="0" /></label><label className="field"><span>{LABELS.maxPrice}</span><input type="number" value={maxPrice} onChange={(e)=>{setMaxPrice(e.target.value);setPage(1);}} placeholder={LABELS.unlimited} /></label></div><label className="field"><span>{LABELS.sort}</span><select value={sort} onChange={(e)=>{setSort(e.target.value);setPage(1);}}><option value="latest">{LABELS.latest}</option><option value="relevance">{LABELS.relevance}</option><option value="priceAsc">{LABELS.lowPrice}</option><option value="priceDesc">{LABELS.highPrice}</option></select></label><div className="sidebar-group"><span className="sidebar-title">{LABELS.platforms}</span><div className="toggle-group">{Object.keys(P).map((id)=><label key={id} className="toggle-pill"><input type="checkbox" checked={filter[id]} onChange={(e)=>{setFilter((current)=>({...current,[id]:e.target.checked}));setPage(1);}} /><span>{P[id]}</span></label>)}</div></div><button className="primary-button" onClick={()=>search()}>{loading?LABELS.searching:LABELS.search}</button></article></aside><div className="search-content"><section className="summary-grid"><article className="summary-card"><span>{LABELS.summaryResults}</span><strong>{items.length}</strong></article><article className="summary-card"><span>{LABELS.summaryPage}</span><strong>{page} / {totalPages}</strong></article><article className="summary-card"><span>{LABELS.summaryUpdated}</span><strong>{when(data.searchedAt)}</strong></article></section><section className="panel"><div className="panel__header"><div><h2>{LABELS.providerState}</h2><p>{loading?LABELS.fetchState:LABELS.resultsBody}</p></div></div><div className="provider-grid">{providerCards.map((provider)=><article key={provider.id} className="provider-card"><div className="provider-card__title"><span className="provider-card__dot" style={{background:provider.accent}} /><strong>{provider.name}</strong></div><p>{provider.error||`${provider.visible}${LABELS.visible} / ${provider.collected}${LABELS.collected}`}</p></article>)}</div></section><section className="panel"><div className="panel__header"><div><h2>{LABELS.results}</h2><p>{LABELS.resultsBody}</p></div></div><div className="notice-wrap"><div className="notice-pill">{data.daangnRegionResolved?.fullLabel?`${P.daangn}은 "${data.daangnRegionResolved.fullLabel}" 기준으로 검색했어요.`:LABELS.daangnNotice}</div><div className="notice-pill">{LABELS.marketplaceNote}</div></div>{visible.length?<div className="results-grid">{visible.map((item)=><article key={item.url} className="result-card"><div className="result-card__image-wrap">{item.imageUrl?<img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" />:<div className="result-card__image-empty">{LABELS.noImage}</div>}<span className="result-card__badge" style={{color:A[item.providerId]||item.providerAccent,background:`${A[item.providerId]||item.providerAccent||"#2f80ed"}18`}}>{P[item.providerId]||item.providerName}</span></div><div className="result-card__body"><strong className="result-card__price">{item.price||"\uAC00\uACA9 \uC815\uBCF4 \uC5C6\uC74C"}</strong><h3>{item.title}</h3><p>{(item.meta||[]).join(" · ")||LABELS.detailFallback}</p><a className="result-card__link" href={item.url} target="_blank" rel="noreferrer">{LABELS.openListing}</a></div></article>)}</div>:<div className="empty-state">{LABELS.empty}</div>}<div className="pagination"><button disabled={page<=1} onClick={()=>setPage((v)=>Math.max(1,v-1))}>{LABELS.prev}</button><span>{page} / {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage((v)=>Math.min(totalPages,v+1))}>{LABELS.next}</button></div></section></div></section></section>:<section className="view"><section className="seller-layout"><article className="panel"><div className="panel__header"><div><h2>{LABELS.sellerTitle}</h2><p>{LABELS.sellerBody}</p></div><button className="secondary-button" onClick={()=>copyDraft("joongna")}>{LABELS.draftCopy}</button></div><div className="seller-grid seller-grid--two"><label className="field"><span>{LABELS.productTitle}</span><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={LABELS.titlePlaceholder} /></label><label className="field"><span>{LABELS.price}</span><input type="number" value={sellPrice} onChange={(e)=>setSellPrice(e.target.value)} placeholder={LABELS.pricePlaceholder} /></label></div><div className="seller-grid seller-grid--three"><label className="field"><span>{LABELS.preset}</span><select value={preset} onChange={(e)=>applyPreset(e.target.value)}><option value="">{LABELS.customInput}</option>{PRESETS.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="field"><span>{LABELS.commonCategory}</span><input value={commonCategory} onChange={(e)=>setCommonCategory(e.target.value)} placeholder={LABELS.commonCategoryPlaceholder} /></label><label className="field"><span>{LABELS.productRegion}</span><input value={sellRegion} onChange={(e)=>setSellRegion(e.target.value)} placeholder={LABELS.sellerRegionPlaceholder} /></label></div><div className="seller-grid seller-grid--three"><label className="field"><span>{LABELS.daangnCategory}</span><input value={categoryMap.daangn} onChange={(e)=>setCategoryMap((current)=>({...current,daangn:e.target.value}))} placeholder={LABELS.categoryFallback} /></label><label className="field"><span>{LABELS.joongnaCategory}</span><input value={categoryMap.joongna} onChange={(e)=>setCategoryMap((current)=>({...current,joongna:e.target.value}))} placeholder={LABELS.categoryFallback} /></label><label className="field"><span>{LABELS.bunjangCategory}</span><input value={categoryMap.bunjang} onChange={(e)=>setCategoryMap((current)=>({...current,bunjang:e.target.value}))} placeholder={LABELS.categoryFallback} /></label></div><label className="field"><span>{LABELS.description}</span><textarea rows={8} value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder={LABELS.descriptionPlaceholder} /></label><div className="seller-grid seller-grid--split"><label className="field"><span>{LABELS.photos}</span><input type="file" multiple accept="image/*" onChange={(e)=>setPhotos([...(e.target.files||[])])} /><small>{photos.length?`${photos.length}${LABELS.photoReady}`:LABELS.photoHelp}</small></label><div className="field"><span>{LABELS.platforms}</span><div className="toggle-group">{Object.keys(P).map((id)=><label key={id} className="toggle-pill"><input type="checkbox" checked={sellPlatforms[id]} onChange={(e)=>setSellPlatforms((current)=>({...current,[id]:e.target.checked}))} /><span>{P[id]}</span></label>)}</div></div></div><div className="seller-hint">{hint}</div></article><aside className="seller-side"><article className="panel"><h2>{LABELS.draftSummary}</h2><div className="summary-list"><div><span>{LABELS.productTitle}</span><strong>{draft.title||LABELS.notSet}</strong></div><div><span>{LABELS.price}</span><strong>{draft.price?price(draft.price):LABELS.notSet}</strong></div><div><span>{LABELS.commonCategory}</span><strong>{draft.commonCategory||LABELS.notSet}</strong></div><div><span>{LABELS.productRegion}</span><strong>{draft.region||LABELS.notSet}</strong></div><div><span>{LABELS.platforms}</span><strong>{draft.platforms.length?draft.platforms.map((id)=>P[id]).join(", "):LABELS.none}</strong></div></div></article><article className="panel"><h2>{LABELS.photoPreview}</h2>{photoUrls.length?<div className="photo-grid">{photoUrls.map((url,index)=><div key={url} className="photo-item"><img src={url} alt={`\uCD08\uC548 \uC0AC\uC9C4 ${index+1}`} /><span>{index+1}</span></div>)}</div>:<div className="empty-copy">{LABELS.photoEmpty}</div>}</article><article className="panel"><h2>{LABELS.handoff}</h2><p>{LABELS.handoffBody}</p><div className="seller-platform-grid">{Object.keys(P).filter((id)=>sellPlatforms[id]).map((id)=><article key={id} className="seller-platform-card"><div className="seller-platform-card__top"><strong>{P[id]}</strong></div><div className="seller-platform-card__body"><div className="seller-platform-card__line"><span>{LABELS.commonCategory}</span><strong>{draft.categoryMap[id]||draft.commonCategory||LABELS.notSet}</strong></div><div className="seller-platform-card__line"><span>{LABELS.photos}</span><strong>{photos.length}</strong></div><div className="seller-platform-card__actions"><button className="secondary-button" onClick={()=>copyDraft(id)}>{LABELS.draftCopy}</button><button className="primary-button" onClick={()=>openPlatform(id)}>{LABELS.openOfficial}</button></div></div></article>)}</div></article></aside></section></section>}
</main>;}
