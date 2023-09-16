import express from "express";
import compression from "compression";
import helmet from "helmet";
import { authMW, router as routerAuth } from "./api/api_auth.js";
import { router as routerNote } from "./api/api_note.js";
import crypto from "crypto";
import nunjucks from "nunjucks";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const __filePath = fileURLToPath(import.meta.url);
export const __rootPath = dirname(__filePath);

const app = express();

const generateNonce = () => crypto.randomBytes(16).toString("base64");
const nonce = generateNonce();

nunjucks.configure(`${__rootPath}/views`, {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");
app.set("views", `${__rootPath}/views`);
app.use("/", express.static(`${__rootPath}/public`));
app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    `script-src 'self' 'nonce-${nonce}'; script-src-elem 'self' https://vercel.live 'nonce-${nonce}';`,
  );
  next();
});

app.use((req, res, next) => {
  if (["/login", "/signup"].includes(req.path)) {
    return next();
  }
  authMW()(req, res, next);
});

app.get("/", authMW(), (req, res) => {
  res.render("dashboard", {
    username: req.user.username,
  });
});

app.get("/dashboard", (req, res) => {
  return res.status(302).redirect("/");
});

app.use("/", routerAuth);
app.use("/", routerNote);

app.use("*", (req, res) => {
  if (req.token) {
    return res.status(404).render("404");
  }

  return res.status(302).redirect("/login?error=unauthorized");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
