import express, { type Express } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "path";
import { createReadStream, existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(compression());

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
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((o) => origin === o) ||
        /^https?:\/\/[^/]+\.replit\.dev(:\d+)?$/.test(origin) ||
        /^https?:\/\/[^/]+\.repl\.co(:\d+)?$/.test(origin) ||
        /^https?:\/\/[^/]+\.railway\.app$/.test(origin) ||
        /^https?:\/\/[^/]+\.up\.railway\.app$/.test(origin) ||
        origin === "https://wawkids.store" ||
        origin === "https://www.wawkids.store" ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.join(process.cwd(), "frontend", "dist", "public");
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get("/{*path}", (_req, res) => {
      const indexPath = path.join(staticDir, "index.html");
      if (existsSync(indexPath)) {
        createReadStream(indexPath).pipe(res);
      } else {
        res.status(404).send("Not found");
      }
    });
  }
}

export default app;
