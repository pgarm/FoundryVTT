# Changelog

All notable changes to `squeeze-it` are documented in this file.

## 1.0.1

- Added manifest metadata improvements:
  - `system` restriction for `dnd5e`
  - `license` URL
  - `changelog` URL
- Improved release/documentation alignment and workflow hardening around publishing and metadata consistency.

## 1.0.0

- Initial public release of `squeeze-it`.
- Added size-aware squeezing behavior integrated with Region Modify Movement Cost:
  - `All`: applies normal multiplier behavior
  - Specific size selected:
    - smaller creatures ignore multiplier
    - equal size uses multiplier
    - larger creatures are blocked (infinite movement cost)
- Added Region Behavior sheet UI injection for squeeze size configuration.
- Added persistence for squeeze-size flag and tooltip guidance in config UI.
