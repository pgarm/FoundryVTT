# Contributing

Thanks for contributing to this FoundryVTT modules repo.
This repository is primarily maintainer-authored for new module development; external contributions are currently expected to be focused bugfixes and small maintenance improvements.

## For External Contributors

### Repository layout

- Each module lives in its own top-level folder and must include a `module.json`.
- Shared Playwright test helpers are in `tests/shared`.
- Module-specific tests live in `tests/<module-id>`.

### Local development

1. Install dependencies:
   - `npm ci`
2. Run UI tests (Foundry + Edge CDP must already be running locally):
   - `npm run test:ui`

### CI and badges

- `CI` workflow runs cloud-safe checks on push/PR.
- `Local Integration Report` is manual (`workflow_dispatch`) and is used to report local Foundry integration results for badge status.

### Pull request expectations

- Keep changes scoped and module-focused.
- External PRs should focus on bugfixes, compatibility fixes, docs, and small quality improvements.
- Do not add new modules in external PRs unless explicitly requested by maintainers.
- Update module README and/or manifest when behavior or release metadata changes.
- Ensure tests pass locally for affected modules.

## For Maintainers

Maintainers own module roadmap, new module creation, release policy, and repository automation.

### Adding new modules

- New modules are maintainer-driven and should be added as top-level folders containing `module.json`.
- Include module README and required runtime assets in the module folder.
- Ensure release workflows can package the module without introducing root-level dev/editor artifacts.
- Add or update tests in `tests/<module-id>` when applicable.

### Release model (monorepo)

This repository supports independent module release cadence.

#### Unified release flow

- Workflow: `publish-changed-modules.yml` (workflow name: **Publish changed modules**)
- Trigger:
  - Automatically on push to `main`
  - Manually via `workflow_dispatch` (`scope=changed|all`)
- Behavior:
  - Detects module folders changed in the merge/push to `main`
  - Reads each changed module's `id` and `version` from `module.json`
  - Creates a record tag per changed module (`<module-folder>/v<version>`)
  - Publishes module assets to that tag release
  - Updates rolling module assets on `modules-latest`

#### Release checklist (local vs GitHub web)

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

#### Tag policy

- Tags are record-keeping metadata and are created by the release workflow.
- Tag pushes do not trigger publishing.
- Existing tags are reused if present; the workflow does not overwrite tag refs.

#### First-time workflow enablement note

- If a new workflow file is added in a PR, that new workflow can run for that PR event once GitHub sees the workflow definition in the PR branch.
- A workflow cannot run before it exists in the branch being evaluated.
- For first-time or sensitive workflows (especially tag/release publishing), verify repository `Actions` permissions and required secrets/settings in GitHub web before tagging.

#### Coordinated global refresh

- Manually run `publish-modules.yml` to republish all module assets to `modules-latest`.
- Use this for synchronized compatibility/version refreshes.

#### Compatibility alert automation

- Workflow: `monitor-foundry-compat-alert.yml` (scheduled daily and runnable manually).
- It checks all module `compatibility.verified` values against the latest Foundry stable release.
- If any module is non-green, it ensures a single open issue for the latest release titled **Foundry compatibility alert: <foundry-version>** and assigns it to repository owners.
- If Foundry advances again before retesting completes, the workflow opens/updates the latest-version issue and auto-closes older compatibility alert issues.
- When all modules return to green, the workflow automatically closes all open compatibility alert issues.

#### Foundry Package Release API automation

- `publish-changed-modules.yml` notifies Foundry's Package Release API only for true new module releases.
- Notification is sent only when a new module version tag is created during publish.
- Manual republish/refresh runs (`scope=all`) do **not** trigger Foundry release notifications.

##### Required secret setup

- Secret name: `FOUNDRY_RELEASE_TOKENS_JSON`
- Store this as a JSON object mapping module IDs to Foundry package release tokens:
  - Example: `{"squeeze-it":"fvttp_xxx","another-module":"fvttp_yyy"}`
- Token values are obtained from each package page on foundryvtt.com (Package Release Token field).

##### Notes

- Keep the `fvttp_` prefix in token values.
- If a module has no configured token, publish continues and Foundry notification is skipped for that module.
- Foundry API transient errors (timeouts/network issues, HTTP 429, HTTP 5xx) are retried automatically with backoff before failing.
- Non-transient Foundry API validation errors still fail immediately and include response details in logs.

#### GitHub App identity for automation writes

Automation workflows can use a GitHub App installation token for tag/release/badge write operations.
If App secrets are not configured, workflows fall back to the default `GITHUB_TOKEN`.

##### Required secrets (repository)

- `RELEASE_APP_ID`
- `RELEASE_APP_PRIVATE_KEY`

These should correspond to an installed GitHub App for this repository.

##### Recommended GitHub App permissions

- Repository permissions:
  - **Contents: Read and write** (required for tags, releases, and badge JSON commits)
  - **Metadata: Read** (standard)
- No additional permissions are required for the current workflow behavior.

##### Ruleset / branch protection guidance

- If `main` is protected and you allow direct automation writes, add the GitHub App (not `github-actions[bot]`) as a bypass actor.
- Keep workflow file changes PR-gated (recommended via CODEOWNERS for `.github/workflows/**`).

##### Pull request rules (solo-maintainer setup)

- GitHub does not count author self-reviews toward required approvals.
- In a solo-owner repo, keep PR review requirements enabled and use a bypass role (typically `Repository admins`) for owner-authored PR merges.
- Keep `.github/CODEOWNERS` configured to owners (for example: `* @<owner-username>`) so PRs from other contributors require code-owner review by owners.
- If bypass is removed, lower required approvals to `0` to avoid locking owner-authored PRs.

##### Validation before merge

- For workflow PR branches, run manual workflows with `validate_only=true` to test logic without side effects (no tag pushes, release uploads, or Foundry notifications).

### Packaging rules

Release zips include only module runtime files from each module folder.
Do not add root-level dev/test/editor artifacts to module folders.

### Commit hygiene

Local-only files/folders are excluded via `.gitignore` and guarded in CI (forbidden tracked paths include `node_modules/`, `.vscode/`, `.copilot/`, and test-output folders).

