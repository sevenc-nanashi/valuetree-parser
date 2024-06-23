// Based on: https://github.com/SoulMelody/LibreSVIP/blob/main/libresvip/plugins/tssln/value_tree.py

import type { ValueTree, VariantType } from "./common.ts";
import { BinaryWriter } from "@sevenc-nanashi/binaryseeker";

const reverseVariantTypes: Record<VariantType["type"], number> = {
  int: 1,
  boolTrue: 2,
  boolFalse: 3,
  double: 4,
  string: 5,
  int64: 6,
  array: 7,
  binary: 8,
  undefined: 9,
};

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
  const variantTypeInt = reverseVariantTypes[value.type];

  const subWriter = new BinaryWriter();

  subWriter.writeUInt8(Number(variantTypeInt));

  switch (value.type) {
    case "int":
      subWriter.writeInt32LE(value.value);
      break;
    case "boolTrue":
    case "boolFalse":
      break;
    case "double":
      subWriter.writeFloat64LE(value.value);
      break;
    case "string":
      subWriter.writeString(value.value);
      break;
    case "int64":
      subWriter.writeUInt64LE(value.value);
      break;
    case "array": {
      const length = value.value.length;
      writeCompreseedInt(subWriter, length);

      for (const item of value.value) {
        writeVariant(subWriter, item);
      }

      break;
    }
    case "binary":
      subWriter.writeBytes(value.value);
      break;

    case "undefined":
      break;
  }

  const subWriterUint8Array = subWriter.toUint8Array();
  writeCompreseedInt(writer, subWriterUint8Array.length);
  writer.writeBytes(subWriterUint8Array);
};
