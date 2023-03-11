import { z } from "zod";
import winston from "winston";
import * as configFile from "./config_file";
import * as sourceModbusHttp from "./source_modbus_http";
import * as queries from "./queries";
import * as http from "./http";
import fs from "fs/promises";

type OptionsDefaultExport = {
  logger: winston.Logger;
  config: configFile.Configuration;
};
const defaultExport = async ({ logger, config }: OptionsDefaultExport) => {
  type Source = {
    config: (typeof config)["sources"][0];
    limits: ReturnType<typeof queries.limits.parse>;
    properties: ReturnType<typeof queries.properties.parse>;
  };
  const sources: Array<Source> = [];
  for (const source of config.sources) {
    if (source.type === "modbus_http") {
      const limits = queries.limits.parse({
        logger,
        buffer: await sourceModbusHttp.readRegister(
          source.baseUrl,
          source.modbusAddress,
          queries.limits.register,
          queries.limits.length
        ),
        overrides: source.overrides,
      });

      const properties = queries.properties.parse({
        logger,
        buffer: await sourceModbusHttp.readRegister(
          source.baseUrl,
          source.modbusAddress,
          queries.properties.register,
          queries.properties.length
        ),
        overrides: source.overrides,
      });

      sources.push({
        config: source,
        limits,
        properties,
      });

      continue;
    }

    const exhaustivenessCheck: never = source.type;
    throw new Error(`Inexhaustive sources: ${exhaustivenessCheck}`);
  }

  const httpServer = await http.listen({ port: config.http.port });

  httpServer.get("/batteries", (_req, res) => {
    res.status(200);
    res.json({
      batteries: sources.map((source) => ({
        info: {
          ...source.limits,
          ...source.properties,
        },
        config: source.config,
      })),
    });
    res.end();
  });

  httpServer.get("/batteries/:serial", async (req, res) => {
    const paramsSchema = z.object({
      serial: z.string(),
    });
    const params = paramsSchema.parse(req.params);

    const source = sources.find(
      (source) => source.properties.serial === params.serial
    );
    if (source === undefined) {
      res.status(404);
      res.end();
      return;
    }

    const cellTemperaturesAndVoltages =
      queries.cellTemperaturesAndVoltages.parse({
        logger,
        buffer: await sourceModbusHttp.readRegister(
          source.config.baseUrl,
          source.config.modbusAddress,
          queries.cellTemperaturesAndVoltages.register,
          queries.cellTemperaturesAndVoltages.length
        ),
        overrides: source.config.overrides,
      });

    const counts = queries.counts.parse({
      logger,
      buffer: await sourceModbusHttp.readRegister(
        source.config.baseUrl,
        source.config.modbusAddress,
        queries.counts.register,
        queries.counts.length
      ),
      overrides: source.config.overrides,
    });

    const status = queries.status.parse({
      logger,
      buffer: await sourceModbusHttp.readRegister(
        source.config.baseUrl,
        source.config.modbusAddress,
        queries.status.register,
        queries.status.length
      ),
      overrides: source.config.overrides,
    });

    const outval = {
      info: {
        ...source.limits,
        ...source.properties,
      },
      readings: {
        ...cellTemperaturesAndVoltages,
        ...counts,
        ...status,
      },
      config: source.config,
    };

    res.status(200);
    res.json(outval);
    res.end();
  });
};
export default defaultExport;

if (require.main === module) {
  (async () => {
    const envSchema = z.object({
      LOGLEVEL: z.string().default("info"),
      CONFIG: z.string(),
    });
    const env = envSchema.parse(process.env);

    const logger = winston.createLogger({
      level: env.LOGLEVEL,
      format: winston.format.simple(),
      transports: [new winston.transports.Console()],
    });
    logger.debug("env", env);

    const config = configFile.schema.parse(
      JSON.parse(await fs.readFile(env.CONFIG, { encoding: "utf-8" }))
    );
    logger.debug("config", config);

    await defaultExport({
      config,
      logger,
    });
  })().catch((error) => {
    console.log(error);
    console.log(JSON.stringify(error, undefined, 4));
    process.exit(1);
  });
}
