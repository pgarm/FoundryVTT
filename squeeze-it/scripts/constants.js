export const MODULE_ID = "squeeze-it";
export const SIZE_FLAG = "squeezeCreatureSize";
export const SIZE_ALL = "all";

export const DND5E_SIZE_OPTIONS = Object.freeze([
  { value: SIZE_ALL, label: "All" },
  { value: "tiny", label: "Tiny" },
  { value: "sm", label: "Small" },
  { value: "med", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "grg", label: "Gargantuan" }
]);

export const CreatureSize = Object.freeze({
  TINY: 0,
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
  HUGE: 4,
  GARGANTUAN: 5,

  fromString(size) {
    switch (size) {
      case "tiny": return this.TINY;
      case "sm": return this.SMALL;
      case "med": return this.MEDIUM;
      case "lg": return this.LARGE;
      case "huge": return this.HUGE;
      case "grg": return this.GARGANTUAN;
      default: return null;
    }
  }
});