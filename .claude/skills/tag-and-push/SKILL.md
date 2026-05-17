---
name: tag-and-push
description: Cut a repo-wide release tag and push it to trigger the publish.yml workflow on GitHub Actions. Use when packages have been version-bumped and are ready to release to npm.
---

This repo publishes via a single `v<semver>` repo-wide tag — `.github/workflows/publish.yml` triggers on `tags: ['v*']` and walks every workspace, publishing each one whose version is not already on the registry. You do NOT publish from your laptop; you cut a tag and let CI handle it.

## Steps

1. **Verify clean preconditions.**
   - `git status` — confirm we're on the intended branch (usually `main`) and surface any uncommitted/untracked files.
   - `git log -1 --format='%H %s'` — show the tip commit.
   - List which workspace packages have version changes since the previous tag — `git diff <prev-tag>..HEAD -- packages/*/package.json` and identify `packages/<name>/package.json` `version` bumps.
   - List current local tags: `git tag --sort=-creatordate | head -5`.

2. **Pick the next tag.**
   - Previous repo tag = last `v<semver>` tag.
   - Default next tag: bump per the highest individual package bump (major → repo major, minor → repo minor, patch → repo patch). E.g. if `dna-core` minor-bumped, the repo tag is also a minor bump.
   - Confirm the proposed tag with the user using `AskUserQuestion`. Show: previous tag, proposed new tag, list of `<pkg>@<version>` lines that will be published.

3. **Make sure the working tree is committed.**
   - If `git status` shows uncommitted work, ask whether to commit it via the `commit` skill or stop. Do NOT auto-commit without confirmation — the user may be mid-edit.
   - Pre-commit hooks must pass. If a hook fails, fix the underlying issue and try again — never use `--no-verify`.

4. **Create the annotated tag.**
   - `git tag -a v<x.y.z> -m "Release v<x.y.z>: <one-line summary>"`
   - The message should be a single sentence noting which packages went up (e.g. `"Release v0.7.0: dna-schemas@0.6.0 + dna-core@0.8.0 — base contract"`).

5. **Push.**
   - Show the user what will be pushed (commits + tag).
   - Ask for explicit confirmation: tag-push triggers the publish workflow, which is hard to reverse (npm doesn't allow re-publishing the same version).
   - `git push origin <branch>` first (so the tag points at a pushed commit).
   - `git push origin v<x.y.z>`.

6. **Confirm the workflow started.**
   - `gh run list --workflow=publish.yml --limit=3` to surface the new run.
   - Print the run URL so the user can watch.

## Guardrails

- NEVER force-push (`--force`/`-f`). NEVER use `--no-verify` to skip hooks.
- NEVER delete or move an existing remote tag — published versions are permanent on npm.
- If `gh` is not authenticated (`gh auth status` fails), surface the URL `https://github.com/<owner>/<repo>/actions` instead of guessing run state.
- If the version in any workspace `package.json` is already on npm (`npm view <name>@<version> version` returns it), the workflow will skip-publish that package quietly — that's fine, but flag it to the user so they know.
- The publish workflow uses `--provenance`; tags must be pushed from a clean main branch on GitHub Actions for that to work.

## Out of scope

- Local `npm publish`: that's the `publish-npm` skill, used when you want to bypass CI.
- Per-package tags (`@dna-codes/core@x.y.z`): legacy convention; the current workflow listens for `v*` only.
- Pre-release tags (`v0.7.0-rc.1`): not currently set up — the workflow would still fire, but `--provenance` and `npm dist-tag` handling aren't wired in.
