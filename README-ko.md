# twx-cli

📖 [English](./README.md) | 📐 [아키텍처](./docs/ARCHITECTURE-ko.md)

X (Twitter) API v2를 위한 빠르고 가벼운 CLI 도구.

```bash
npx twx-cli post "터미널에서 트윗하기!"
```

## 주요 기능

- **게시** — 트윗 작성, 삭제, 인용, 답글
- **타임라인** — 내 최근 게시물 보기
- **검색** — 최근 게시물 검색
- **사용자** — 프로필 조회
- **좋아요 / 리트윗 / 팔로우** — 게시물 및 사용자와 상호작용
- **미리보기** — 게시 전 확인 (dry-run)
- **스레드** — 여러 트윗을 한 번에 스레드로 게시
- **JSON 출력** — `--json` 플래그로 스크립팅 지원
- **설정 불필요** — 환경 변수 4개만 세팅하면 바로 사용

## 설치

```bash
npm install -g twx-cli
# 또는
pnpm add -g twx-cli
# 또는
bun add -g twx-cli
```

설치 없이 바로 사용:
```bash
npx twx-cli post "안녕!"
```

## 설정

[console.x.com](https://console.x.com)에서 API 키 발급 후:

```bash
twx init
```

자격 증명이 `~/.config/twx-cli/config.json`에 저장됩니다 (권한 600).

직접 생성하려면:
```json
{
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "access_token": "your_access_token",
  "access_token_secret": "your_access_token_secret",
  "bearer_token": "your_bearer_token"
}
```

환경 변수(`X_API_KEY` 등)가 설정 파일보다 우선합니다.

앱에 **Read and Write** 권한과 OAuth 1.0a가 활성화되어 있어야 합니다.

## 사용법

### 게시

```bash
# 간단한 게시
twx post "새벽 2시에 코드 배포 중"

# 답글
twx post "좋은 포인트!" --reply-to 1234567890

# 인용
twx post "이거 대박 👀" --quote 1234567890

# 미리보기 (실제 게시 안 함)
twx post "테스트..." --dry-run
```

### 스레드

```bash
# 스레드 게시 (인자 하나당 트윗 하나)
twx thread "첫 번째 트윗" "두 번째 트윗" "세 번째 트윗"

# 미리보기
twx thread "파트 1" "파트 2" --dry-run
```

### 타임라인

```bash
# 내 최근 게시물
twx timeline

# 최근 5개만
twx timeline -n 5

# 전체 조회 (페이지네이션)
twx timeline --all

# 최대 50개
twx timeline --max 50
```

### 검색

```bash
twx search "typescript cli"
twx search "#buildinpublic" -n 20
```

### 사용자

```bash
# 내 프로필
twx me

# 다른 사용자 조회
twx user elonmusk
```

### 상호작용

```bash
twx like 1234567890
twx retweet 1234567890
twx follow @username
twx unfollow @username
```

## 인증

twx-cli는 대부분의 작업에 **OAuth 1.0a** (User Context)를, 검색에는 선택적으로 **Bearer Token** (App-only)을 사용합니다.

자격 증명 로딩 순서:
1. 환경 변수 (`X_API_KEY`, `X_API_SECRET` 등)
2. `~/.config/twx-cli/config.json`

## 프로젝트 구조

```
src/
├── cli.ts              # 명령어 정의 (commander)
├── config.ts           # 자격 증명 로딩 및 검증
└── client/
    ├── index.ts        # XClient (OAuth, fetch, 요청 제한)
    ├── types.ts        # 공용 타입 정의 (XPost, XUser 등)
    ├── posts.ts        # 게시물 CRUD, 타임라인, 검색
    ├── users.ts        # 사용자 조회, 팔로우/언팔로우
    └── engagement.ts   # 좋아요, 취소, 리트윗
```

## 요구 사항

- Node.js >= 18
- X API v2 접근 권한 ([console.x.com](https://console.x.com))

## 라이선스

MIT
