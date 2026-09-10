# Броадкастный редизайн, часть 1 — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** перевести продукт на броадкастный визуальный язык — слой токенов и примитивов, эндпойнт сыгранных матчей в бэкенде и пересобранная на них главная страница.

**Architecture:** новая папка `src/ui/` с примитивами, ничего не знающими о домене; страницы собираются из них. Два режима плотности — это варианты одного примитива, а не два набора вёрстки. Бэкенд получает одну новую ручку `GET /api/matches/recent`, читающую уже существующий журнал предсказаний.

**Tech Stack:** React 18, TypeScript, Vite 6, Tailwind 3, TanStack Query/Router, Vitest + Testing Library. Бэкенд — FastAPI, SQLAlchemy 2 (async), pytest.

**Spec:** `docs/superpowers/specs/2026-09-09-broadcast-redesign-design.md`

## Global Constraints

- **Тема одна — тёмная.** Второй темы нет, `color-scheme: dark` остаётся.
- **Насыщенный цвет в системе ровно один — сторона.** Radiant зелёный, Dire красный. Всё остальное — оттенки одного холодного серого. Красный для ошибки запрещён: `text-dire` в сообщениях «Не удалось загрузить» — это дефект, который чинится в задаче 3.
- **Сторона кодируется тремя способами**: цветом, позицией (Radiant всегда слева) и подписью. Полоса вероятности без подписи не выпускается ни в одном варианте.
- **Шкала кегля с провалом:** 88 / 20 / 14 / 12 px. Между первой ступенью и остальными разрыв обязателен.
- **`src/lib/` и `src/api/types.ts` не переписываются.** В `types.ts` только дописываются новые типы; существующие не трогаются. `src/lib/` не меняется вовсе.
- **27 тестов в `src/lib/`** (`series` 8, `metrics` 10, `timeline` 9) остаются зелёными не изменившись ни на строку.
- **8 компонентных тестов** (`SeriesScore` 2, `TrainingStatus` 6) могут потребовать правки селекторов, но их утверждения обязаны пережить перерисовку. Удалять такой тест нельзя — это повод остановиться.
- **Никакого вердикта «угадала / не угадала»** нигде в UI.
- **Компонент со ссылкой тестируется асинхронно.** TanStack Router отдаёт первый кадр пустым, поэтому после `render(<RouterProvider …>)` синхронный `getByText` читает пустой DOM. Опаснее не падение, а обратное: проверка «такого текста нет» на пустом DOM **проходит, ничего не проверив**. Все запросы — через `findBy*`, и даже проверки отсутствия начинаются с ожидания чего-то, что должно быть.
- **Tailwind остаётся 3.x.** Миграции на v4 в этом плане нет.
- **Recharts не появляется на главной.** Спарклайн пишется руками.
- **Коммиты на английском**, в императиве, без трейлеров об авторстве ИИ. `user.email` в обоих репозиториях уже локально проставлен.
- **Весь текст внутри кода — английский**, и комментарии, и docstrings. Русский остаётся документации. В бэкенде это сторожит `ruff` правилами `RUF002`/`RUF003`: кириллические буквы читаются как «неоднозначные», и русский комментарий валит CI.
  **Примеры кода в задачах 6–7 этого плана записаны по-русски — это ошибка плана, обнаруженная при исполнении.** Переносить их дословно нельзя: `ruff check` даёт на них два десятка нарушений. Смысл комментариев верен, язык — нет; в репозитории `dota-oracle-backend` эти файлы уже лежат по-английски, и источник истины там, а не здесь.
- **Ветки:** спека и этот план лежат на `docs/broadcast-redesign`, которая ещё не в `development`. Поэтому рабочая ветка фронта ветвится **от `docs/broadcast-redesign`**, а не от `development` — иначе у исполнителя не будет в дереве плана, который он исполняет. Если владелец сначала смерджит документацию в `development`, ветвиться нужно оттуда. Бэкенд-задачи (6–7) — своя ветка от `development` и отдельный PR в репозитории `dota-oracle-backend`. Прямых коммитов в `development` и любых действий с `main` нет.

## File Structure

**Создаётся (фронтенд):**

| Файл | Ответственность |
|---|---|
| `src/ui/tokens.css` | CSS-переменные темы; импортируется из `index.css` |
| `src/ui/Surface.tsx` | Уровень подложки: `base` / `raised` / `lit` |
| `src/ui/TeamName.tsx` | Имя команды с запасным вариантом по стороне |
| `src/ui/Pending.tsx` | Состояния загрузки, ошибки и пустоты |
| `src/ui/ProbabilityDisplay.tsx` | Главная цифра, три варианта, дельта, предупреждение о задержке |
| `src/ui/Sparkline.tsx` | Кривая вероятности рукописным SVG |
| `src/components/PlayedMatchCard.tsx` | Карточка сыгранного матча в ленте |
| `src/components/ModelStrip.tsx` | Полоса состояния модели над лентой |

**Модифицируется (фронтенд):** `tailwind.config.js`, `src/index.css`, `src/api/types.ts`, `src/api/queries.ts`, `src/components/MatchCard.tsx`, `src/components/WinProbabilityBar.tsx` (удаляется), `src/routes/live.tsx`, `src/routes/match.tsx`, `src/routes/tournaments.tsx`, `src/routes/tournament.tsx`, `src/routes/accuracy.tsx`.

**Создаётся (бэкенд):** `app/api/recent.py`, `tests/test_recent.py`.
**Модифицируется (бэкенд):** `app/schemas/common.py`, `app/api/routes/matches.py`.

---

### Task 1: Тема и `Surface`

Токены — строительные леса для примитивов, поэтому едут вместе с первым из них и проверяются через него.

**Files:**
- Create: `src/ui/tokens.css`, `src/ui/Surface.tsx`, `src/ui/Surface.test.tsx`
- Modify: `tailwind.config.js`, `src/index.css`

**Interfaces:**
- Consumes: ничего.
- Produces: `<Surface level="base" | "raised" | "lit" lead={'radiant' | 'dire' | null} className?>`; классы Tailwind `bg-base`, `bg-raised`, `text-ink`, `text-ink-dim`, `text-ink-faint`, `border-line`, `text-radiant`, `text-dire`, `text-hero`, `text-lead`, `text-body`, `text-micro`.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/ui/Surface.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Surface } from './Surface'

describe('Surface', () => {
  it('raises the surface above the page ground', () => {
    render(<Surface level="raised">содержимое</Surface>)
    expect(screen.getByText('содержимое')).toHaveClass('bg-raised')
  })

  it('tints the lit surface by the side that leads', () => {
    render(
      <Surface level="lit" lead="dire">
        ведёт Dire
      </Surface>,
    )
    // Свечение стороны, а не рамка: язык системы разделяет светом.
    expect(screen.getByText('ведёт Dire').className).toMatch(/shadow-.*dire/)
  })

  it('leaves a lit surface unlit when nobody leads', () => {
    render(
      <Surface level="lit" lead={null}>
        поровну
      </Surface>,
    )
    expect(screen.getByText('поровну').className).not.toMatch(/shadow-/)
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/ui/Surface.test.tsx`
Expected: FAIL — `Failed to resolve import "./Surface"`.

- [ ] **Step 3: Написать токены**

```css
/* src/ui/tokens.css */
:root {
  color-scheme: dark;

  /* Подложки: разделяем светом, а не рамками. */
  --base: #08090b;
  --raised: #101216;
  --line: #1c1f25;

  /* Текст: одна холодная серая шкала, три ступени. */
  --ink: #f4f5f7;
  --ink-dim: #9aa0a8;
  --ink-faint: #6b7178;

  /* Единственный насыщенный цвет в системе — сторона. */
  --radiant: #35c46a;
  --dire: #e0483a;
}
```

- [ ] **Step 4: Подключить токены и расширить конфиг**

```css
/* src/index.css — целиком */
@import './ui/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-base text-ink antialiased;
    font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif;
  }
}
```

```js
// tailwind.config.js — целиком
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--base)',
        raised: 'var(--raised)',
        line: 'var(--line)',
        ink: {
          DEFAULT: 'var(--ink)',
          dim: 'var(--ink-dim)',
          faint: 'var(--ink-faint)',
        },
        // Стороны сохраняют канонические цвета: UI никогда не должен их объяснять.
        radiant: 'var(--radiant)',
        dire: 'var(--dire)',
      },
      fontSize: {
        // Провал между hero и lead — то, что делает главную цифру читаемой с дивана.
        hero: ['5.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        lead: ['1.25rem', { lineHeight: '1.4' }],
        body: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.75rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'lit-radiant': '0 0 40px -12px var(--radiant)',
        'lit-dire': '0 0 40px -12px var(--dire)',
      },
    },
  },
  plugins: [],
}
```

Прежние `radiant.dim` и `dire.dim` исчезают — единственное их место, `DraftStrip.tsx:45`, чинится в задаче 12. До неё сборка не ломается: Tailwind просто не породит несуществующий класс.

- [ ] **Step 5: Написать `Surface`**

```tsx
// src/ui/Surface.tsx
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Level = 'base' | 'raised' | 'lit'
type Side = 'radiant' | 'dire'

