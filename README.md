# dota-oracle-frontend

**Live win-probability estimation for professional Dota 2 matches.**
Open-source, non-commercial, no betting or wagering functionality.

Tournament metadata (tier, stage, series format) is sourced from
[Liquipedia](https://liquipedia.net/dota2) under CC-BY-SA. The service does not
reproduce Liquipedia's pages or brackets — it links to them.

React 18 · TypeScript · Vite · TanStack Query/Router · Tailwind · Recharts

*Documentation below is in Russian.*

---

SPA сервиса прогнозирования матчей Dota 2 Tier 1: лента идущих матчей с вероятностью победы,
карточка матча с кривой по минутам, публичный дашборд точности модели и турнирный календарь
со ссылками на Liquipedia.

React 18 · TypeScript · Vite · TanStack Query/Router · Tailwind · Recharts.

Спецификация: [docs/spec.md](docs/spec.md). Инструкции для агентов: [CLAUDE.md](CLAUDE.md).

## Быстрый старт

```bash
npm install
npm run dev
```

Откроется `http://localhost:5273`. Запросы `/api` и `/ws` проксируются на `http://localhost:8100`,
поэтому параллельно должен быть поднят бэкенд (`docker compose up` в `dota-oracle-backend`).

## Переменные окружения

```bash
cp .env.example .env
```

| Переменная | Смысл |
|---|---|
| `VITE_API_BASE_URL` | база REST API. Пусто в деве — работает прокси Vite |
| `VITE_WS_BASE_URL` | база WebSocket. Пусто — берётся из текущего origin |

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Прод

```bash
docker build -t dota-oracle-frontend .
```

Образ отдаёт статику через nginx и проксирует `/api` и `/ws` на сервис `api` — конфиг в
[nginx.conf](nginx.conf).

## Лицензия

MIT — см. [LICENSE](LICENSE).

## Атрибуция

Данные турниров — [Liquipedia](https://liquipedia.net/dota2), CC-BY-SA. Игровые данные —
Valve, OpenDota, STRATZ. Проект не аффилирован с Valve; Dota 2 — торговая марка Valve
Corporation. Сервис аналитический, к ставкам отношения не имеет.
