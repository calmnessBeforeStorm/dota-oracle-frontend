# CLAUDE.md — dota-oracle-frontend

SPA системы прогнозирования исходов профессиональных матчей Dota 2.
Полная спецификация: [docs/spec.md](docs/spec.md) — ссылки «§8.1» ниже указывают на её разделы.
Бэкенд живёт в соседнем репозитории `dota-oracle-backend`.

## Стек

React 18 + TypeScript · Vite 6 · TanStack Query (данные) · TanStack Router (роутинг,
code-based дерево) · Tailwind CSS · Recharts · нативный WebSocket · Vitest + Testing Library.

## Текущее состояние

Фаза 0 («Скелет») по §11. Каркас F1–F6 есть, данные приходят пустыми, пока не готовы
соответствующие фазы бэкенда. Дев-сервер проксирует `/api` и `/ws` на `localhost:8000`.

## Карта репозитория

```
src/
├── main.tsx              QueryClientProvider + RouterProvider
├── router.tsx            code-based дерево роутов (без кодогенерации)
├── index.css             Tailwind + базовая тема (тёмная)
├── api/
│   ├── client.ts         fetch-обёртка, ApiError
│   ├── types.ts          зеркало app/schemas/common.py бэкенда
│   ├── queries.ts        queryOptions для TanStack Query
│   └── ws.ts             подписка на /ws/live/{match_id} с реконнектом
├── components/
│   ├── MatchCard.tsx           F1: карточка в ленте
│   ├── WinProbabilityBar.tsx   основная метрика продукта
│   ├── ProbabilityChart.tsx    F2: кривая вероятности (Recharts)
│   ├── SeriesScore.tsx         счёт серии, ничья в Bo2 (§5.5)
│   ├── StreamDelayNotice.tsx   §7.4, обязателен рядом с live-числами
│   └── Attribution.tsx         CC-BY-SA + дисклеймер Valve (§13)
├── routes/               root, live (F1), match (F2+F5), tournaments (F3), accuracy (F6)
└── lib/
    ├── series.ts         форматы серий, ничьи, лейблы счёта
    └── utils.ts          cn(), formatGameTime, formatPercent
```

## Инварианты — нарушать нельзя

1. **Ничья в Bo2 — отдельное состояние.** `winner_team_id: null` может означать и «ещё не
   решено», и «1–1». Различает их флаг `is_draw`; рендерить счёт только через
   `seriesStatus()` / `seriesScoreLabel()` из `lib/series.ts`, не собирать строку руками (§5.5).
2. **Задержка трансляции всегда видима.** Рядом с live-вероятностью обязателен
   `StreamDelayNotice`: наши числа опережают то, что видит зритель, и без предупреждения
   это читается как спойлер (§7.4).
3. **Атрибуция Liquipedia (CC-BY-SA) и дисклеймер Valve — на всех страницах**, где
   показываются их данные. `Attribution` смонтирована в `routes/root.tsx`; убирать нельзя (§13).
4. **Никаких формулировок про ставки.** Сервис аналитический; появление коэффициентов,
   «прогнозов на исход» в терминах беттинга или сравнения с букмекерами — вне скоупа (§13).
5. **Вероятности не выдумывать на клиенте.** `bo2NaiveOutcomes()` — плейсхолдер до v2, его
   вывод нельзя подписывать как результат модели: карты не независимы (§5.5).
6. **Метрики модели показывать по срезам минут.** Усреднённая цифра врёт: на 40-й минуте
   задача тривиальна (§7.2). Страница `accuracy` устроена именно так.
7. **Типы API — зеркало бэкенда.** При изменении схем править `src/api/types.ts` в том же PR;
   источник истины — `localhost:8000/openapi.json`.

## Команды

```bash
npm install
npm run dev          # localhost:5173, /api и /ws проксируются на localhost:8000
npm test             # vitest
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build        # tsc -b && vite build
```

Для полноценной работы должен быть поднят бэкенд: `docker compose up` в `dota-oracle-backend`.

## Правила ведения репозитория

Общие правила пары репозиториев — в `../CLAUDE.md`, коротко:

- Дефолтная ветка — **`development`** (тестовый сервер). Вся работа ветвится от неё.
- Каждая фича — отдельная ветка от `development`: `feature/<кратко>`, `fix/<кратко>`.
  Прямых коммитов в `development` нет, только мердж.
- **В `main` категорически нельзя коммитить и пушить.** Единственный путь кода в прод —
  мердж `development` → `main`, и он делается **только по явному разрешению владельца
  проекта на этот конкретный мердж**. Разрешение не переносится на следующие разы.
  По своей инициативе в `main` не ходить и не предлагать этого.
- Коммиты подписываются почтой **`ersaim.adilet@yandex.kz`** (локальный `user.email` уже
  прописан в репозитории, не перезаписывать глобальным).
- **Сообщения коммитов — на английском**, в императиве: `add series score component`, а не
  `added changes`. Трейлеры об авторстве ИИ не добавляются.
- Перед пушем прогнать то же, что гоняет CI:
  `npm run lint && npm run typecheck && npm test && npm run build`.
