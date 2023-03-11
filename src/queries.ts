import type winston from "winston";
import * as buffers from "./buffers";
import type * as configFile from "./config_file";

type OptionsParse = {
  buffer: Buffer;
  logger: winston.Logger;
  overrides: configFile.Configuration["sources"][0]["overrides"];
};

export const cellTemperaturesAndVoltages = {
  register: 5000,
  length: 34,
  parse: ({ buffer, overrides }: OptionsParse) => {
    const startRegister = cellTemperaturesAndVoltages.register;

    const range = (to: number) =>
      new Array(to).fill(0).map((_, index) => index);

    const cellVoltageCount =
      overrides.cellCount ??
      buffers.numberAt({
        buffer,
        startRegister,

        register: 5000,
        length: 1,
        signed: "unsigned",
      });

    const cellVoltages = range(cellVoltageCount).map((index) =>
      buffers.numberAt({
        buffer,
        startRegister,

        register: 5001 + index,
        length: 1,
        signed: "unsigned",
      })
    );

    const cellTemperatureCount =
      overrides.cellCount ??
      buffers.numberAt({
        buffer,
        startRegister,

        register: 5017,
        length: 1,
        signed: "unsigned",
      });

    const cellTemperatures = range(cellTemperatureCount).map((index) =>
      buffers.numberAt({
        buffer,
        startRegister,

        register: 5018 + index,
        length: 1,
        signed: "unsigned",
      })
    );

    return {
      cellVoltageCount,
      cellVoltages,
      cellTemperatureCount,
      cellTemperatures,
    };
  },
};

export const counts = {
  register: 5035,
  length: 14,
  parse: ({ buffer }: OptionsParse) => {
    const startRegister = counts.register;

    const amperage = buffers.numberAt({
      buffer,
      startRegister,

      register: 5042,
      length: 1,
      signed: "signed",
      decimalPlaces: 2,
    });

    const voltage = buffers.numberAt({
      buffer,
      startRegister,

      register: 5043,
      length: 1,
      signed: "signed",
      decimalPlaces: 1,
    });

    const wattage = amperage * voltage;

    const chargeAh = buffers.numberAt({
      buffer,
      startRegister,

      register: 5044,
      length: 2,
      signed: "unsigned",
      decimalPlaces: 3,
    });

    const charge = chargeAh * voltage;

    const capacityAh = buffers.numberAt({
      buffer,
      startRegister,

      register: 5046,
      length: 2,
      signed: "unsigned",
      decimalPlaces: 3,
    });

    const capacity = capacityAh * voltage;

    const soc = 100.0 * (chargeAh / capacityAh);

    const cycle = buffers.numberAt({
      buffer,
      startRegister,

      register: 5048,
      length: 1,
      signed: "unsigned",
    });

    return {
      amperage,
      voltage,
      wattage,
      chargeAh,
      charge,
      capacityAh,
      capacity,
      soc,
      cycle,
    };
  },
};

export const limits = {
  register: 5049,
  length: 4,
  parse: ({ buffer }: OptionsParse) => {
    const startRegister = limits.register;

    return {
      chargeVoltageLimit: buffers.numberAt({
        buffer,
        startRegister,

        register: 5049,
        length: 1,
        signed: "unsigned",
        decimalPlaces: 1,
      }),
      dischargeVoltageLimit: buffers.numberAt({
        buffer,
        startRegister,

        register: 5050,
        length: 1,
        signed: "unsigned",
        decimalPlaces: 1,
      }),
      chargeAmperageLimit: buffers.numberAt({
        buffer,
        startRegister,

        register: 5051,
        length: 1,
        signed: "unsigned",
        decimalPlaces: 2,
      }),
      dischargeAmperageLimit: buffers.numberAt({
        buffer,
        startRegister,

        register: 5052,
        length: 1,
        signed: "unsigned",
        decimalPlaces: 2,
      }),
    };
  },
};

export const status = {
  register: 5100,
  length: 10,
  parse: ({ buffer }: OptionsParse) => {
    // TODO: Parse bitfields here.
    return {};
  },
};

export const properties = {
  register: 5110,
  length: 32,
  parse: ({ buffer, overrides }: OptionsParse) => {
    const startRegister = 5110;

    return {
      serial:
        overrides.serial ??
        buffers.asciiAt({
          buffer,
          startRegister,

          register: 5110,
          length: 8,
        }),

      manufacturerVersion: buffers.asciiAt({
        buffer,
        startRegister,

        register: 5118,
        length: 1,
      }),

      mainlineVersion: buffers.asciiAt({
        buffer,
        startRegister,

        register: 5119,
        length: 2,
      }),

      communicationProtocolVersion: buffers.asciiAt({
        buffer,
        startRegister,

        register: 5121,
        length: 1,
      }),

      model: buffers.asciiAt({
        buffer,
        startRegister,

        register: 5122,
        length: 8,
      }),

      softwareVersion: buffers.asciiAt({
        buffer,
        startRegister,

        register: 5130,
        length: 2,
      }),

      manufacturerName: buffers.asciiAt({
        buffer,
        startRegister,

        register: 5132,
        length: 10,
      }),
    };
  },
};
