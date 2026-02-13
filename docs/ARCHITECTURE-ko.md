# 아키텍처

## 개요

twx-cli는 X (Twitter) REST API v2를 터미널에서 사용하기 위한 TypeScript CLI 도구. 3개 소스 파일의 모듈 구조.

## 프로젝트 구조

```
twx-cli/
├── src/
│   ├── cli.ts         # 진입점, 커맨드 정의 (commander)
│   ├── client.ts      # XClient — HTTP 클라이언트 & API 메서드
│   └── config.ts      # 크레덴셜 로딩 & 검증
├── docs/
│   ├── ARCHITECTURE.md
│   └── ARCHITECTURE-ko.md
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 모듈 다이어그램

```
                    ┌──────────────┐
                    │   cli.ts     │
                    │  - 커맨드     │
                    │  - 출력       │
                    │  - 라우팅     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            │            ▼
       ┌───────────┐      │     ┌───────────┐
       │ config.ts │      │     │   chalk    │
       │ (크레덴셜)  │      │     │  (출력)    │
       └───────────┘      │     └───────────┘
                           ▼
                   ┌──────────────┐
                   │  client.ts   │
                   │  (XClient)   │
                   └──────┬───────┘
                          │
                   ┌──────┴──────┐
                   ▼             ▼
            ┌───────────┐ ┌───────────┐
            │ oauth-1.0a│ │ X API v2  │
            │  (서명)    │ │  (REST)   │
            └───────────┘ └───────────┘
```

## 모듈 상세

### `cli.ts` — 진입점 & 커맨드

commander로 CLI 구조 정의.

**서브커맨드 (10개):**

| 커맨드 | 설명 |
|--------|------|
| `post <text>` | 새 포스트(트윗) 작성 |
| `delete <id>` | 포스트 삭제 |
| `me` | 인증된 사용자 정보 |
| `user <username>` | 유저 조회 |
| `timeline` | 내 최근 포스트 |
| `search <query>` | 최근 포스트 검색 |
| `like <tweet-id>` | 좋아요 |
| `retweet <tweet-id>` | 리트윗 |
| `follow <username>` | 팔로우 |
| `unfollow <username>` | 언팔로우 |

### `client.ts` — X API 클라이언트

Node.js 내장 `fetch` + OAuth 1.0a 서명.

**인증 방식:**
- **OAuth 1.0a** (User Context) — 대부분의 엔드포인트
- **Bearer Token** (App-only) — 검색

**API 메서드 (12개):**

| 메서드 | HTTP | 엔드포인트 |
|--------|------|-----------|
| `createPost` | POST | `/2/tweets` |
| `deletePost` | DELETE | `/2/tweets/{id}` |
| `me` | GET | `/2/users/me` |
| `getUser` | GET | `/2/users/by/username/{username}` |
| `getUserPosts` | GET | `/2/users/{id}/tweets` |
| `searchRecent` | GET | `/2/tweets/search/recent` |
| `like` | POST | `/2/users/{id}/likes` |
| `unlike` | DELETE | `/2/users/{id}/likes/{tweet_id}` |
| `retweet` | POST | `/2/users/{id}/retweets` |
| `follow` | POST | `/2/users/{id}/following` |
| `unfollow` | DELETE | `/2/users/{id}/following/{target_id}` |

### `config.ts` — 크레덴셜 관리

**로딩 우선순위:**
1. 환경변수 (우선)
2. `~/.config/twx-cli/.env`

**지원 변수명:**

| 기본 | 별칭 (호환용) |
|------|-------------|
| `X_API_KEY` | `TWITTER_API_KEY` |
| `X_API_SECRET` | `TWITTER_API_SECRET` |
| `X_ACCESS_TOKEN` | `TWITTER_ACCESS_TOKEN` |
| `X_ACCESS_TOKEN_SECRET` | `TWITTER_ACCESS_TOKEN_SECRET` |
| `X_BEARER_TOKEN` | `TWITTER_BEARER_TOKEN` |

## 인증 흐름

```
OAuth 1.0a (User Context):
  consumer_key + consumer_secret + access_token + access_token_secret
  → HMAC-SHA1 서명 → Authorization 헤더

Bearer Token (App-only):
  Authorization: Bearer <token>
```

## 의존성

| 패키지 | 용도 |
|--------|------|
| `commander` | CLI 인자 파싱 |
| `oauth-1.0a` | OAuth 1.0a 요청 서명 |
| `chalk` | 터미널 컬러 출력 |

**Node.js 내장:**
- `crypto` — HMAC-SHA1 (OAuth 서명)
- `fetch` — HTTP 요청 (Node >= 18)
- `fs`, `path` — 설정 파일 로딩

## 설계 결정

- **Native fetch**: HTTP 라이브러리 의존성 없음 — Node >= 18 내장
- **OAuth 1.0a**: CLI에서 브라우저 리다이렉트 불필요, 정적 키로 동작
- **TWITTER_* 별칭**: 기존 도구와의 환경변수 호환
- **~/.config/ 사용**: XDG 호환, 크레덴셜이 레포에 유출되지 않음
- **chalk**: 자동 컬러 감지, 깔끔한 코드

## 로드맵

- [ ] 커서 기반 페이지네이션 (timeline, search)
- [ ] 미디어 업로드 (이미지, 비디오)
- [ ] 스레드 작성 (연쇄 포스트)
- [ ] `twx config` 커맨드 (인터랙티브 크레덴셜 설정)
- [ ] Rate limit 자동 재시도
- [ ] JSON 출력 모드 (`--json`)
- [ ] 스트리밍 (filtered stream)
