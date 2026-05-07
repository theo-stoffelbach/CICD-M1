const DEFAULT_API =
  typeof window === 'undefined'
    ? 'http://127.0.0.1:8000'
    : `${window.location.protocol}//${window.location.hostname}:8000`

const API = import.meta.env.VITE_API_URL || DEFAULT_API

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('wordle_token')
  const opts = { ...options }
  opts.headers = { ...opts.headers }
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${API}${url}`, opts)
}

async function readError(res, fallback) {
  try {
    const data = await res.json()
    return data.detail || fallback
  } catch {
    return fallback
  }
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Erreur de connexion')
  localStorage.setItem('wordle_token', data.access_token)
  return data
}

export async function register(username, email, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || "Erreur d'inscription")
  // auto-login
  await login(email, password)
  return data
}

export async function getMe() {
  const res = await apiFetch('/users/me')
  if (!res.ok) throw new Error('Session invalide')
  return res.json()
}

export async function getHistory() {
  const res = await apiFetch('/users/me/history')
  if (!res.ok) throw new Error('Erreur historique')
  return res.json()
}

export async function getLeaderboard() {
  const res = await apiFetch('/users/leaderboard')
  if (!res.ok) throw new Error('Erreur classement')
  return res.json()
}

export async function getLeaderboards() {
  const res = await apiFetch('/users/leaderboards')
  if (!res.ok) throw new Error('Erreur classements')
  return res.json()
}

export async function createGame(language) {
  const res = await apiFetch('/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Erreur création partie'))
  return res.json()
}

export async function createDailyGame(language) {
  const res = await apiFetch('/game/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Erreur défi du jour'))
  return res.json()
}

export async function submitGuess(gameId, word) {
  const res = await apiFetch(`/game/${gameId}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Erreur')
  }
  return res.json()
}

export async function getGameState(gameId) {
  const res = await apiFetch(`/game/${gameId}`)
  if (!res.ok) throw new Error('Partie introuvable')
  return res.json()
}

export function logout() {
  localStorage.removeItem('wordle_token')
  localStorage.removeItem('wordle_user')
  localStorage.removeItem('wordle_game_id')
  localStorage.removeItem('wordle_language')
  localStorage.removeItem('wordle_game_mode')
  localStorage.removeItem('wordle_daily_date')
}

export function isLoggedIn() {
  return !!localStorage.getItem('wordle_token')
}
