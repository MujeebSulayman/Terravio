import cors from "cors";
import express from "express";
import type { Env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { healthRoutes } from "./routes/health";
import { carbonOracleRoutes } from "./routes/carbonOracle";
import { propertyOracleRoutes } from "./routes/propertyOracle";
import { usersRoutes } from "./routes/users";
import { kycRoutes } from "./routes/kyc";
import { protocolRoutes } from "./routes/protocol";

export function createApp(env: Env) {
  const app = express();

  app.use(
    cors({
      origin:
        env.CORS_ORIGINS.length > 0
          ? env.CORS_ORIGINS
          : env.NODE_ENV === "development"
            ? true
            : false,
    })
  );

  app.use(express.json({ 
    limit: "2mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  app.use(healthRoutes());

  app.use("/api/carbon", carbonOracleRoutes(env));
  app.use("/api/property", propertyOracleRoutes(env));
  app.use("/api/users", usersRoutes(env));
  app.use("/", kycRoutes(env)); // Mount at root so internal routes can be /api/webhooks/didit
  app.use("/api/protocol", protocolRoutes(env));

  app.use(errorHandler);

  return app;
}
