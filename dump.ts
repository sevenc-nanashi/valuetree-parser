// Based on: https://github.com/SoulMelody/LibreSVIP/blob/main/libresvip/plugins/tssln/value_tree.py

import type { ValueTree, VariantType } from "./common.ts";
import { BinaryWriter } from "@sevenc-nanashi/binaryseeker";

const reverseVariantTypes = {
  int: 1,
  boolTrue: 2,
  boolFalse: 3,
  double: 4,
  string: 5,
  int64: 6,
  array: 7,
  binary: 8,
  undefined: 9,
} as const satisfies Record<string, number>;

/**
 * Dumps a JUCE's ValueTree to a Uint8Array.
 *
 * @param valueTree The ValueTree to dump.
 * @returns The Uint8Array containing the ValueTree.
 */
export const dumpValueTree = (valueTree: ValueTree): Uint8Array => {
  const reader = new BinaryWriter();

  writeValueTree(reader, valueTree);

  return reader.toUint8Array();
};

const writeCompreseedInt = (writer: BinaryWriter, value: number): void => {
  const bytes = [];
  while (value > 0) {
    bytes.push(value & 0xff);
    value >>= 8;
  }

  writer.writeUInt8(bytes.length);
  writer.writeBytes(new Uint8Array(bytes));
};

const writeValueTree = (writer: BinaryWriter, valueTree: ValueTree): void => {
  writer.writeString(valueTree.type);

  writeCompreseedInt(writer, Object.keys(valueTree.attributes).length);

  for (const [key, value] of Object.entries(valueTree.attributes)) {
    writer.writeString(key);
    writeVariant(writer, value);
  }

  writeCompreseedInt(writer, valueTree.children.length);
  for (const child of valueTree.children) {
    writeValueTree(writer, child);
  }
};

const writeVariant = (writer: BinaryWriter, value: VariantType): void => {
  let variantType: keyof typeof reverseVariantTypes;
  switch (typeof value) {
    case "number":
      if (Number.isInteger(value)) {
        if (value >= -2147483648 && value <= 2147483647) {
          variantType = "int";
        } else {
          variantType = "int64";
        }
      } else {
        variantType = "double";
      }

      break;
    case "boolean":
      variantType = value ? "boolTrue" : "boolFalse";
      break;
    case "string":
      variantType = "string";
      break;
    case "bigint":
      variantType = "int64";
      break;
    case "object":
      if (Array.isArray(value)) {
        variantType = "array";
      } else if (value instanceof Uint8Array) {
        variantType = "binary";
      } else if (value === undefined) {
        variantType = "undefined";
      } else {
        throw new Error(`Unknown variant type: ${value}`);
      }
      break;
    default:
      throw new Error(`Unknown variant type: ${value}`);
  }

  const variantTypeInt = reverseVariantTypes[variantType];

  const subWriter = new BinaryWriter();

  subWriter.writeUInt8(Number(variantTypeInt));

  switch (variantType) {
    case "int":
      subWriter.writeInt32LE(value as number);
      break;
    case "boolTrue":
    case "boolFalse":
      break;
    case "double":
      subWriter.writeFloat64LE(value as number);
      break;
    case "string":
      subWriter.writeString(value as string);
      break;
    case "int64":
      subWriter.writeUInt64LE(value as bigint);
      break;
    case "array": {
      const length = (value as VariantType[]).length;
      writeCompreseedInt(subWriter, length);

      for (const item of value as VariantType[]) {
        writeVariant(subWriter, item);
      }

      break;
    }
    case "binary":
      subWriter.writeBytes(value as Uint8Array);
      break;

    case "undefined":
      break;
  }

  const subWriterUint8Array = subWriter.toUint8Array();
  writeCompreseedInt(writer, subWriterUint8Array.length);
  writer.writeBytes(subWriterUint8Array);
};
