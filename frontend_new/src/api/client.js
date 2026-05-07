const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('wordle_token')
  const opts = { ...options }
  opts.headers = { ...opts.headers }
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${API}${url}`, opts)
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

export async function createGame(language) {
  const res = await apiFetch('/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })
  if (!res.ok) throw new Error('Erreur création partie')
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
}

export function isLoggedIn() {
  return !!localStorage.getItem('wordle_token')
}
