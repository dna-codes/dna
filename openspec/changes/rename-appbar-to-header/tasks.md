## 1. Rename AppBar → Header (compound)

- [x] 1.1 Move `src/components/AppBar/` to `src/components/Header/`, replacing
  the old thin `Header` files (`Header.tsx`, `Header.stories.tsx`,
  `Header.test.tsx`, `index.ts`).
- [x] 1.2 In `Header.tsx`: rename the export object `AppBar` → `Header`, rename
  prop types `AppBar*Props` → `Header*Props`, change every `data-ui-appbar*`
  attribute → `data-ui-header*`, and update displayNames (`Header`,
  `Header.Brand`, …) and the doc comment/example.
- [x] 1.3 Update `src/components/Header/index.ts` to export `Header` and the
  `Header*Props` types.
- [x] 1.4 Update `Header.test.tsx` to import/use `Header` and assert
  `data-ui-header*` hooks; keep the banner/nav/search/asChild coverage.
- [x] 1.5 Update `Header.stories.tsx`: title `Structure/Header`, `Default` story
  using `Header.*`; remove the `ApplicationShell` story (moves in section 2).

## 2. Add ApplicationShell component

- [x] 2.1 Create `src/components/ApplicationShell/ApplicationShell.tsx` — a
  headless compound (`Root`/`Header`/`Body`/`Sidebar`/`Main`) per design:
  `Root` renders `Application` with `data-ui-app-shell`; `Body` the flex row
  with `data-ui-app-shell-body`; slots support `asChild`, `forwardRef`,
  className/style passthrough.
- [x] 2.2 Create `ApplicationShell/index.ts` barrel (component + prop types).
- [x] 2.3 Create `ApplicationShell.stories.tsx` (title `Structure/ApplicationShell`)
  porting the former `AppBar > ApplicationShell` composition onto the new slots
  (Header + Sidebar/NavRail + Page + PageHeader).
- [x] 2.4 Create `ApplicationShell.test.tsx` asserting the `data-ui-app-shell*`
  hooks and that banner/main/navigation landmarks come from the composed parts.

## 3. Barrel, skin, and in-repo consumers

- [x] 3.1 `src/index.ts`: remove the `AppBar` export, keep one `Header` export,
  add the `ApplicationShell` export (under the "Application chrome" section).
- [x] 3.2 `src/styles/skin.css`: rename all `data-ui-appbar*` selectors →
  `data-ui-header*`; add any `data-ui-app-shell*` layout rules needed to match
  the former shell story's side-by-side arrangement.
- [x] 3.3 Run `npm run gen:skin` to regenerate `src/styles/skin.generated.ts`;
  verify no `appbar` remains.
- [x] 3.4 Update `Application.stories.tsx` to use `Header.Root` (or
  `ApplicationShell`) instead of the removed thin `<Header>`.

## 4. Docs

- [x] 4.1 Update `engine/ui-library/README.md`: structural-primitive list and
  "Application chrome" section — `AppBar` → `Header`, add `ApplicationShell`.
- [x] 4.2 Update `engine/ui-library/CLAUDE.md` structural-primitive references
  (`Header` now the compound chrome; mention `ApplicationShell`).

## 5. Verify

- [x] 5.1 `npm run typecheck`
- [x] 5.2 `npm test`
- [x] 5.3 `npm run lint`
- [x] 5.4 `npm run build`
- [x] 5.5 Grep the package for residual `AppBar` / `appbar` references; confirm
  none remain outside this change's archive.
