type OptionsOffsetOfRegister = {
  buffer: Buffer;
  startRegister: number;
  register: number;
};
export const offsetOf = ({
  buffer,
  startRegister,
  register,
}: OptionsOffsetOfRegister) => {
  const offset = (register - startRegister) * 2;
  if (offset < 0 || offset >= buffer.length) {
    throw new Error(
      `bad offset request: ${buffer.length}, ${startRegister}, ${register}`
    );
  }

  return offset;
};

type OptionsNumberFromBuffer = {
  buffer: Buffer;
  register: number;
  length: 1 | 2;
  signed: "signed" | "unsigned";
  startRegister: number;
  decimalPlaces?: number;
};
export const numberAt = ({
  buffer,
  register,
  length,
  signed,
  startRegister,
  decimalPlaces,
}: OptionsNumberFromBuffer) => {
  const offset = offsetOf({ buffer, startRegister, register });

  const integerValue = (() => {
    if (length === 1 && signed === "unsigned") {
      return buffer.readUInt16BE(offset);
    }
    if (length === 1 && signed === "signed") {
      return buffer.readInt16BE(offset);
    }
    if (length === 2 && signed === "unsigned") {
      return buffer.readUInt32BE(offset);
    }
    if (length === 2 && signed === "signed") {
      return buffer.readInt32BE(offset);
    }

    throw new Error(`bad number request: ${length}, ${signed}`);
  })();

  if (decimalPlaces === undefined || decimalPlaces <= 0) {
    return integerValue;
  }

  // trying to minimize rounding errors
  const factor =
    decimalPlaces === 1
      ? 0.1
      : decimalPlaces === 2
      ? 0.01
      : decimalPlaces === 3
      ? 0.001
      : 1 / Math.pow(10, decimalPlaces);

  return integerValue * factor;
};

type OptionsAsciiFromBuffer = {
  buffer: Buffer;
  startRegister: number;
  register: number;
  length: number;
};
export const asciiAt = ({
  buffer,
  register,
  length,
  startRegister,
}: OptionsAsciiFromBuffer) => {
  const startOffset = offsetOf({ buffer, startRegister, register });
  const endOffset = startOffset + length * 2;
  return buffer.toString("ascii", startOffset, endOffset).replace(/\x00+$/, "");
};
