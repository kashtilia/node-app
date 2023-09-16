const PREFIX = "";

const req = (url, options = {}) => {
  const { body } = options;

  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        }),
  );
};

export const getNotes = ({ age, search, page } = {}) => req(`/note?age=${age}&search=${search}&page=${page}`);

export const createNote = (title, html) =>
  req(`/note`, {
    method: "POST",
    body: { title, html },
  }).then((res) => res.data);

export const getNote = (id) => req(`/note/${id}`).then((res) => res.data);

export const archiveNote = (id) => req(`/note/${id}/archive`);

export const unarchiveNote = (id) => req(`/note/${id}/unarchive`);

export const editNote = (id, title, html) =>
  req(`/note/${id}`, {
    method: "PUT",
    body: { title, html },
  });

export const deleteNote = (id) =>
  req(`/note/${id}`, {
    method: "DELETE",
  });

export const deleteAllArchived = () => req(`/note/delete-all-archived`);

export const notePdfUrl = (id) => `/note/${id}/pdf`;
