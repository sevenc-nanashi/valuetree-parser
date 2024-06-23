/** Represents a JUCE's variant type. */
export type VariantType =
  | {
    type: "int";
    value: number;
  }
  | {
    type: "boolTrue";
    value: true;
  }
  | {
    type: "boolFalse";
    value: false;
  }
  | {
    type: "double";
    value: number;
  }
  | {
    type: "string";
    value: string;
  }
  | {
    type: "int64";
    value: bigint;
  }
  | {
    type: "array";
    value: VariantType[];
  }
  | {
    type: "binary";
    value: Uint8Array;
  }
  | {
    type: "undefined";
    value: undefined;
  };

/** Represents a JUCE's ValueTree. */
export type ValueTree = {
  type: string;
  attributes: Record<string, VariantType>;
  children: ValueTree[];
};
