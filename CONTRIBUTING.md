# Contributing

Thanks for contributing to this FoundryVTT monorepo.

## Repository layout

- Each module lives in its own top-level folder and must include a `module.json`.
- Shared Playwright test helpers are in `tests/shared`.
- Module-specific tests live in `tests/<module-id>`.

## Local development

1. Install dependencies:
   - `npm ci`
2. Run UI tests (Foundry + Edge CDP must already be running locally):
   - `npm run test:ui`

## CI and badges

- `CI` workflow runs cloud-safe checks on push/PR.
- `Local Integration Report` is manual (`workflow_dispatch`) and is used to report local Foundry integration results for badge status.

## Release model (monorepo)

This repository supports independent module release cadence.

### Unified release flow

- Workflow: `publish-module-from-tag.yml` (workflow name: **Publish changed modules**)
- Trigger:
  - Automatically on push to `main`
  - Manually via `workflow_dispatch` (`scope=changed|all`)
- Behavior:
  - Detects module folders changed in the merge/push to `main`
  - Reads each changed module's `id` and `version` from `module.json`
  - Creates a record tag per changed module (`<module-folder>/v<version>`)
  - Publishes module assets to that tag release
  - Updates rolling module assets on `modules-latest`

### Release checklist (local vs GitHub web)

1. **Local (terminal): prepare and merge changes**
  - Create/refresh branch, commit module + workflow changes, push branch.
  - Open PR.
2. **GitHub web: validate PR checks**
  - Confirm `CI` passes on the PR.
  - Review and merge PR to `main`.
3. **GitHub Actions (automatic after merge)**
  - `Publish changed modules` runs on push to `main`.
  - It tags and publishes all changed modules from that merge.
4. **GitHub web (optional): manual run**
  - Open **Actions → Publish changed modules → Run workflow**.
  - Run it on branch `main` with:
    - `scope=changed` (last push diff)
    - or `scope=all` (publish every module)
5. **GitHub web (optional): coordinated refresh**
  - Run `publish-modules.yml` via **Actions → Run workflow** when you want all modules refreshed together.

### Tag policy

- Tags are record-keeping metadata and are created by the release workflow.
- Tag pushes do not trigger publishing.
- Existing tags are reused if present; the workflow does not overwrite tag refs.

### First-time workflow enablement note

- If a new workflow file is added in a PR, that new workflow can run for that PR event once GitHub sees the workflow definition in the PR branch.
- A workflow cannot run before it exists in the branch being evaluated.
- For first-time or sensitive workflows (especially tag/release publishing), verify repository `Actions` permissions and required secrets/settings in GitHub web before tagging.

### Coordinated global refresh

- Manually run `publish-modules.yml` to republish all module assets to `modules-latest`.
- Use this for synchronized compatibility/version refreshes.

## Packaging rules

Release zips include only module runtime files from each module folder.
Do not add root-level dev/test/editor artifacts to module folders.

## Commit hygiene

Local-only files/folders are excluded via `.gitignore` and guarded in CI (forbidden tracked paths include `node_modules/`, `.vscode/`, `.copilot/`, and test-output folders).

## Pull request expectations

- Keep changes scoped and module-focused.
- Update module README and/or manifest when behavior or release metadata changes.
- Ensure tests pass locally for affected modules.
