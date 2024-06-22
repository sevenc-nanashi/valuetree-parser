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
