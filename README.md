# 장터모아 웹

Vercel에 바로 배포할 수 있는 Next.js 웹 앱입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## GitHub에 올리기

이 프로젝트는 상위 폴더 안의 `jangteomoa-web` 하위 앱입니다. 가장 쉬운 방법은 `jangteomoa-web` 폴더만 별도 GitHub 저장소로 올리는 것입니다.

```bash
cd jangteomoa-web
git init -b main
git add .
git commit -m "Initial web app"
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

이미 상위 폴더 전체를 하나의 저장소로 올릴 수도 있습니다. 그 경우 Vercel에서 반드시 Root Directory를 `jangteomoa-web`로 지정해야 합니다.

## Vercel 배포

1. GitHub에 저장소를 올립니다.
2. Vercel에서 New Project를 누릅니다.
3. GitHub 저장소를 Import 합니다.
4. Root Directory를 `jangteomoa-web`로 지정합니다.
5. Framework Preset이 Next.js인지 확인합니다.
6. Deploy를 누릅니다.

이 프로젝트는 현재 필수 환경변수가 없습니다.

## 참고

- 검색 수집은 서버 라우트에서 처리합니다.
- 판매 등록은 웹 보안 정책상 플랫폼 폼에 직접 사진을 자동 첨부하지 않고, 초안과 사진을 준비한 뒤 공식 등록 페이지를 새 탭으로 여는 흐름입니다.