interface Props {
  level?: Level
  /** Сторона, которая ведёт. Свечение — единственное, что её отмечает на уровне `lit`. */
  lead?: Side | null
  className?: string
  children: ReactNode
}

const LEVELS: Record<Level, string> = {
  base: 'bg-base',
  raised: 'bg-raised',
  lit: 'bg-raised',
}

/**
 * Уровень подложки вместо рамки.
 *
 * Рамки вокруг каждого блока читаются как таблица, а продукт — не таблица. Разделяем
 * светом: подложка, поверхность и свечение стороны, которая ведёт.
 */
export function Surface({ level = 'raised', lead = null, className, children }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl',
        LEVELS[level],
        level === 'lit' && lead === 'radiant' && 'shadow-lit-radiant',
        level === 'lit' && lead === 'dire' && 'shadow-lit-dire',
        className,
      )}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Прогнать тесты**

Run: `npx vitest run src/ui/Surface.test.tsx`
Expected: PASS, 3 теста.

- [ ] **Step 7: Убедиться, что ядро не задето**

Run: `npm test`
Expected: PASS, 38 тестов (35 прежних + 3 новых).

- [ ] **Step 8: Коммит**

```bash
git add src/ui/tokens.css src/ui/Surface.tsx src/ui/Surface.test.tsx src/index.css tailwind.config.js
git commit -m "lay down the theme tokens and the surface primitive"
```

---

### Task 2: `TeamName`

**Files:**
- Create: `src/ui/TeamName.tsx`, `src/ui/TeamName.test.tsx`

**Interfaces:**
- Consumes: токены задачи 1.
- Produces: `<TeamName name={string | null | undefined} side="radiant" | "dire" className? />`.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/ui/TeamName.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TeamName } from './TeamName'

