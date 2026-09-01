import type { ModelMetrics, ModelTraining } from '@/api/types'
import { comparisonsLabel, matchesLabel } from '@/lib/metrics'
import { formatDateRange } from '@/lib/utils'

/**
 * F6: where the served model came from, next to what it has proved on air.
 *
 * This exists because the page could only ever state the second half. It said "9 matches, do
 * not trust these numbers" and stopped, so a visitor concluded the model had never been
 * validated - when it had been, on 1293 matches. Both halves are true and neither stands in
 * for the other:
 *
 * - **Holdout** is a slice of parsed replays the model never saw, scored once, offline. It is
 *   large, and it is the reason the model is allowed to be served at all (spec section 7.3).
 * - **Served** is what visitors were actually shown, built from the live scoreboard rather
 *   than a replay. It can only ever cover matches that were on air while this exact version
 *   was running, and it is the only number that reflects production conditions (section 6.4).
 *
 * Keeping them visibly apart is the point. Adding them together, or showing whichever is
 * larger, would be the flattery this page exists to refuse.
 */
function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-neutral-800/70 px-4 py-2 first:border-t-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right">
        <span className="font-mono text-sm">{value}</span>
        {hint && <span className="ml-2 text-xs text-neutral-600">{hint}</span>}
      </span>
    </div>
  )
}

function GateVerdict({ training }: { training: ModelTraining }) {
  if (!training.passes_gate) {
    return (
      <div className="border-t border-neutral-800/70 px-4 py-2">
        <div className="text-sm text-red-300/90">
          Гейт не пройден — {comparisonsLabel(training.gate_failures.length)}
        </div>
        <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
          {training.gate_failures.map((failure) => (
            <li key={failure}>{failure}</li>
          ))}
        </ul>
      </div>
    )
  }

  if (training.gate_ties.length > 0) {
    return (
      <div className="border-t border-neutral-800/70 px-4 py-2">
        <div className="text-sm text-neutral-300">
          Гейт пройден, но {comparisonsLabel(training.gate_ties.length)} внутри шума
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          В этих корзинах минут модель от простого бейзлайна статистически неотличима: разница
          меньше, чем разброс на выборке такого размера. Проход — это ещё не запас.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-neutral-800/70 px-4 py-2 text-sm text-neutral-300">
      Гейт пройден — бьёт все бейзлайны во всех корзинах минут
    </div>
  )
}

export function TrainingStatus({ data }: { data: ModelMetrics }) {
  const { training } = data

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-neutral-800 bg-neutral-900">
        <header className="border-b border-neutral-800 px-4 py-2.5">
          <h2 className="text-sm text-neutral-400">На чём обучена</h2>
        </header>
        {training ? (
          <>
            <Row
              label="Обучение"
              value={matchesLabel(training.train_matches)}
              hint={formatDateRange(training.train_window[0] ?? null, training.train_window[1] ?? null)}
            />
            <Row
              label="Холдаут"
              value={matchesLabel(training.holdout_matches)}
              hint={formatDateRange(training.holdout_window[0] ?? null, training.holdout_window[1] ?? null)}
            />
            <Row label="Log loss на холдауте" value={training.holdout_log_loss.toFixed(4)} />
            <Row label="ECE на холдауте" value={training.holdout_ece.toFixed(3)} />
            <Row label="Признаков" value={String(training.feature_count)} />
            <Row
              label="Калибровка"
              value={training.calibrator}
              hint={training.weighted ? 'веса тиров' : undefined}
            />
            <GateVerdict training={training} />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-neutral-500">
            У этой версии нет карточки модели — это бейзлайн, а не обученный артефакт. Его никто
            не обучал и слепую выборку под него не откладывал: он существует как эталон, который
            настоящая модель обязана превзойти.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900">
        <header className="border-b border-neutral-800 px-4 py-2.5">
          <h2 className="text-sm text-neutral-400">Что накоплено на боевых прогнозах</h2>
        </header>
        <Row
          label="Матчей предсказано"
          value={matchesLabel(data.predicted_matches)}
          hint={`${data.sample_size} прогнозов`}
        />
        <Row label="Из них сверено с исходом" value={matchesLabel(data.matches)} />
        <Row label="Ждут результата" value={matchesLabel(data.awaiting_outcome)} />
        {data.first_prediction_at && (
          <Row
            label="Отдаёт прогнозы"
            value={formatDateRange(data.first_prediction_at, data.last_prediction_at)}
          />
        )}
        <p className="border-t border-neutral-800/70 px-4 py-2.5 text-xs text-neutral-500">
          Прогноз появляется только для матча, который шёл в эфире, пока работала <em>эта</em>{' '}
          версия, — задним числом лог не наполняется. Поэтому счёт здесь всегда меньше холдаута
          слева, и это не признак того, что модель не проверена: слева проверка на разобранных
          реплеях, здесь — на том, что реально видели посетители.
        </p>
      </section>
    </div>
  )
}
