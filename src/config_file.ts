import { z } from "zod";

export const schema = z.object({
  http: z.object({
    port: z.number(),
  }),
  sources: z.array(
    z.object({
      enabled: z.optional(z.boolean()).default(true),
      type: z.literal("modbus_http"),

      baseUrl: z.optional(z.string()).default("http://localhost:21224"),
      modbusAddress: z.number(),

      overrides: z
        .optional(
          z.object({
            cellCount: z.optional(z.number()),
            serial: z.optional(z.string()),
          })
        )
        .default({}),
    })
  ),
});

export type Configuration = z.infer<typeof schema>;
