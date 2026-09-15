import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
const configuredOrigins = new Set(
  (process.env.CORS_ORIGINS ?? process.env.PUBLIC_APP_URL ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);
const isMutation = (method: string) => ["POST", "PATCH", "PUT", "DELETE"].includes(method);
const isAllowedOrigin = (origin: string | undefined, host: string | undefined) => {
  if (!origin) return true;
  if (configuredOrigins.has(origin.replace(/\/$/, ""))) return true;
  try {
    return Boolean(host && new URL(origin).host === host);
  } catch {
    return false;
  }
};

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (isMutation(req.method) && !isAllowedOrigin(origin, req.get("host"))) {
    res.status(403).json({ error: "Cross-origin requests are not allowed." });
    return;
  }
  next();
});
app.use(cors({
  credentials: true,
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin, undefined)),
}));

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY,
);

if (clerkConfigured) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
}
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log?.error({ err: error }, "Unhandled API error");
  if (res.headersSent) return;
  const status = error instanceof SyntaxError ? 400 : 500;
  res.status(status).json({
    error: status === 400 ? "Invalid request body." : "An unexpected server error occurred.",
  });
};

app.use(errorHandler);

export default app;
