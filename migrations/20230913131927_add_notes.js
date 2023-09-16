export const up = function (knex) {
  return knex.schema.createTable("notes", function (table) {
    table.increments("id").primary();

    table.string("title", 255).notNullable();
    table.string("html", 20000).notNullable();
    table.boolean("is_archived").notNullable().defaultTo(false);
    table.integer("user_id").notNullable().unsigned();
    table.foreign("user_id").references("users.id").deferrable("deferred");

    table.timestamp("date").notNullable().defaultTo(knex.fn.now());

    table.unique(["title", "user_id"]);
    table.index(["user_id"]);
    table.index(["is_archived"]);
    table.index(["date"]);
  });
};

export const down = function (knex) {
  return knex.schema.dropTable("notes");
};
