export const variantTypes = {
  1: "int",
  2: "boolTrue",
  3: "boolFalse",
  4: "double",
  5: "string",
  6: "int64",
  7: "array",
  8: "binary",
  9: "undefined",
} as const satisfies Record<number, string>;

/** Represents a JUCE's variant type. */
export type VariantType =
  | number
  | boolean
  | string
  | bigint
  | Array<VariantType>
  | Uint8Array
  | undefined;

/** Represents a JUCE's ValueTree. */
export type ValueTree = {
  type: string;
  attributes: Record<string, VariantType>;
  children: ValueTree[];
};
