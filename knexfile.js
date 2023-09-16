import dotenv from "dotenv";
dotenv.config();

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

export default {
  client: "pg",
  connection: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?sslmode=require`,
  migrations: {
    tableName: "migrations",
  },
};
