# 05: the committed visual baselines no longer match the pinned Chromium

**Spec:** [../spec.md](../spec.md) → ticket 02, "visual baselines unchanged"

**Status:** needs-info

**Facts:** `pnpm test-visual` on `spec/leading-actions` fails: 783 captures differ from `visual/`,
most by 0.1–1.5 %, the largest in stories this spec does not touch (`feedback-toast--default`
6 %, `overlays-dialog--*` 4.9 %, `foundations-tokens--semantic-colors` 3.9 %). `master` fails the
same way: re-taking its select, autocomplete and time stories in the same environment rewrote 121
of their baselines. The baselines were last taken on 2026-10-19 (`d82852f`) with the
playwright-core 1.63.0 Chromium that `check-visual.mjs` pins, so something outside the repo
changed the rendering since (fonts, GPU driver or Windows update; not investigated). The branch
itself changes nothing visible: fresh `master` screenshots of the select, multi-select,
autocomplete and time stories (51 stories × 3 modes) compared with the branch give "No visual
changes". Every other step of `/phase-check` passes.

**Options:**

1. Merge the spec; then find what changed the rendering and re-take every baseline with
   `pnpm test-visual:update` in one `chore(visual)` commit, after looking at the diffs in
   `dist/visual-diff/` (recommended).
2. Re-take every baseline now, without looking for the cause.
3. Leave the baselines as they are until the drift is understood; `test-visual` stays red.

## Русский перевод

# 05: закоммиченные визуальные эталоны больше не совпадают с закреплённым Chromium

**Спека:** [../spec.md](../spec.md) → тикет 02, «визуальные эталоны не меняются»

**Статус:** needs-info

**Факты:** `pnpm test-visual` на `spec/leading-actions` падает: 783 снимка отличаются от
`visual/`, в основном на 0.1–1.5 %, сильнее всего в историях, которых спека не касается
(`feedback-toast--default` 6 %, `overlays-dialog--*` 4.9 %, `foundations-tokens--semantic-colors`
3.9 %). `master` падает так же: пересъёмка его историй select, autocomplete и time в том же
окружении переписала 121 эталон. Эталоны последний раз снимались 2026-10-19 (`d82852f`)
Chromium из playwright-core 1.63.0, который закрепляет `check-visual.mjs`, значит, с тех пор
рендер изменило что-то вне репозитория (шрифты, драйвер GPU или обновление Windows; причину не
искали). Сама ветка ничего видимого не меняет: свежие снимки `master` для историй select,
multi-select, autocomplete и time (51 история × 3 режима) в сравнении с веткой дают «No visual
changes». Остальные шаги `/phase-check` проходят.

**Варианты:**

1. Влить спеку; затем найти, что изменило рендер, и пересоздать все эталоны через
   `pnpm test-visual:update` одним коммитом `chore(visual)`, предварительно просмотрев диффы в
   `dist/visual-diff/` (рекомендую).
2. Пересоздать все эталоны сейчас, не ища причину.
3. Оставить эталоны как есть, пока дрейф не объяснён; `test-visual` остаётся красным.
