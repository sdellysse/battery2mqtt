import createExpress from "express";
import bodyParser from "body-parser";

type OptionsListen = {
  port: number;
};
export const listen = async ({ port }: OptionsListen) => {
  const express = createExpress();
  express.use(bodyParser.json());

  await new Promise<void>((resolve) =>
    express.listen(port, () => {
      resolve();
    })
  );

  return express;
};
