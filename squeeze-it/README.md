# Squeeze It

[![CI](https://github.com/pgarm/FoundryVTT/actions/workflows/ci.yml/badge.svg)](https://github.com/pgarm/FoundryVTT/actions/workflows/ci.yml)
[![Local Integration Report](https://github.com/pgarm/FoundryVTT/actions/workflows/report-local-integration.yml/badge.svg)](https://github.com/pgarm/FoundryVTT/actions/workflows/report-local-integration.yml)
[![Foundry Verified](https://img.shields.io/badge/dynamic/json?color=orange&label=Foundry%20Verified&query=compatibility.verified&url=https%3A%2F%2Fgithub.com%2Fpgarm%2FFoundryVTT%2Freleases%2Fdownload%2Fmodules-latest%2Fsqueeze-it-module.json)](https://github.com/pgarm/FoundryVTT/releases/download/modules-latest/squeeze-it-module.json)
[![Foundry Minimum](https://img.shields.io/badge/dynamic/json?color=blue&label=Foundry%20Minimum&query=compatibility.minimum&url=https%3A%2F%2Fgithub.com%2Fpgarm%2FFoundryVTT%2Freleases%2Fdownload%2Fmodules-latest%2Fsqueeze-it-module.json)](https://github.com/pgarm/FoundryVTT/releases/download/modules-latest/squeeze-it-module.json)

Squeeze It extends FoundryVTT Region behavior configuration for DnD5e by adding size-aware squeeze rules on top of Modify Movement Cost.

## What this module does

- Adds a new Squeeze group to Region Behavior config when editing a Modify Movement Cost behavior.
- Adds a Size selector with all DnD5e creature sizes plus All.
- Applies movement rules dynamically based on the selected squeeze size.

## Squeeze Size Rules

When Squeeze size is set to All:

- The configured movement multiplier works as normal for all creatures.

When Squeeze size is set to a specific size (Tiny, Small, Medium, Large, Huge, Gargantuan):

- Creatures smaller than the selected size: no squeeze penalty (effective movement modifier remains 1x).
- Creatures exactly the selected size: configured movement multiplier applies.
- Creatures larger than the selected size: movement is blocked (infinite cost).

## UI behavior

- Injects a Squeeze settings group in the Modify Movement Cost behavior sheet.
- Includes a compact Size selector.
- Includes an info tooltip with rule details, split into separate sections for All and Specific size.
- Persists the selected value on the RegionBehavior document flag:
	- flags.squeeze-it.squeezeCreatureSize

## Compatibility

- FoundryVTT: v13
- System: dnd5e (2014 rules, v1 compatible data shape)

## Installation (local development)

This repository is intended for local module development.

1. Place or sync the squeeze-it folder into your Foundry Data modules directory.
2. Enable Squeeze It in your world module settings.
3. Open a Region, add or edit a Modify Movement Cost behavior, and configure Squeeze > Size.

## Development and testing

- Playwright UI checks are available in the root workspace test suite.
- Core coverage includes:
	- Foundry connection and module activation checks
	- Squeeze size persistence after save/reopen
	- Tooltip content rendering checks

### Badge workflows

- CI badge: automatic cloud-safe checks on push/PR.
- Local Integration Report badge: manually triggered from GitHub Actions (`workflow_dispatch`) after local Foundry integration tests.
- For local integration reporting, run the workflow and set:
	- `module_id` to the module tested
	- `status` to `pass` or `fail`
	- optional summary notes

### Release workflow (monorepo)

- Per-module releases are built and published automatically on push to the `main` branch.
- Release tags are used for record-keeping only, in the format `<module-folder>/<version>`.
	- Example: `squeeze-it/v1.0.1`
- Each successful release publishes versioned assets for that module.
- The workflow also updates a rolling release tag `modules-latest` used by Foundry install/update URLs.
- A separate manual workflow can republish all modules to `modules-latest` for coordinated global updates.

## License

See the repository LICENSE file.
