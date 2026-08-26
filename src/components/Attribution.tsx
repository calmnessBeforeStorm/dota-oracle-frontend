/**
 * Legally required, not decorative (spec section 13): Liquipedia data is CC-BY-SA and must
 * be attributed wherever it is displayed, and Valve requires a non-affiliation disclaimer.
 */
export function Attribution() {
  return (
    <footer className="border-t border-neutral-800 px-4 py-6 text-xs leading-relaxed text-neutral-500">
      <p>
        Данные турниров —{' '}
        <a
          className="underline hover:text-neutral-300"
          href="https://liquipedia.net/dota2"
          target="_blank"
          rel="noreferrer"
        >
          Liquipedia
        </a>
        , лицензия{' '}
        <a
          className="underline hover:text-neutral-300"
          href="https://creativecommons.org/licenses/by-sa/3.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC-BY-SA
        </a>
        . Игровые данные — Valve, OpenDota, STRATZ.
      </p>
      <p className="mt-1">
        Проект не аффилирован с Valve Corporation. Dota 2 — торговая марка Valve Corporation.
        Сервис аналитический и не связан со ставками.
      </p>
    </footer>
  )
}