describe('TeamName', () => {
  it('names the side when the team is unknown', () => {
    render(<TeamName name={null} side="dire" />)
    expect(screen.getByText('Dire')).toBeInTheDocument()
  })

  it('prefers the real name', () => {
    render(<TeamName name="Team Spirit" side="radiant" />)
    expect(screen.getByText('Team Spirit')).toBeInTheDocument()
  })

  it('colours the name by its side', () => {
    render(<TeamName name="Falcons" side="dire" />)
    expect(screen.getByText('Falcons')).toHaveClass('text-dire')
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/ui/TeamName.test.tsx`
Expected: FAIL — `Failed to resolve import "./TeamName"`.

- [ ] **Step 3: Написать компонент**

```tsx
// src/ui/TeamName.tsx
import { cn } from '@/lib/utils'

interface Props {
  name: string | null | undefined
  side: 'radiant' | 'dire'
  className?: string
}

/**
 * Имя команды с запасным вариантом по стороне.
 *
 * Запасной вариант был продублирован в четырёх местах и везде записан руками; здесь он
 * один. Цвет ставится тут же, потому что сторону обязаны кодировать и цвет, и подпись —
 * зелёный с красным сам по себе для части читателей неразличим.
 */
export function TeamName({ name, side, className }: Props) {
  return (
    <span className={cn(side === 'radiant' ? 'text-radiant' : 'text-dire', className)}>
      {name ?? (side === 'radiant' ? 'Radiant' : 'Dire')}
    </span>
  )
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `npx vitest run src/ui/TeamName.test.tsx`
Expected: PASS, 3 теста.

- [ ] **Step 5: Коммит**

```bash
git add src/ui/TeamName.tsx src/ui/TeamName.test.tsx
git commit -m "add the team name primitive with its side fallback"
```

---

### Task 3: `Pending` — загрузка, ошибка, пустота

Здесь же чинится дефект: красный `text-dire` в сообщениях об ошибке. Dire — это сторона, а не «что-то сломалось», и по правилу единственного цвета такой красный запрещён.

**Files:**
- Create: `src/ui/Pending.tsx`, `src/ui/Pending.test.tsx`

**Interfaces:**
- Consumes: `Surface` задачи 1.
- Produces: `<Loading />`, `<Failed message={string} />`, `<Empty title={string} hint?={string} />` — все три экспортируются из `src/ui/Pending.tsx`.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/ui/Pending.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Empty, Failed, Loading } from './Pending'

describe('Pending states', () => {
  it('says it is loading', () => {
    render(<Loading />)
    expect(screen.getByText('Загрузка…')).toBeInTheDocument()
  })

  it('does not paint a failure in a side colour', () => {
    render(<Failed message="Матч не найден" />)
    const node = screen.getByText('Матч не найден')
    // Красный принадлежит Dire. Ошибка — не сторона, и красной быть не может.
    expect(node.className).not.toMatch(/text-dire/)
  })

  it('shows the hint under an empty state', () => {
    render(<Empty title="Матчей нет" hint="Расписание — на странице «Турниры»" />)
    expect(screen.getByText('Матчей нет')).toBeInTheDocument()
    expect(screen.getByText('Расписание — на странице «Турниры»')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/ui/Pending.test.tsx`
Expected: FAIL — `Failed to resolve import "./Pending"`.

- [ ] **Step 3: Написать компоненты**

```tsx
// src/ui/Pending.tsx
import { Surface } from './Surface'

/**
 * Три состояния, в которых страницы одинаковы, — и до сих пор каждая писала их сама,
 * отчего они уже разошлись между собой.
 *
 * Ошибка намеренно не красная. Красный в этой системе принадлежит Dire, и сообщение
 * «Не удалось загрузить», выкрашенное в цвет стороны, читается как утверждение о матче.
 */
export function Loading() {
  return <p className="text-body text-ink-faint">Загрузка…</p>
}

export function Failed({ message }: { message: string }) {
  return (
    <Surface level="raised" className="px-4 py-3">
      <p className="text-body text-ink-dim">{message}</p>
    </Surface>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Surface level="raised" className="px-6 py-16 text-center">
      <p className="text-lead text-ink-dim">{title}</p>
      {hint && <p className="mt-2 text-body text-ink-faint">{hint}</p>}
    </Surface>
  )
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `npx vitest run src/ui/Pending.test.tsx`
Expected: PASS, 3 теста.

- [ ] **Step 5: Коммит**

```bash
git add src/ui/Pending.tsx src/ui/Pending.test.tsx
git commit -m "add loading, failure and empty states as one primitive"
```

---

### Task 4: `ProbabilityDisplay`

Главная цифра продукта. Предупреждение о задержке трансляции переезжает **внутрь**: инвариант 2 требует, чтобы оно стояло рядом с live-числом всегда, и единственный способ это гарантировать — сделать его частью примитива, а не соседом, которого можно забыть.

**Files:**
- Create: `src/ui/ProbabilityDisplay.tsx`, `src/ui/ProbabilityDisplay.test.tsx`
- Modify: `src/components/StreamDelayNotice.tsx` (не меняется по смыслу, только используется отсюда)

**Interfaces:**
- Consumes: `TeamName` задачи 2, `StreamDelayNotice` (существует), `formatPercent` из `@/lib/utils`.
- Produces:

```ts
interface ProbabilityDisplayProps {
  pRadiant: number
  radiantName?: string | null
  direName?: string | null
  variant?: 'broadcast' | 'compact' | 'inline'
  /** Изменение за последнюю минуту в процентных пунктах. null — сравнивать не с чем. */
  delta?: number | null
  /** Присутствует только у идущего матча. Включает предупреждение о задержке. */
  live?: { streamDelaySeconds: number }
}
```

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/ui/ProbabilityDisplay.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProbabilityDisplay } from './ProbabilityDisplay'

describe('ProbabilityDisplay', () => {
  it('shows the stream delay warning next to a live number', () => {
    // Инвариант 2: наши числа опережают эфир, и без предупреждения это спойлер.
    render(<ProbabilityDisplay pRadiant={0.68} live={{ streamDelaySeconds: 130 }} />)
    expect(screen.getByText(/опережают трансляцию/)).toBeInTheDocument()
  })

  it('names both sides even with no team names', () => {
    // Сторону обязаны кодировать три вещи; подпись — та, что работает без цвета.
    render(<ProbabilityDisplay pRadiant={0.5} />)
    expect(screen.getByText('Radiant')).toBeInTheDocument()
    expect(screen.getByText('Dire')).toBeInTheDocument()
  })

  it('shows both probabilities', () => {
    render(<ProbabilityDisplay pRadiant={0.681} />)
    expect(screen.getByText('68.1%')).toBeInTheDocument()
    expect(screen.getByText('31.9%')).toBeInTheDocument()
  })

  it('shows which way the number moved', () => {
    render(<ProbabilityDisplay pRadiant={0.68} delta={0.04} />)
    expect(screen.getByText(/▲\s*4\.0/)).toBeInTheDocument()
  })

  it('says nothing about direction when there is nothing to compare with', () => {
    render(<ProbabilityDisplay pRadiant={0.68} delta={null} />)
    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument()
  })

  it('renders no delay warning when the match is not live', () => {
    render(<ProbabilityDisplay pRadiant={0.68} />)
    expect(screen.queryByText(/опережают трансляцию/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/ui/ProbabilityDisplay.test.tsx`
Expected: FAIL — `Failed to resolve import "./ProbabilityDisplay"`.

- [ ] **Step 3: Написать компонент**

```tsx
// src/ui/ProbabilityDisplay.tsx
import { StreamDelayNotice } from '@/components/StreamDelayNotice'
import { cn, formatPercent } from '@/lib/utils'
import { TeamName } from './TeamName'

type Variant = 'broadcast' | 'compact' | 'inline'

interface Props {
  pRadiant: number
  radiantName?: string | null
  direName?: string | null
  variant?: Variant
  delta?: number | null
  live?: { streamDelaySeconds: number }
}

/** Две плотности — это две строки таблицы, а не две ветки разметки. */
const SIZES: Record<Variant, { figure: string; bar: string; label: string }> = {
  broadcast: { figure: 'text-hero', bar: 'h-3', label: 'text-lead' },
  compact: { figure: 'text-lead', bar: 'h-2', label: 'text-body' },
  inline: { figure: 'text-body', bar: 'h-1.5', label: 'text-micro' },
}

function Delta({ delta }: { delta: number }) {
  const points = Math.abs(delta) * 100
  if (points < 0.05) return null
  return (
    <span className={cn('text-micro', delta > 0 ? 'text-radiant' : 'text-dire')}>
      {delta > 0 ? '▲' : '▼'} {points.toFixed(1)}
    </span>
  )
}

/**
 * Единственное число, ради которого существует продукт.
 *
 * Предупреждение о задержке живёт внутри, а не рядом. Инвариант 2 требует, чтобы оно
 * стояло у каждого live-числа; соседний элемент можно забыть поставить на новом экране,
 * часть примитива — нельзя. Броадкастный язык, уводящий вторичный текст в тень, делает
 * такую страховку обязательной, а не желательной.
 */
export function ProbabilityDisplay({
  pRadiant,
  radiantName,
  direName,
  variant = 'compact',
  delta = null,
  live,
}: Props) {
  const size = SIZES[variant]
  const radiantPct = Math.round(pRadiant * 1000) / 10

  return (
    <div className="space-y-1.5">
      <div className={cn('flex items-baseline justify-between gap-3', size.label)}>
        <TeamName name={radiantName} side="radiant" />
        <TeamName name={direName} side="dire" />
      </div>

      <div className={cn('flex items-baseline justify-between gap-3 font-mono', size.figure)}>
        <span className="flex items-baseline gap-2">
          {formatPercent(pRadiant, 1)}
          {delta !== null && <Delta delta={delta} />}
        </span>
        <span className="text-ink-dim">{formatPercent(1 - pRadiant, 1)}</span>
      </div>

      <div
        className={cn('flex overflow-hidden rounded-full bg-dire', size.bar)}
        role="meter"
        aria-valuenow={radiantPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Вероятность победы Radiant"
      >
        <div
          className="bg-radiant transition-all duration-500"
          style={{ width: `${radiantPct}%` }}
        />
      </div>

      {live && <StreamDelayNotice delaySeconds={live.streamDelaySeconds} />}
    </div>
  )
}
```

- [ ] **Step 4: Перекрасить предупреждение под новую палитру**

`StreamDelayNotice` сейчас янтарное. Янтарный — не сторона, значит из системы он уходит; заметность даёт то, что рядом больше нет цветного вовсе.

```tsx
// src/components/StreamDelayNotice.tsx — заменить только className параграфа
    <p className="text-micro text-ink-faint">
```

- [ ] **Step 5: Прогнать тесты**

Run: `npx vitest run src/ui/ProbabilityDisplay.test.tsx`
Expected: PASS, 6 тестов.

- [ ] **Step 6: Коммит**

```bash
git add src/ui/ProbabilityDisplay.tsx src/ui/ProbabilityDisplay.test.tsx src/components/StreamDelayNotice.tsx
git commit -m "make the probability display carry its own stream delay warning"
```

---

### Task 5: `Sparkline`

Рукописный SVG, а не Recharts: Recharts вынесен в отдельный чанк ровно затем, чтобы лента красилась не дожидаясь графической библиотеки, и спарклайн на главной этот расчёт отменил бы.

**Files:**
- Create: `src/ui/Sparkline.tsx`, `src/ui/Sparkline.test.tsx`

**Interfaces:**
- Consumes: токены задачи 1.
- Produces: `<Sparkline points={{ minute: number; p_radiant: number }[]} outcome={'radiant' | 'dire' | null} height?={number} />`.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/ui/Sparkline.test.tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sparkline } from './Sparkline'

const CURVE = [
  { minute: 0, p_radiant: 0.5 },
  { minute: 10, p_radiant: 0.62 },
  { minute: 20, p_radiant: 0.81 },
]

describe('Sparkline', () => {
  it('draws a path through the points', () => {
    const { container } = render(<Sparkline points={CURVE} outcome={null} />)
    const path = container.querySelector('path')
    expect(path?.getAttribute('d')).toMatch(/^M/)
  })

  it('marks how the match ended', () => {
    const { container } = render(<Sparkline points={CURVE} outcome="radiant" />)
    expect(container.querySelector('circle')).toBeTruthy()
  })

  it('draws nothing for an empty curve', () => {
    const { container } = render(<Sparkline points={[]} outcome={null} />)
    expect(container.querySelector('path')).toBeNull()
  })

  it('survives a single point', () => {
    const { container } = render(
      <Sparkline points={[{ minute: 4, p_radiant: 0.5 }]} outcome={null} />,
    )
    // Одна точка не образует линии; падать на этом нельзя — так выглядит матч,
    // который поллер увидел за минуту до конца.
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/ui/Sparkline.test.tsx`
Expected: FAIL — `Failed to resolve import "./Sparkline"`.

- [ ] **Step 3: Написать компонент**

```tsx
// src/ui/Sparkline.tsx
interface Point {
  minute: number
  p_radiant: number
}

interface Props {
  points: Point[]
  /** Чем кончился матч. Маркер, а не вердикт: карточка ничего не утверждает о модели. */
  outcome: 'radiant' | 'dire' | null
  height?: number
}

const WIDTH = 200

/**
 * Кривая вероятности в размере карточки.
 *
 * Руками, а не Recharts: библиотека вынесена в отдельный чанк, чтобы лента красилась
 * без неё, и тянуть её обратно ради сорока строк SVG значит отменить этот расчёт.
 *
 * Ось Y всегда 0..1 и никогда не подгоняется под данные: подогнанная ось превращает
 * колебание в три процентных пункта в драматический обвал.
 */
export function Sparkline({ points, outcome, height = 48 }: Props) {
  if (points.length === 0) {
    return <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="presentation" />
  }

  const first = points[0].minute
  const last = points[points.length - 1].minute
  const span = last - first || 1

  const x = (p: Point) => ((p.minute - first) / span) * WIDTH
  const y = (p: Point) => (1 - p.p_radiant) * height

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const tail = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="presentation">
      {/* Половина: выше неё ведёт Radiant, ниже — Dire. */}
      <line
        x1={0}
        y1={height / 2}
        x2={WIDTH}
        y2={height / 2}
        stroke="var(--line)"
        strokeWidth={1}
      />
      {points.length > 1 && (
        <path d={d} fill="none" stroke="var(--ink-dim)" strokeWidth={1.5} strokeLinejoin="round" />
      )}
      {outcome && (
        <circle
          cx={x(tail)}
          cy={y(tail)}
          r={3}
          fill={outcome === 'radiant' ? 'var(--radiant)' : 'var(--dire)'}
        />
      )}
    </svg>
  )
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `npx vitest run src/ui/Sparkline.test.tsx`
Expected: PASS, 4 теста.

- [ ] **Step 5: Прогнать всё и убедиться, что ядро цело**

Run: `npm test`
Expected: PASS, 54 теста (35 прежних + 19 новых: Surface 3, TeamName 3, Pending 3, ProbabilityDisplay 6, Sparkline 4).

- [ ] **Step 6: Коммит**

```bash
git add src/ui/Sparkline.tsx src/ui/Sparkline.test.tsx
git commit -m "draw the probability sparkline without pulling in recharts"
```

---

### Task 6: Бэкенд — сыгранные матчи (сервис)

**Репозиторий `dota-oracle-backend`.** Отдельная ветка от `development`:

```bash
git switch development && git pull
git switch -c feature/recent-matches
```

**Files:**
- Create: `app/api/recent.py`, `tests/test_recent.py`
- Modify: `app/schemas/common.py`

**Interfaces:**
- Consumes: `Prediction`, `Match`, `Team`, `Series` (существуют), `SeriesBrief`, `TeamBrief`, `PredictionPoint` (существуют).
- Produces:

```python
class RecentMatch(BaseModel): ...          # в app/schemas/common.py
async def recent_matches(session: AsyncSession, limit: int = 20) -> list[RecentMatch]
def pick_tenth_minute(curve: list[PredictionPoint]) -> PredictionPoint | None
def thin(curve: list[PredictionPoint], target: int = 30) -> list[PredictionPoint]
```

- [ ] **Step 1: Написать падающий тест**

```python
# tests/test_recent.py
"""Лента сыгранных матчей на главной (§8.1).

Главный экран построен вокруг одной цифры, и большую часть суток этой цифры нет: матчи
Tier 1 идут несколько часов в день. Лента сыгранных — то, что экран показывает всё
остальное время, и потому она обязана быть честной ровно так же, как дашборд точности.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.api.recent import pick_tenth_minute, recent_matches, thin
from app.db.models.matches import Match
from app.db.models.training import Prediction
from app.schemas.common import PredictionPoint

BASE = datetime(2026, 9, 1, tzinfo=UTC)
VERSION = "lgbm-20260901-090724"


def point(minute: int, p: float = 0.5) -> PredictionPoint:
    return PredictionPoint(minute=minute, p_radiant=p, predicted_at=BASE)


async def add(
    session: AsyncSession,
    match_id: int,
    radiant_win: bool | None,
    minutes: list[int],
    *,
    start: datetime = BASE,
) -> None:
    session.add(Match(match_id=match_id, radiant_win=radiant_win, start_time=start))
    await session.flush()
    for minute in minutes:
        session.add(
            Prediction(
                match_id=match_id,
                minute=minute,
                predicted_at=start + timedelta(minutes=minute),
                model_version=VERSION,
                p_radiant=0.5 + minute / 200,
                features={},
            )
        )
    await session.flush()


class TestTenthMinute:
    def test_takes_the_first_point_at_or_after_ten(self) -> None:
        picked = pick_tenth_minute([point(4), point(11, 0.62), point(20)])
        assert picked is not None
        assert picked.p_radiant == 0.62

    def test_dashes_when_the_minute_is_missing(self) -> None:
        # Подставить минуту 22 под подписью «на 10-й минуте» невозможно заметить снаружи.
        assert pick_tenth_minute([point(2), point(22)]) is None

    def test_dashes_on_an_empty_curve(self) -> None:
        assert pick_tenth_minute([]) is None

    def test_accepts_the_far_edge_of_the_bucket(self) -> None:
        picked = pick_tenth_minute([point(14, 0.7)])
        assert picked is not None
        assert picked.minute == 14


class TestThin:
    def test_keeps_a_short_curve_whole(self) -> None:
        curve = [point(m) for m in range(5)]
        assert thin(curve, target=30) == curve

    def test_keeps_the_ends(self) -> None:
        curve = [point(m) for m in range(100)]
        thinned = thin(curve, target=30)
        assert len(thinned) <= 30
        assert thinned[0].minute == 0
        assert thinned[-1].minute == 99


class TestRecentMatches:
    async def test_returns_only_finished_matches(self, session: AsyncSession) -> None:
        await add(session, 1, True, [0, 10, 20])
        await add(session, 2, None, [0, 10])
        rows = await recent_matches(session)
        assert [row.match_id for row in rows] == [1]

    async def test_skips_matches_nobody_predicted(self, session: AsyncSession) -> None:
        # Популяция ленты — то, что видела live-петля, а не весь архив матчей.
        session.add(Match(match_id=3, radiant_win=True, start_time=BASE))
        await session.flush()
        assert await recent_matches(session) == []

    async def test_newest_first(self, session: AsyncSession) -> None:
        await add(session, 1, True, [10], start=BASE)
        await add(session, 2, False, [10], start=BASE + timedelta(days=1))
        rows = await recent_matches(session)
        assert [row.match_id for row in rows] == [2, 1]

    async def test_carries_the_curve_and_the_tenth_minute(self, session: AsyncSession) -> None:
        await add(session, 1, True, [0, 10, 20])
        row = (await recent_matches(session))[0]
        assert [p.minute for p in row.curve] == [0, 10, 20]
        assert row.p_at_ten == 0.55

    async def test_honours_the_limit(self, session: AsyncSession) -> None:
        for match_id in range(1, 6):
            await add(session, match_id, True, [10], start=BASE + timedelta(hours=match_id))
        assert len(await recent_matches(session, limit=3)) == 3
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `docker compose run --rm tools python -m pytest tests/test_recent.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.api.recent'`.

- [ ] **Step 3: Добавить схему**

```python
# app/schemas/common.py — дописать в конец файла
class RecentMatch(BaseModel):
    """Сыгранный матч в ленте главной страницы.

    Популяция — матчи, которые видела live-петля, а не весь архив: в ленту попадает только
    то, по чему мы успели дать прогноз. Страница говорит это прямо, иначе лента читается
    как полный календарь, которым она не является.
    """

    match_id: int
    league_id: int | None = None
    league_name: str | None = None
    tier: str = "unknown"
    radiant: TeamBrief
    dire: TeamBrief
    radiant_win: bool
    #: Абсолютное время, не относительное: воркер может простоять несколько суток, и
    #: «вчера» в этот момент врёт, а дата просто выглядит старой, какой и является.
    started_at: datetime | None = None
    series: SeriesBrief
    curve: list[PredictionPoint] = []
    #: Вероятность за Radiant на 10-й минуте, если она есть. None рисуется прочерком:
    #: соседняя минута под этой подписью была бы подменой, незаметной снаружи.
    p_at_ten: float | None = None
    #: Версия, выдавшая **именно** точку десятой минуты, а не «версия матча»: живой матч
    #: может быть предсказан двумя версиями подряд, и общей у них нет. Пустая строка, когда
    #: десятой минуты нет.
    model_version: str
```

- [ ] **Step 4: Написать сервис**

```python
# app/api/recent.py
"""Лента сыгранных матчей для главной страницы (§8.1).

Главный экран построен вокруг вероятности идущего матча, а матчи Tier 1 идут несколько
часов в сутки. Всё остальное время экран показывает эту ленту, и потому она подчиняется
тем же правилам честности, что дашборд точности: никакого вердикта «угадала», никакой
подстановки соседней минуты под чужой подписью.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.matches import Match, Series
from app.db.models.reference import League, Team
from app.db.models.training import Prediction
from app.schemas.common import (
    PredictionPoint,
    RecentMatch,
    SeriesBrief,
    TeamBrief,
)

#: Корзина, в которой задача уже не шум и ещё не решена. Замер по 156 сверенным матчам:
#: в 0–4 точность 51.3% — монетка, в 10–14 уже 70.6%. Брать точку вне корзины и называть
#: её «десятой минутой» нельзя.
TENTH_MINUTE = 10
TENTH_MINUTE_LAST = 14


def pick_tenth_minute(curve: list[PredictionPoint]) -> PredictionPoint | None:
    """Первая точка внутри корзины 10–14, или None.

    None означает прочерк на карточке. Подстановка минуты 3 или 22 под подписью «на 10-й
    минуте» — враньё того же рода, от которого страхует инвариант о дашборде, и заметить
    его снаружи невозможно.

    Возвращается точка целиком, а не одно число: карточка обязана назвать **ту** версию
    модели, которая сделала именно это утверждение.
    """
    for point in curve:
        if TENTH_MINUTE <= point.minute <= TENTH_MINUTE_LAST:
            return point
    return None


def thin(curve: list[PredictionPoint], target: int = 30) -> list[PredictionPoint]:
    """Проредить кривую до примерно `target` точек, сохранив оба конца.

    Спарклайн шириной в карточку не покажет шестьдесят точек, а гнать их по сети смысла
    нет. Концы сохраняются: начало и исход — единственные два места, которые читают точно.
    """
    if len(curve) <= target:
        return curve
    step = len(curve) / target
    picked = [curve[int(i * step)] for i in range(target)]
    if picked[-1] is not curve[-1]:
        picked[-1] = curve[-1]
    return picked


async def recent_matches(session: AsyncSession, limit: int = 20) -> list[RecentMatch]:
    """Сыгранные матчи, по которым мы давали прогноз, свежие сверху."""
    match_ids = (
        await session.scalars(
            select(Match.match_id)
            .join(Prediction, Prediction.match_id == Match.match_id)
            .where(Match.radiant_win.is_not(None))
            .group_by(Match.match_id, Match.start_time)
            .order_by(Match.start_time.desc().nulls_last(), Match.match_id.desc())
            .limit(limit)
        )
    ).all()
    if not match_ids:
        return []

    matches = {
        row.match_id: row
        for row in (
            await session.scalars(select(Match).where(Match.match_id.in_(match_ids)))
        ).all()
    }

    curves: dict[int, list[PredictionPoint]] = {match_id: [] for match_id in match_ids}
    # Версия хранится поминутно, а не на матч. Живой матч может быть предсказан двумя
    # версиями подряд (промоушен посреди игры), и тогда «версия матча» — величина, которой
    # не существует. Карточка называет версию ровно того утверждения, которое печатает.
    versions: dict[tuple[int, int], str] = {}
    rows = (
        await session.execute(
            select(
                Prediction.match_id,
                Prediction.minute,
                func.max(Prediction.p_radiant),
                func.max(Prediction.predicted_at),
                func.max(Prediction.model_version),
            )
            .where(Prediction.match_id.in_(match_ids))
            .group_by(Prediction.match_id, Prediction.minute)
            .order_by(Prediction.match_id, Prediction.minute)
        )
    ).all()
    for match_id, minute, p_radiant, predicted_at, version in rows:
        curves[match_id].append(
            PredictionPoint(
                minute=int(minute), p_radiant=float(p_radiant), predicted_at=predicted_at
            )
        )
        versions[(match_id, int(minute))] = version

    team_ids = {
        team_id
        for match in matches.values()
        for team_id in (match.radiant_team_id, match.dire_team_id)
        if team_id
    }
    names = {
        int(team_id): name
        for team_id, name in (
            await session.execute(select(Team.team_id, Team.name).where(Team.team_id.in_(team_ids)))
        ).all()
    } if team_ids else {}

    league_ids = {match.league_id for match in matches.values() if match.league_id}
    leagues = {
        int(league_id): (name, tier)
        for league_id, name, tier in (
            await session.execute(
                select(League.league_id, League.name, League.tier).where(
                    League.league_id.in_(league_ids)
                )
            )
        ).all()
    } if league_ids else {}

    series_ids = {match.series_id for match in matches.values() if match.series_id}
    series_rows = {
        row.series_id: row
        for row in (
            await session.scalars(select(Series).where(Series.series_id.in_(series_ids)))
        ).all()
    } if series_ids else {}

    result: list[RecentMatch] = []
    for match_id in match_ids:
        match = matches[match_id]
        curve = curves[match_id]
        tenth = pick_tenth_minute(curve)
        league_name, tier = leagues.get(match.league_id or 0, (None, None))
        series = series_rows.get(match.series_id or 0)
        result.append(
            RecentMatch(
                match_id=match_id,
                league_id=match.league_id,
                league_name=league_name,
                tier=tier or "unknown",
                radiant=TeamBrief(
                    team_id=match.radiant_team_id, name=names.get(match.radiant_team_id)
                ),
                dire=TeamBrief(team_id=match.dire_team_id, name=names.get(match.dire_team_id)),
                radiant_win=bool(match.radiant_win),
                started_at=match.start_time,
                series=SeriesBrief(
                    series_id=match.series_id,
                    format=series.format if series and series.format else None,
                    score_a=series.score_a if series else 0,
                    score_b=series.score_b if series else 0,
                    winner_team_id=series.winner_team_id if series else None,
                    is_draw=bool(series.is_draw) if series else False,
                    game_in_series=match.game_in_series or 1,
                    is_conditional_game=bool(match.is_conditional_game),
                ),
                curve=thin(curve),
                p_at_ten=tenth.p_radiant if tenth else None,
                # Версия того самого утверждения. Нет десятой минуты — нет и версии:
                # назвать чужую значило бы приписать модели чужие слова.
                model_version=versions.get((match_id, tenth.minute), "") if tenth else "",
            )
        )
    return result
```

- [ ] **Step 5: Прогнать тесты**

Run: `docker compose run --rm tools python -m pytest tests/test_recent.py -v`
Expected: PASS, 11 тестов.

- [ ] **Step 6: Прогнать линтеры и весь набор**

Run: `docker compose run --rm tools sh -c "ruff check . && ruff format --check . && mypy app && python -m pytest"`
Expected: чисто, прежний набор плюс 11 новых.

- [ ] **Step 7: Коммит**

```bash
git add app/api/recent.py app/schemas/common.py tests/test_recent.py
git commit -m "assemble the feed of matches we predicted and then saw finish"
```

---

### Task 7: Бэкенд — маршрут `GET /api/matches/recent`

**Files:**
- Modify: `app/api/routes/matches.py`
- Test: `tests/test_recent.py` (дописать класс)

**Interfaces:**
- Consumes: `recent_matches` задачи 6.
- Produces: `GET /api/matches/recent?limit=<1..50>` → `list[RecentMatch]`.

- [ ] **Step 1: Написать падающий тест**

```python
# tests/test_recent.py — дописать в конец
class TestRoute:
    def test_route_is_registered(self, client: TestClient) -> None:
        paths = client.get("/openapi.json").json()["paths"]
        assert "/api/matches/recent" in paths

    def test_recent_is_matched_before_the_id_route(self, client: TestClient) -> None:
        # Иначе `recent` уедет в `/{match_id}` как идентификатор матча. Проверяется
        # порядком в таблице маршрутов, а не запросом: запрос ушёл бы в живую базу.
        paths = [getattr(route, "path", "") for route in client.app.routes]
        assert paths.index("/api/matches/recent") < paths.index("/api/matches/{match_id}")

    def test_refuses_an_unreasonable_limit(self, client: TestClient) -> None:
        # Лента на главной; полсотни карточек — потолок, дальше это выгрузка архива.
        # Валидация отвергает запрос до того, как дело дойдёт до сессии.
        assert client.get("/api/matches/recent", params={"limit": 500}).status_code == 422
```

Дописать импорт в шапку файла: `from fastapi.testclient import TestClient`.

**Почему маршрут не проверяется живым запросом.** Фикстура `client` поднимает приложение с боевыми настройками, а не с тестовой схемой: `sessionmaker` подменяет `search_path` только для тестов, которые берут его сами. Запрос `GET /api/matches/recent` через `client` ушёл бы в **настоящую базу** — и `assert response.json() == []` либо упал бы на реальных данных, либо (что хуже) прошёл бы на пустой машине и молча деградировал потом. Такое уже случалось в этом проекте с `run_normalize`. Поэтому регистрация и порядок маршрутов проверяются структурно, а поведение с данными — тестами сервиса, у которых схема своя.

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `docker compose run --rm tools python -m pytest tests/test_recent.py::TestRoute -v`
Expected: FAIL — `/api/matches/recent` не найден ни в openapi, ни в таблице маршрутов.

- [ ] **Step 3: Добавить маршрут**

```python
# app/api/routes/matches.py — дописать после live_matches, ДО match_detail
@router.get("/recent", response_model=list[RecentMatch])
async def recent(
    limit: int = Query(default=20, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
) -> list[RecentMatch]:
    """Матчи, по которым мы дали прогноз и дождались исхода, свежие сверху.

    Стоит выше `/{match_id}`: иначе `recent` уедет в него как идентификатор матча.
    """
    return await recent_matches(session, limit=limit)
```

Дописать импорты в шапку файла:

```python
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.recent import recent_matches
from app.schemas.common import (
    LiveMatch,
    MatchDetail,
    PredictionPoint,
    RecentMatch,
    SeriesBrief,
    TeamBrief,
)
```

- [ ] **Step 4: Прогнать тесты**

Run: `docker compose run --rm tools python -m pytest tests/test_recent.py -v`
Expected: PASS, 14 тестов.

- [ ] **Step 5: Прогнать всё перед пушем**

Run: `docker compose run --rm tools sh -c "ruff check . && ruff format --check . && mypy app && python -m pytest"`
Expected: чисто, прежний набор плюс 13 новых (11 сервисных и 2 маршрутных).

- [ ] **Step 6: Коммит и пуш**

```bash
git add app/api/routes/matches.py tests/test_recent.py
git commit -m "serve the recent matches feed"
git push -u origin feature/recent-matches
```

PR в `development` открывает владелец. Дальнейшие задачи требуют, чтобы бэкенд с этой ручкой был запущен локально.

---

### Task 8: Фронтенд — тип и запрос

**Репозиторий `dota-oracle-frontend`**, ветка редизайна.

**Files:**
- Modify: `src/api/types.ts`, `src/api/queries.ts`

**Interfaces:**
- Consumes: маршрут задачи 7.
- Produces: `interface RecentMatch`, `recentMatchesQuery(limit?: number)`.

- [ ] **Step 1: Дописать тип**

```ts
// src/api/types.ts — дописать после LiveMatch
/**
 * Сыгранный матч в ленте главной страницы.
 *
 * Популяция — то, что видела live-петля, а не весь архив: сюда попадает только матч, по
 * которому мы успели дать прогноз.
 */
export interface RecentMatch {
  match_id: number
  league_id: number | null
  league_name: string | null
  tier: string
  radiant: TeamBrief
  dire: TeamBrief
  radiant_win: boolean
  /** Абсолютное время. «Вчера» врёт, когда воркер простоял трое суток. */
  started_at: string | null
  series: Series
  curve: PredictionPoint[]
  /** Вероятность за Radiant на 10-й минуте. null рисуется прочерком, не соседней минутой. */
  p_at_ten: number | null
  model_version: string
}
```

- [ ] **Step 2: Дописать запрос**

```ts
// src/api/queries.ts — дописать после liveMatchesQuery
export const recentMatchesQuery = (limit = 20) =>
  queryOptions({
    queryKey: ['matches', 'recent', limit],
    queryFn: () => apiGet<RecentMatch[]>('/matches/recent', { limit: String(limit) }),
    // Лента сыгранных меняется, только когда матч закончился и исход приехал из внешнего
    // источника, — это минуты, а не секунды.
    staleTime: 5 * 60_000,
  })
```

Дописать `RecentMatch` в импорт типов в шапке файла.

- [ ] **Step 3: Проверить типы**

Run: `npm run typecheck`
Expected: чисто.

- [ ] **Step 4: Коммит**

```bash
git add src/api/types.ts src/api/queries.ts
git commit -m "type the recent matches feed"
```

---

### Task 9: `PlayedMatchCard`

Карточка сыгранного матча. Здесь живёт главное решение спеки: **никакого вердикта**.

**Files:**
- Create: `src/components/PlayedMatchCard.tsx`, `src/components/PlayedMatchCard.test.tsx`

**Interfaces:**
- Consumes: `Surface`, `TeamName`, `Sparkline`, `RecentMatch`, `seriesStatus`/`seriesIsKnown`/`seriesScoreLabel` из `@/lib/series`, `formatPercent` из `@/lib/utils`.
- Produces: `<PlayedMatchCard match={RecentMatch} />`.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/components/PlayedMatchCard.test.tsx
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import type { RecentMatch } from '@/api/types'
import { PlayedMatchCard } from './PlayedMatchCard'

const MATCH: RecentMatch = {
  match_id: 1,
  league_id: 10,
  league_name: 'The International 2026',
  tier: 'tier1',
  radiant: { team_id: 1, name: 'Team Spirit', logo_url: null },
  dire: { team_id: 2, name: 'Falcons', logo_url: null },
  radiant_win: true,
  started_at: '2026-09-01T12:00:00Z',
  series: {
    series_id: null,
    format: null,
    score_a: 0,
    score_b: 0,
    winner_team_id: null,
    is_draw: false,
    game_in_series: 1,
    is_conditional_game: false,
  },
  curve: [
    { minute: 0, p_radiant: 0.5, predicted_at: '2026-09-01T12:00:00Z' },
    { minute: 11, p_radiant: 0.62, predicted_at: '2026-09-01T12:11:00Z' },
  ],
  p_at_ten: 0.62,
  model_version: 'lgbm-20260901-090724',
}

function renderCard(match: RecentMatch) {
  // Карточка — ссылка, значит ей нужен роутер; память вместо истории браузера.
  const router = createRouter({
    routeTree: rootTestRoute(match),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('PlayedMatchCard', () => {
  it('shows what the model promised at minute ten', () => {
    renderCard(MATCH)
    expect(screen.getByText('62.0%')).toBeInTheDocument()
  })

  it('dashes when minute ten is missing rather than borrowing a neighbour', () => {
    renderCard({ ...MATCH, p_at_ten: null })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('passes no verdict on the model', () => {
    renderCard(MATCH)
    // Последняя точка кривой почти всегда права; галочка по ней — лесть, а не измерение.
    expect(screen.queryByText(/угадал/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/✓|✗/)).not.toBeInTheDocument()
  })

  it('says nothing about a series it knows nothing about', () => {
    renderCard(MATCH)
    expect(screen.queryByText('0 : 0')).not.toBeInTheDocument()
  })

  it('labels a drawn Bo2 as a draw', () => {
    renderCard({
      ...MATCH,
      series: { ...MATCH.series, series_id: 7, format: 'bo2', score_a: 1, score_b: 1, is_draw: true },
    })
    expect(screen.getByText(/1 : 1 \(ничья\)/)).toBeInTheDocument()
  })

  it('shows an absolute date, not a relative one', () => {
    renderCard(MATCH)
    expect(screen.queryByText(/вчера|назад/i)).not.toBeInTheDocument()
    expect(screen.getByText(/1 сент/)).toBeInTheDocument()
  })
})
```

Хелпер `rootTestRoute` — в том же файле, над `renderCard`:

```tsx
import { createRootRoute, createRoute } from '@tanstack/react-router'

function rootTestRoute(match: RecentMatch) {
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <PlayedMatchCard match={match} />,
  })
  const detail = createRoute({
    getParentRoute: () => root,
    path: '/match/$matchId',
    component: () => null,
  })
  return root.addChildren([index, detail])
}
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/components/PlayedMatchCard.test.tsx`
Expected: FAIL — `Failed to resolve import "./PlayedMatchCard"`.

- [ ] **Step 3: Написать компонент**

```tsx
// src/components/PlayedMatchCard.tsx
import { Link } from '@tanstack/react-router'

import type { RecentMatch } from '@/api/types'
import { seriesIsKnown, seriesScoreLabel } from '@/lib/series'
import { formatPercent } from '@/lib/utils'
import { Sparkline } from '@/ui/Sparkline'
import { Surface } from '@/ui/Surface'
import { TeamName } from '@/ui/TeamName'
import { TierBadge } from './TierBadge'

const DAY_MONTH = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

/**
 * Сыгранный матч в ленте главной.
 *
 * Карточка не выносит вердикта. Отметка «угадала», посчитанная по последней точке кривой,
 * почти всегда положительна: на сороковой минуте исход уже решён. Лента зелёных галочек
 * на первом экране — худшая форма лести, какую может позволить себе этот продукт.
 *
 * Вместо неё — проверяемое утверждение: что модель обещала на десятой минуте, и чем всё
 * кончилось. Вердикт складывает зритель.
 */
export function PlayedMatchCard({ match }: { match: RecentMatch }) {
  const winner = match.radiant_win ? 'radiant' : 'dire'

  return (
    <Link to="/match/$matchId" params={{ matchId: String(match.match_id) }} className="block">
      <Surface level="raised" className="p-4 transition hover:bg-line">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TierBadge tier={match.tier} />
            <span className="truncate text-body text-ink-dim">
              {match.league_name ?? `Лига ${match.league_id}`}
            </span>
          </div>
          {match.started_at && (
            <span className="font-mono text-micro text-ink-faint">
              {DAY_MONTH.format(new Date(match.started_at))}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3 text-body">
          <TeamName name={match.radiant.name} side="radiant" />
          <TeamName name={match.dire.name} side="dire" />
        </div>

        <div className="my-2">
          <Sparkline points={match.curve} outcome={winner} />
        </div>

        <div className="flex items-baseline justify-between gap-3 text-micro text-ink-faint">
          <span>
            на 10-й минуте{' '}
            <span className="font-mono text-ink-dim">
              {match.p_at_ten === null ? '—' : formatPercent(match.p_at_ten, 1)}
            </span>{' '}
            за <TeamName name={match.radiant.name} side="radiant" />
          </span>
          {seriesIsKnown(match.series) && (
            <span className="font-mono">{seriesScoreLabel(match.series)}</span>
          )}
        </div>
      </Surface>
    </Link>
  )
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `npx vitest run src/components/PlayedMatchCard.test.tsx`
Expected: PASS, 6 тестов.

- [ ] **Step 5: Коммит**

```bash
git add src/components/PlayedMatchCard.tsx src/components/PlayedMatchCard.test.tsx
git commit -m "show a finished match without passing verdict on the model"
```

---

### Task 10: `ModelStrip`

**Files:**
- Create: `src/components/ModelStrip.tsx`, `src/components/ModelStrip.test.tsx`

**Interfaces:**
- Consumes: `modelMetricsQuery` (существует), `formatMetric`, `matchesLabel`, `isSmallSample` из `@/lib/metrics`.
- Produces: `<ModelStrip data={ModelMetrics} />` — чистый компонент, запрос делает страница.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/components/ModelStrip.test.tsx
import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import type { ModelMetrics } from '@/api/types'
import { ModelStrip } from './ModelStrip'

/** Полоса содержит ссылку на страницу точности, поэтому ей нужен роутер. */
function renderStrip(data: ModelMetrics) {
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <ModelStrip data={data} />,
  })
  const accuracy = createRoute({
    getParentRoute: () => root,
    path: '/accuracy',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([index, accuracy]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

const METRICS = {
  model_version: 'lgbm-20260901-090724',
  matches: 156,
  sample_size: 1457,
  log_loss: 0.5253,
  ece: 0.0547,
  by_minute: [],
  reliability: [],
  versions: [],
  predicted_matches: 160,
  awaiting_outcome: 4,
  first_prediction_at: null,
  last_prediction_at: null,
  training: null,
} as unknown as ModelMetrics

describe('ModelStrip', () => {
  it('names the version being served', () => {
    renderStrip(METRICS)
    expect(screen.getByText('lgbm-20260901-090724')).toBeInTheDocument()
  })

  it('gives the denominator in matches, not in predictions', () => {
    renderStrip(METRICS)
    expect(screen.getByText(/156 матчей/)).toBeInTheDocument()
  })

  it('says the sample is thin instead of showing a pretty number', () => {
    renderStrip({ ...METRICS, matches: 9 })
    expect(screen.getByText(/рано/i)).toBeInTheDocument()
  })

  it('dashes a metric it does not have', () => {
    renderStrip({ ...METRICS, log_loss: null } as unknown as ModelMetrics)
    // Нулевой log loss — это безупречная модель; прочерк честнее.
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/components/ModelStrip.test.tsx`
Expected: FAIL — `Failed to resolve import "./ModelStrip"`.

- [ ] **Step 3: Написать компонент**

```tsx
// src/components/ModelStrip.tsx
import { Link } from '@tanstack/react-router'

import type { ModelMetrics } from '@/api/types'
import { formatMetric, isSmallSample, matchesLabel } from '@/lib/metrics'
import { Surface } from '@/ui/Surface'

/**
 * Состояние модели одной строкой над лентой.
 *
 * Те же правила, что на странице точности: знаменатель — матчи, а не прогнозы; метрика
 * без данных рисуется прочерком; тонкая выборка говорит о себе вслух вместо того, чтобы
 * показать красивое число.
 */
export function ModelStrip({ data }: { data: ModelMetrics }) {
  return (
    <Surface level="raised" className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-4 py-2.5">
      <span className="font-mono text-micro text-ink-dim">{data.model_version}</span>
      <span className="text-micro text-ink-faint">
        сверено <span className="font-mono text-ink-dim">{matchesLabel(data.matches)}</span>
      </span>
      <span className="text-micro text-ink-faint">
        log loss <span className="font-mono text-ink-dim">{formatMetric(data.log_loss)}</span>
      </span>
      <span className="text-micro text-ink-faint">
        ECE <span className="font-mono text-ink-dim">{formatMetric(data.ece, 3)}</span>
      </span>
      {isSmallSample(data) && (
        <span className="text-micro text-ink-faint">сверенных матчей мало, цифрам верить рано</span>
      )}
      <Link to="/accuracy" className="ml-auto text-micro text-ink-faint hover:text-ink">
        точность →
      </Link>
    </Surface>
  )
}
```

- [ ] **Step 4: Прогнать тесты**

Run: `npx vitest run src/components/ModelStrip.test.tsx`
Expected: PASS, 4 теста.


- [ ] **Step 5: Коммит**

```bash
git add src/components/ModelStrip.tsx src/components/ModelStrip.test.tsx
git commit -m "put the model's own state above the feed"
```

---

### Task 11: `MatchCard` на новых примитивах

`WinProbabilityBar` растворяется в `ProbabilityDisplay` и удаляется. Здесь же чинится `border-radiant-dim` в `DraftStrip`, оставшийся без токена после задачи 1.

**Files:**
- Modify: `src/components/MatchCard.tsx`, `src/components/DraftStrip.tsx:45`
- Delete: `src/components/WinProbabilityBar.tsx`

**Interfaces:**
- Consumes: `ProbabilityDisplay`, `Surface`, `TeamName`.
- Produces: `<MatchCard match={LiveMatch} />` — сигнатура не меняется.

- [ ] **Step 1: Найти всех потребителей удаляемого компонента**

Run: `grep -rn "WinProbabilityBar\|radiant-dim\|dire-dim" src/`
Expected: `MatchCard.tsx`, `routes/match.tsx`, `DraftStrip.tsx:45`.

- [ ] **Step 2: Переписать карточку**

```tsx
// src/components/MatchCard.tsx — целиком
import { Link } from '@tanstack/react-router'

import type { LiveMatch } from '@/api/types'
import { formatGameTime } from '@/lib/utils'
import { ProbabilityDisplay } from '@/ui/ProbabilityDisplay'
import { Surface } from '@/ui/Surface'
import { SeriesScore } from './SeriesScore'
import { TierBadge } from './TierBadge'

/** F1: одна карточка в live-ленте. */
export function MatchCard({ match }: { match: LiveMatch }) {
  return (
    <Link
      to="/match/$matchId"
      params={{ matchId: String(match.match_id) }}
      className="block"
    >
      {/* Свечение стороны, которая ведёт: в ленте из шести карточек видно, где напряжение. */}
      <Surface level="lit" lead={match.p_radiant >= 0.5 ? 'radiant' : 'dire'} className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TierBadge tier={match.tier} />
            <span className="truncate text-body text-ink-dim">
              {match.league_name ?? `Лига ${match.league_id}`}
            </span>
          </div>
          <SeriesScore series={match.series} />
        </div>

        <ProbabilityDisplay
          pRadiant={match.p_radiant}
          radiantName={match.radiant.name}
          direName={match.dire.name}
          variant="compact"
          live={{ streamDelaySeconds: match.stream_delay_s }}
        />

        <div className="mt-3 flex items-center justify-between text-body text-ink-faint">
          <span className="font-mono">{formatGameTime(match.game_time)}</span>
          <span className="font-mono">
            {match.radiant_score} — {match.dire_score}
          </span>
        </div>
      </Surface>
    </Link>
  )
}
```

- [ ] **Step 3: Починить драфт и удалить старую полосу**

```tsx
// src/components/DraftStrip.tsx:45 — заменить
                entry.is_radiant ? 'border-radiant' : 'border-dire',
```

```bash
rm src/components/WinProbabilityBar.tsx
```

- [ ] **Step 4: Перевести страницу матча на примитив**

В `src/routes/match.tsx` заменить блок `WinProbabilityBar` + `StreamDelayNotice` на один вызов, и убрать оба импорта:

```tsx
      {latest && (
        <ProbabilityDisplay
          pRadiant={latest.p_radiant}
          radiantName={data.radiant.name}
          direName={data.dire.name}
          variant="broadcast"
          live={data.is_live ? { streamDelaySeconds: data.stream_delay_seconds } : undefined}
        />
      )}
```

Там же заменить `text-dire` в строке ошибки на `<Failed message="Матч не найден" />` и `text-neutral-500` в загрузке на `<Loading />`.

- [ ] **Step 5: Прогнать всё**

Run: `npm run typecheck && npm test`
Expected: типы чисты, тесты зелены. `TrainingStatus` и `SeriesScore` не затронуты.

- [ ] **Step 6: Коммит**

```bash
git add -A src/components src/routes/match.tsx
git commit -m "rebuild the live match card on the new primitives"
```

---

### Task 12: Главная страница

**Files:**
- Modify: `src/routes/live.tsx`
- Test: `src/routes/live.test.tsx` (создать)

**Interfaces:**
- Consumes: `liveMatchesQuery`, `recentMatchesQuery`, `modelMetricsQuery`, `MatchCard`, `PlayedMatchCard`, `ModelStrip`, `Loading`/`Empty`.
- Produces: обновлённый `liveRoute` по пути `/`.

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/routes/live.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { rootRoute } from './root'
import { liveRoute } from './live'
import { matchRoute } from './match'
import { accuracyRoute } from './accuracy'

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    routeTree: rootRoute.addChildren([liveRoute, matchRoute, accuracyRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

function stubApi(routes: Record<string, unknown>) {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const path = new URL(String(input), 'http://localhost').pathname
    // `in`, а не `??`: заглушка null означает «ручка ответила пусто», и подменять её
    // пустым массивом значит кормить компонент не тем, что он получит в жизни.
    const body = path in routes ? routes[path] : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
}

describe('home page', () => {
  it('falls back to played matches when nothing is live', async () => {
    stubApi({
      '/api/matches/live': [],
      // Полоса модели рисуется только при непустых метриках; здесь их нет.
      '/api/model/metrics': null,
      '/api/matches/recent': [
        {
          match_id: 1,
          league_id: 10,
          league_name: 'The International 2026',
          tier: 'tier1',
          radiant: { team_id: 1, name: 'Team Spirit', logo_url: null },
          dire: { team_id: 2, name: 'Falcons', logo_url: null },
          radiant_win: true,
          started_at: '2026-09-01T12:00:00Z',
          series: {
            series_id: null, format: null, score_a: 0, score_b: 0,
            winner_team_id: null, is_draw: false, game_in_series: 1,
            is_conditional_game: false,
          },
          curve: [{ minute: 11, p_radiant: 0.62, predicted_at: '2026-09-01T12:11:00Z' }],
          p_at_ten: 0.62,
          model_version: 'lgbm-20260901-090724',
        },
      ],
    })
    renderHome()
    // Экран, построенный вокруг одной цифры, без неё не должен выглядеть поломанным.
    await waitFor(() => expect(screen.getByText('Team Spirit')).toBeInTheDocument())
  })

  it('says the feed only covers matches it predicted', async () => {
    stubApi({ '/api/matches/live': [], '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()
    await waitFor(() =>
      expect(screen.getByText(/по которым мы дали прогноз/i)).toBeInTheDocument(),
    )
  })
})
```

- [ ] **Step 2: Прогнать тест и убедиться, что он падает**

Run: `npx vitest run src/routes/live.test.tsx`
Expected: FAIL — на странице нет ни ленты сыгранных, ни этой подписи.

- [ ] **Step 3: Переписать страницу**

```tsx
// src/routes/live.tsx — целиком
import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { liveMatchesQuery, modelMetricsQuery, recentMatchesQuery } from '@/api/queries'
import { MatchCard } from '@/components/MatchCard'
import { ModelStrip } from '@/components/ModelStrip'
import { PlayedMatchCard } from '@/components/PlayedMatchCard'
import { Empty, Loading } from '@/ui/Pending'
import { rootRoute } from './root'

/**
 * F1 плюс лента сыгранных.
 *
 * Один роут, а не два. Матчи Tier 1 идут несколько часов в сутки, и страница, осмысленная
 * только в эти часы, — это страница, которая большую часть времени сломана. Идущее
 * появляется сверху, когда оно есть; всё остальное время экран занимает то, что уже
 * сыграно.
 */
function HomePage() {
  const live = useQuery(liveMatchesQuery())
  const recent = useQuery(recentMatchesQuery())
  const metrics = useQuery(modelMetricsQuery())

  if (live.isLoading && recent.isLoading) return <Loading />

  const liveMatches = live.data ?? []
  const playedMatches = recent.data ?? []

  return (
    <div className="space-y-6">
      {metrics.data && <ModelStrip data={metrics.data} />}

      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-body text-ink-faint">Идут сейчас</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveMatches.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-body text-ink-faint">
          Сыграно{' '}
          <span className="text-ink-faint/70">
            · только матчи, по которым мы дали прогноз
          </span>
        </h2>
        {playedMatches.length === 0 ? (
          <Empty
            title="Сверенных матчей пока нет"
            hint="Матч попадает сюда после того, как закончился и его исход приехал из внешнего источника"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {playedMatches.map((match) => (
              <PlayedMatchCard key={match.match_id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
```

- [ ] **Step 4: Прогнать тесты**

Run: `npx vitest run src/routes/live.test.tsx`
Expected: PASS, 2 теста.

- [ ] **Step 5: Прогнать всё, что гоняет CI**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: чисто. Тестов 66 (35 прежних + 31 новый).

- [ ] **Step 6: Проверить руками**

Поднять бэкенд (`docker compose up -d` в `dota-oracle-backend`, затем uvicorn из venv на 8100) и `npm run dev`. Открыть `localhost:5273`. Убедиться: полоса модели вверху, лента сыгранных с кривыми, у карточки нет ни галочек, ни «вчера».

- [ ] **Step 7: Коммит**

```bash
git add src/routes/live.tsx src/routes/live.test.tsx
git commit -m "make the home screen work at any hour of the day"
```

---

### Task 13: Гарнитура

Последней: до неё всё работает на системном стеке, и ни одна задача её не ждёт.

**Files:**
- Create: `src/ui/fonts/` (файл гарнитуры)
- Modify: `src/ui/tokens.css`, `tailwind.config.js`

**Interfaces:**
- Consumes: токены задачи 1.
- Produces: семейство `font-figure`, применяемое к `text-hero`, `text-lead` и всем `font-mono`-числам.

- [ ] **Step 1: Положить файл гарнитуры**

Критерии из спеки: табличные цифры, узкое начертание, ось веса, открытая лицензия, до сотни килобайт. Кандидат по умолчанию — Archivo (variable, OFL). Скачать `.woff2` и положить в `src/ui/fonts/`. Vite соберёт его как ассет.

Если владелец предпочитает остаться на системных шрифтах — задача снимается целиком, остальное не затрагивается.

- [ ] **Step 2: Объявить семейство**

```css
/* src/ui/tokens.css — дописать над :root */
@font-face {
  font-family: 'Figure';
  src: url('./fonts/Archivo-Variable.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-display: swap;
  /* Табличные цифры: иначе меняющаяся вероятность дёргает соседние элементы. */
  font-variant-numeric: tabular-nums;
}
```

```js
// tailwind.config.js — в theme.extend
      fontFamily: {
        figure: ['Figure', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
```

- [ ] **Step 3: Применить к главной цифре**

В `src/ui/ProbabilityDisplay.tsx` заменить `font-mono` на `font-figure tabular-nums` в блоке с числами.

- [ ] **Step 4: Проверить**

Run: `npm run build && npm test`
Expected: сборка проходит, тесты зелены — тесты ищут текст, а не шрифт.

Открыть `localhost:5273` и посмотреть на цифру в 88px: именно на этом кегле видно, годится гарнитура или нет.

- [ ] **Step 5: Коммит**

```bash
git add src/ui/fonts src/ui/tokens.css tailwind.config.js src/ui/ProbabilityDisplay.tsx
git commit -m "give the headline figure a typeface of its own"
```

---

## Что остаётся второму плану

Календарь, турнир и страница точности в плотном режиме, моменты перелома на кривой матча, значок «идёт сейчас» в календаре, и §8 спеки в обеих копиях. Ничего из этого не блокирует первую часть.

Туда же уезжает примитив `Stat` (подпись, значение, пояснение), который спека числит в наборе. В первой части его негде применить — `ModelStrip` устроен строкой, а не плитками, — а извлекать компонент раньше единственного потребителя значит писать код на будущее, которое ещё может не наступить. Он извлекается из `routes/accuracy.tsx` тогда же, когда эта страница перерисовывается.

---

## Что разошлось при исполнении

План — документ до работы, код — после. Три места, где они разъехались; источник истины
в этих трёх — репозиторий, а не текст выше.

- **`Sparkline` рисует исход хвостом, а не кружком.** В плане `<circle>` и проп `height`;
  в коде — `<path data-outcome=…>` цветом победителя, `preserveAspectRatio="none"` и
  `className`. Причина увидена глазами: SVG с сохранением пропорций растягивался в ширину
  карточки и раздувал её до сотни пикселей пустотой, а при растянутых координатах круг
  стал бы эллипсом. Тест из плана (`querySelector('circle')`) на реальном компоненте
  упадёт.
- **Свечение мягче.** `0 0 40px -12px` → `0 0 28px -22px`: на первом же живом экране
  карточки читались как неоновые прямоугольники и спорили с главной цифрой.
- **Обе карточки молчат о неизвестной лиге.** `Лига ${match.league_id}` при `null`
  печатало «Лига null» — подпись, которая выглядит как данные и ими не является.

- **`src/lib/utils.ts` всё-таки правился, и это осознанное исключение из границы.**
  `tailwind-merge` не знает кастомных размеров темы и принимал `text-micro` за цвет:
  `cn('text-micro', 'text-radiant')` молча выбрасывал размер, и дельта у вероятности
  рисовалась кеглем главной цифры — 88px. Чинится только там, где живёт `cn()`, поэтому
  граница нарушена сознательно: обходить это в каждом вызове значило бы оставить мину под
  всей темой. Рядом появился `src/lib/utils.test.ts` с тремя проверками именно на эту
  ловушку.
- **Табличные цифры включаются классом, а не дескриптором.** В плане `font-variant-numeric`
  стоял внутри `@font-face`, где он не делает ничего: это свойство текста. Стоит на самих
  числах в `ProbabilityDisplay`.
- **Дельта масштабируется вместе с вариантом.** В броадкастном режиме `text-lead`, а не
  `text-micro`: рядом с 88px двенадцатый кегль теряется, а на втором экране смотрят именно
  на направление.

Задача 13 (гарнитура) **выполнена**: Archivo Variable, 35 КБ, подключён локальным файлом.
