import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "./api_database.js";
import express from "express";
import fs from "fs";
import { __rootPath } from "./server.js";

export const router = express.Router();

// Сгенерировать хэш пароля
export const getHash = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Сгенерировать секретный ключ
const generateSecretKey = () => crypto.randomBytes(32).toString("hex");

// Секретный ключ
const secretKey = generateSecretKey();

// Сгенерировать токен
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    secretKey,
    { expiresIn: "10m" },
  );
};

// Верифицировать токен
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
};

// Middleware аутентификации
export const authMW = () => async (req, res, next) => {
  const token = await req.cookies["auth_token"];
  const blackListToken = token ? await db.findBlacklistToken(token) : true;
  const user = verifyToken(token);

  if (!token || blackListToken || !user) {
    return res.status(302).redirect("/login?error=unauthorized");
  }

  req.user = user;
  req.token = token;
  next();
};

const authErrors = {
  unauthorized: "Пользователь не авторизован",
  already_exists: "Пользователь с таким логином уже существует",
  signup_failed: "Ошибка при создании пользователя",
  incorrect: "Некорректный логин или пароль",
};

router.get("/login", (req, res) => {
  if (req.token) {
    return res.redirect("/");
  }

  const authError = req.query.error ? authErrors[req.query.error] : null;
  return res.render("index", { authError });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUserByUsername(username);

  if (!user || user.password !== getHash(password)) {
    return res.status(302).redirect("/login?error=incorrect");
  }

  const token = generateToken(user);
  res.cookie("auth_token", token);
  return res.redirect("/");
});

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUserByUsername(username);

  if (user || !username || !password) {
    return res.status(302).redirect("/login?error=already_exists");
  }

  const userId = await db.createUser({
    username,
    password: getHash(password),
  });

  const newUser = await db.findUserById(userId);

  if (!newUser) {
    return res.status(302).redirect("/login?error=signup_failed");
  }

  const demoNote = {
    title: "Demo",
    html: fs.readFileSync(`${__rootPath}/files/demo.html`, "utf8"),
    user_id: userId,
  };
  await db.createNote(demoNote);

  const token = generateToken(newUser);
  res.cookie("auth_token", token);
  return res.redirect("/");
});

router.get("/logout", async (req, res) => {
  if (req.user) {
    await db.addTokenToBlackList(req.token);
  }
  res.clearCookie("auth_token");
  res.clearCookie("user");

  return res.status(302).redirect("/login");
});
