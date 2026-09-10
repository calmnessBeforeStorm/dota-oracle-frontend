export const TIER_OPTIONS = [
  { key: 'tier1', label: 'Tier 1' },
  { key: 'tier2', label: 'Tier 2' },
  { key: 'tier3', label: 'Tier 3' },
  { key: 'unknown', label: 'Без разметки' },
] as const

export type Tier = (typeof TIER_OPTIONS)[number]['key']

/**
 * По умолчанию лента показывает только Tier 1.
 *
 * Замер 10.09.2026: в живом фиде 35 игр из 25 лиг, у всех до одной `tier = unknown` —
 * любительские и коммьюнити-турниры. Без фильтра продукт про Tier 1 выглядит списком
 * случайных матчей. Обратная сторона честная: Tier 1 играет не каждый день (последний матч
 * на тот момент — 23.08), поэтому по умолчанию лента часто пуста, и это состояние обязано
 * объяснять себя словами, а не пустым местом.
 */
export const DEFAULT_TIERS: Tier[] = ['tier1']

const STORAGE_KEY = 'live-tiers'
const VALID = new Set<string>(TIER_OPTIONS.map((option) => option.key))

/** Тир, известный интерфейсу: всё незнакомое считается неразмеченным, а не теряется. */
export function normaliseTier(tier: string | null | undefined): Tier {
  return tier && VALID.has(tier) ? (tier as Tier) : 'unknown'
}

/**
 * Читает сохранённый выбор.
 *
 * Всё в try/catch и провалидировано: в приватном окне обращение к localStorage бросает, а
 * лежать там может что угодно — прошлая версия ключа, чужая запись, поправленная руками
 * строка. Пустой набор из мусора разбирать нельзя: он означал бы вечно пустую ленту, что
 * неотличимо от поломки.
 */
export function readTiers(): Tier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TIERS
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_TIERS
    const tiers = parsed.filter(
      (value): value is Tier => typeof value === 'string' && VALID.has(value),
    )
    return tiers.length > 0 ? tiers : DEFAULT_TIERS
  } catch {
    return DEFAULT_TIERS
  }
}

export function writeTiers(tiers: Tier[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tiers))
  } catch {
    // Выбор фильтра — удобство, а не данные. Приватное окно не повод ронять страницу.
  }
}

/**
 * Переключение тира с одним запретом: снять последний нельзя.
 *
 * Иначе один лишний клик даёт пустой экран, который читается как сломанный продукт, а не
 * как выбор пользователя.
 */
export function toggleTier(tiers: Tier[], tier: Tier): Tier[] {
  if (tiers.includes(tier)) {
    if (tiers.length === 1) return tiers
    return tiers.filter((value) => value !== tier)
  }
  // Пересобираем в каноническом порядке, а не дописываем в конец: иначе набор зависит от
  // того, в каком порядке по нему кликали.
  return TIER_OPTIONS.map((option) => option.key).filter(
    (key) => tiers.includes(key) || key === tier,
  )
}
