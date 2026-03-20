const KEY = "suva_admin_auth";
const TOKEN_KEY = "suva_admin_token";
const USER_KEY = "suva_admin_user";

export function isAuthed() {
  return localStorage.getItem(KEY) === "true";
}

export function setAuthed(value) {
  localStorage.setItem(KEY, value ? "true" : "false");
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
}

export function getUserRole() {
  const user = getUser();
  return user?.role ?? null;
}

export function logout() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
