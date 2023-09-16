import { db } from "./api_database.js";
import express from "express";
import htmlToPdf from "html-pdf";
import fs from "fs";
import { __rootPath } from "./server.js";
export const router = express.Router();

router.get(`/note/delete-all-archived`, async (req, res) => {
  await db.deleteAllArchivedNotes(req.user.id);
  return res.json({});
});

router.get("/note", async (req, res) => {
  const filter = { ...req.query, limit: 20 };
  const notes = await db.findNotes(filter, req.user.id);

  if (filter.search) {
    const regex = new RegExp(filter.search, "gi");
    notes.forEach((note) => {
      note.title = note.title.replace(regex, `<mark>$&</mark>`);
    });
  }

  return res.json({ data: notes });
});

router.get("/note/:id", async (req, res) => {
  const note = await db.findNoteById(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({});
  }

  return res.json({ data: note });
});

router.post("/note", async (req, res) => {
  if (!req.body) {
    return res.status(403).json({});
  }

  const note = { ...req.body, user_id: req.user.id };
  const newNote = await db.createNote(note);

  return res.json({ data: newNote[0] });
});

router.put("/note/:id", async (req, res) => {
  if (!req.body) {
    return res.status(403).json({});
  }

  const id = req.params.id;
  const note = req.body;
  const newNote = await db.updateNote(note, id);

  return res.json({ data: newNote });
});

router.delete("/note/:id", async (req, res) => {
  await db.deleteNote(req.params.id, req.user.id);
  return res.json({});
});

router.get("/note/:id/archive", async (req, res) => {
  const note = await db.archiveNote(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({});
  }

  return res.json({ data: note });
});

router.get("/note/:id/unarchive", async (req, res) => {
  const note = await db.unarchiveNote(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({});
  }

  return res.json({ data: note });
});

router.get(`/note/:id/pdf`, async (req, res) => {
  const note = await db.findNoteById(req.params.id, req.user.id);
  if (!note) {
    return res.status(404).json({});
  }

  const filename = `${__rootPath}/${new Date().toLocaleDateString("ru-RU")}_${note.title}_Note.pdf`;
  const content = `<h1 style="text-align: center">${note.title}</h1><br>${note.html}`;

  htmlToPdf.create(content).toFile(filename, (err) => {
    if (err) {
      return res.status(500).send("Ошибка при создании PDF");
    }

    return res.download(filename, filename, (err) => {
      if (err) {
        return res.status(500).send("Ошибка при скачивании PDF");
      }

      fs.unlinkSync(filename);
    });
  });
});
