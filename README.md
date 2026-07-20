# Lido UI

Next.js dashboard for [Lido](https://github.com/KevinGuest/lido) — solo Bitcoin mining pool with Stratum V1 + V2, live workers, and Discord/Telegram alert settings.

**Live demo:** https://lido.wtf/

Pool server: [`lido`](https://github.com/KevinGuest/lido) · Umbrel package: [`lido-app`](https://github.com/KevinGuest/lido-app)

## Dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

Without `PUBLIC_POOL_API_URL`, the Umbrel/Docker build shows an empty live dashboard (not sample miners). Mock data + the red banner are only used when `GITHUB_PAGES=true` or `LIDO_USE_MOCK=true` (see `.env.example`).

| Env | Purpose |
| --- | --- |
| `PUBLIC_POOL_API_URL` | Pool HTTP API (local: `http://localhost:2299`) |
| `PUBLIC_POOL_STRATUM_URL` | Host shown in Connect (Umbrel: `umbrel.local:2301`) |
| `MEMPOOL_API_URL` | Optional; difficulty adjustment |
| `PUBLIC_POOL_ADDRESS` | Optional address-scoped fallback |
| `MINER_HOSTS` / `SCAN_SUBNETS` | Optional AxeOS enrichment |

## Features

- Connect dialog for Stratum V1 (port **2301** on Umbrel) and Stratum V2 (**2302**), including SV2 authority public key
- Workers, hashrate charts, and network difficulty
- Settings for Discord/Telegram alerts and pool digests
- Mobile-friendly layout

## Umbrel

On umbrelOS, install via the community store at [`lido-app`](https://github.com/KevinGuest/lido-app).

| Port | Service |
| --- | --- |
| **2300** | Web UI |
| **2301** | Stratum V1 |
| **2302** | Stratum V2 |
| **2299** | Pool API (internal) |

Image: `ghcr.io/kevinguest/lido-ui`
