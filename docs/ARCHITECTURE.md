# Architecture

## Overview

twx-cli is a TypeScript CLI application that wraps the X (Twitter) REST API v2 for terminal usage. It follows a modular architecture with 3 source files.

## Project Structure

```
twx-cli/
├── src/
│   ├── cli.ts         # Entry point, command definitions (commander)
│   ├── client.ts      # XClient — HTTP client & API methods
│   └── config.ts      # Credential loading & validation
├── docs/
│   ├── ARCHITECTURE.md
│   └── ARCHITECTURE-ko.md
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Module Diagram

```
                    ┌──────────────┐
                    │   cli.ts     │
                    │  - Commands  │
                    │  - Output    │
                    │  - Routing   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            │            ▼
       ┌───────────┐      │     ┌───────────┐
       │ config.ts │      │     │   chalk    │
       │(credentials)     │     │ (output)   │
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
            │ (signing) │ │  (REST)   │
            └───────────┘ └───────────┘
```

## Modules

### `cli.ts` — Entry Point & Commands

Defines the CLI structure using commander.

**Subcommands (10):**

| Command | Description |
|---------|-------------|
| `post <text>` | Create a new post (tweet) |
| `delete <id>` | Delete a post by ID |
| `me` | Show authenticated user info |
| `user <username>` | Get user info by username |
| `timeline` | Show your recent posts |
| `search <query>` | Search recent posts |
| `like <tweet-id>` | Like a post |
| `retweet <tweet-id>` | Retweet a post |
| `follow <username>` | Follow a user |
| `unfollow <username>` | Unfollow a user |

Each command handler:
1. Initializes `XClient` via `getClient()`
2. Calls the appropriate API method
3. Formats and prints output with chalk

### `client.ts` — X API Client

`XClient` wraps Node.js native `fetch` with OAuth 1.0a signing.

**Authentication:**
- **OAuth 1.0a** (User Context) — for post, delete, like, follow, timeline
- **Bearer Token** (App-only) — for search

**Private methods:**
| Method | Purpose |
|--------|---------|
| `request()` | OAuth 1.0a signed request |
| `bearerRequest()` | Bearer token request |

**API methods (12):**

| Method | HTTP | Endpoint |
|--------|------|----------|
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

### `config.ts` — Credential Management

Loads X API credentials from the environment.

**Credential resolution priority:**
1. Environment variables (takes precedence)
2. `~/.config/twx-cli/.env`

**Supported variable names:**

| Primary | Alias (backward compat) |
|---------|------------------------|
| `X_API_KEY` | `TWITTER_API_KEY` |
| `X_API_SECRET` | `TWITTER_API_SECRET` |
| `X_ACCESS_TOKEN` | `TWITTER_ACCESS_TOKEN` |
| `X_ACCESS_TOKEN_SECRET` | `TWITTER_ACCESS_TOKEN_SECRET` |
| `X_BEARER_TOKEN` | `TWITTER_BEARER_TOKEN` |

Missing required credentials produce a clear error listing which vars are missing.

## Authentication Flow

```
┌─────────────────────────────────────────────────┐
│                  OAuth 1.0a                     │
│  (User Context — most endpoints)                │
│                                                 │
│  consumer_key + consumer_secret                 │
│  + access_token + access_token_secret           │
│  → HMAC-SHA1 signature in Authorization header  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              Bearer Token                       │
│  (App-only — search endpoint)                   │
│                                                 │
│  Authorization: Bearer <token>                  │
└─────────────────────────────────────────────────┘
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI argument parsing |
| `oauth-1.0a` | OAuth 1.0a request signing |
| `chalk` | Terminal color output |
| `dotenv` | Reserved (not used at runtime, config.ts handles loading) |

**Node.js built-ins used:**
- `crypto` — HMAC-SHA1 for OAuth signing
- `fetch` — HTTP requests (Node >= 18)
- `fs`, `path` — Config file loading

## Error Handling

- X API errors are caught and displayed with status code + detail message
- Missing credentials produce a descriptive error listing missing vars
- `--dry-run` flag on `post` command for safe testing

## Design Decisions

- **Native fetch**: No HTTP library dependency — Node >= 18 has fetch built-in
- **OAuth 1.0a over OAuth 2.0 PKCE**: Simpler for CLI tools — no browser redirect needed, keys are static
- **TWITTER_* aliases**: Backward compatibility with existing env setups from other tools
- **No pagination yet**: Keeping v0.1 simple — will add cursor-based pagination for timeline/search
- **chalk over raw ANSI**: Cleaner code, auto-detects color support
- **~/.config/ over project .env**: XDG-compliant, credentials don't leak into repos

## Roadmap

- [ ] Cursor-based pagination for timeline and search
- [ ] Media upload (images, video)
- [ ] Thread creation (post chains)
- [ ] `twx config` command for interactive credential setup
- [ ] Rate limit handling with auto-retry
- [ ] JSON output mode (`--json`)
- [ ] Streaming (filtered stream)
