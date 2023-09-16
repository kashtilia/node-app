import knexConfig from "../knexfile.js";
import knexFn from "knex";

const knex = knexFn(knexConfig);

// Выполнить запрос в БД
export const execQuery = async (queryFn) => {
  try {
    return await queryFn();
  } catch (err) {
    console.error(err);
  }
};

export const db = {
  // АВТОРИЗАЦИЯ
  // Найти пользователя по логину
  findUserByUsername: (username) => execQuery(() => knex("users").where({ username }).first()),
  // Найти пользователя по ID
  findUserById: (id) => execQuery(() => knex.table("users").where({ id }).first()),
  // Создать пользователя
  createUser: (user) =>
    execQuery(() =>
      knex
        .table("users")
        .insert(user)
        .returning("id")
        .then((result) => result[0].id),
    ),
  // Найти токен в черном списке
  findBlacklistToken: (token) => execQuery(() => knex.table("token_blacklist").where({ token }).first()),
  // Добавить токен в черный список
  addTokenToBlackList: (token) => execQuery(() => knex.table("token_blacklist").insert({ token })),
  // ЗАМЕТКИ
  // Найти все заметки по фильтрам
  findNotes: (filter, user_id) =>
    execQuery(() =>
      knex
        .table("notes")
        .where((builder) => {
          switch (filter.age) {
            case "1month":
            case "3months":
              builder.where("date", ">=", knex.raw(`NOW() - INTERVAL '${filter.age}'`));
              break;
            case "archive":
              builder.where({ is_archived: true });
              break;
            default:
              break;
          }

          if (filter.search) {
            builder.where("title", "ILIKE", `%${filter.search}%`);
          }
          builder.where(user_id ? { user_id } : {});
        })
        .limit(filter.limit)
        .offset(filter.page ? (filter.page - 1) * filter.limit : 0)
        .orderBy("date", "desc"),
    ),
  // Создать заметку
  createNote: (note) => execQuery(() => knex.table("notes").returning("*").insert(note)),
  // Обновить заметку
  updateNote: (note, id) => execQuery(() => knex.table("notes").where({ id }).update(note)),
  // Удалить заметку
  deleteNote: (id, user_id) => execQuery(() => knex.table("notes").where({ id, user_id }).del()),
  // Найти заметку по ID
  findNoteById: (id, user_id) => execQuery(() => knex.table("notes").where({ id, user_id }).first()),
  // Архивировать заметку
  archiveNote: (id, user_id) =>
    execQuery(() => knex.table("notes").where({ id, user_id }).update({ is_archived: true })),
  // Разархивировать заметку
  unarchiveNote: (id, user_id) =>
    execQuery(() => knex.table("notes").where({ id, user_id }).update({ is_archived: false })),
  // Удалить все заархивированные заметки
  deleteAllArchivedNotes: (user_id) => execQuery(() => knex.table("notes").where({ is_archived: true, user_id }).del()),
};
