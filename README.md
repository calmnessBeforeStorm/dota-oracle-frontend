# dota-oracle-frontend

SPA сервиса прогнозирования матчей Dota 2 Tier 1: лента идущих матчей с вероятностью победы,
карточка матча с кривой по минутам, календарь турниров и публичный дашборд точности модели.

React 18 · TypeScript · Vite · TanStack Query/Router · Tailwind · Recharts.

Спецификация: [docs/spec.md](docs/spec.md). Инструкции для агентов: [CLAUDE.md](CLAUDE.md).

## Быстрый старт

```bash
npm install
npm run dev
```

Откроется `http://localhost:5173`. Запросы `/api` и `/ws` проксируются на `http://localhost:8000`,
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

## Атрибуция

Данные турниров — [Liquipedia](https://liquipedia.net/dota2), CC-BY-SA. Игровые данные —
Valve, OpenDota, STRATZ. Проект не аффилирован с Valve; Dota 2 — торговая марка Valve
Corporation. Сервис аналитический, к ставкам отношения не имеет.
