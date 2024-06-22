import { BinaryReader } from "@sevenc-nanashi/binaryseeker";
import type { ValueTree, VariantType } from "./common.ts";

const variantTypes = {
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

// Based on: https://github.com/SoulMelody/LibreSVIP/blob/main/libresvip/plugins/tssln/value_tree.py

/**
 * Parses a JUCE's ValueTree from a Uint8Array.
 *
 * @param data The Uint8Array to read the ValueTree from.
 * @returns The parsed ValueTree.
 */
export const parseValueTree = (data: Uint8Array): ValueTree => {
  const reader = new BinaryReader(data.buffer);

  return readValueTree(reader);
};

const readCompreseedInt = (reader: BinaryReader): number => {
  const length = reader.readUInt8();

  const bytes = reader.readBytes(length);

  return bytes.reduce((acc, byte, index) => acc + (byte << (index * 8)), 0);
};

const readValueTree = (reader: BinaryReader): ValueTree => {
  const valueTreeType = reader.readString();

  const attrs: Record<string, VariantType> = {};
  const numAttributes = readCompreseedInt(reader);

  for (let i = 0; i < numAttributes; i++) {
    const key = reader.readString();
    const value = readVariant(reader);

    attrs[key] = value;
  }

  const children = [];
  const numChildren = readCompreseedInt(reader);

  for (let i = 0; i < numChildren; i++) {
    children.push(readValueTree(reader));
  }

  return {
    type: valueTreeType,
    attributes: attrs,
    children,
  };
};

const readVariant = (reader: BinaryReader): VariantType => {
  const numBytes = readCompreseedInt(reader);
  const variantTypeInt = reader.readUInt8();
  const variantType = variantTypes[variantTypeInt as keyof typeof variantTypes];
  if (!variantType) {
    throw new Error(`Unknown variant type: ${variantTypeInt}`);
  }

  switch (variantType) {
    case "int":
      return reader.readInt32LE();
    case "boolTrue":
      return true;
    case "boolFalse":
      return false;
    case "double":
      return reader.readFloat64LE();
    case "string":
      return reader.readString();
    case "int64":
      return reader.readUInt64LE();
    case "array": {
      const length = readCompreseedInt(reader);
      const array = [];

      for (let i = 0; i < length; i++) {
        array.push(readVariant(reader));
      }

      return array;
    }
    case "binary": {
      return reader.readBytes(numBytes - 1);
    }
    case "undefined":
      return undefined;
  }
};
