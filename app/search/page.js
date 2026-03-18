import { Suspense } from "react";
import SearchResultsPage from "@/components/SearchResultsPage";

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="results-page"><section className="results-shell"><div className="empty-state">검색 결과를 준비하는 중이에요.</div></section></main>}>
      <SearchResultsPage />
    </Suspense>
  );
}
