# Lido UI

Next.js dashboard for Lido.

**Live mockup (GitHub Pages demo only):** https://lido.wtf/

## Dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without `PUBLIC_POOL_API_URL`, the Umbrel/Docker build shows an empty live dashboard (not sample miners). Mock data is only used when `GITHUB_PAGES=true` or `LIDO_USE_MOCK=true`.

| Env | Purpose |
| --- | --- |
| `PUBLIC_POOL_API_URL` | Pool HTTP API (e.g. `http://localhost:2019`) |
| `PUBLIC_POOL_STRATUM_URL` | Shown in the Connect dialog (e.g. `umbrel.local:2301`) |
| `MEMPOOL_API_URL` | Optional; difficulty adjustment |
| `PUBLIC_POOL_ADDRESS` | Optional address-scoped fallback |
| `MINER_HOSTS` / `SCAN_SUBNETS` | Optional AxeOS enrichment |

Open http://localhost:3000

## Umbrel

https://github.com/KevinGuest/lido-app
