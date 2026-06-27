import { authStorage } from './utils/authStorage'

const API_BASE = ''

function getToken() {
  return authStorage.get('token')
}

async function request(url, options = {}) {
  const headers = { ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(API_BASE + url, { ...options, headers })
  if (res.status === 401) {
    authStorage.remove('token')
    window.location.href = '/login'
    throw new Error('未登录')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '请求失败')
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getConfig: () => request('/api/config/couple'),

  getWhispers: (page = 0, size = 8) =>
    request(`/api/whispers?page=${page}&size=${size}`),

  postWhisper: (content) =>
    request('/api/whispers', { method: 'POST', body: JSON.stringify({ content }) }),

  deleteWhisper: (id) =>
    request(`/api/whispers/${id}`, { method: 'DELETE' }),

  getDiaries: (page = 0, size = 10) =>
    request(`/api/diaries?page=${page}&size=${size}`),

  postDiary: (content, mood) =>
    request('/api/diaries', { method: 'POST', body: JSON.stringify({ content, mood }) }),

  uploadDiaryPhoto: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(`/api/diaries/${id}/photo`, { method: 'POST', body: form })
  },

  uploadDiaryPhotos: (id, files) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return request(`/api/diaries/${id}/photos`, { method: 'POST', body: form })
  },

  getDiaryStats: () => request('/api/diaries/stats'),

  getPresence: () => request('/api/presence'),

  presenceHeartbeat: () => request('/api/presence/heartbeat', { method: 'POST' }),

  inviteGomoku: () => request('/api/games/gomoku/invite', { method: 'POST' }),

  getPendingGomokuInvites: () => request('/api/games/gomoku/pending'),

  getCurrentGomoku: () => request('/api/games/gomoku/current'),

  getGomoku: (id) => request(`/api/games/gomoku/${id}`),

  acceptGomoku: (id) => request(`/api/games/gomoku/${id}/accept`, { method: 'POST' }),

  declineGomoku: (id) => request(`/api/games/gomoku/${id}/decline`, { method: 'POST' }),

  moveGomoku: (id, x, y) =>
    request(`/api/games/gomoku/${id}/move`, { method: 'POST', body: JSON.stringify({ x, y }) }),

  resignGomoku: (id) => request(`/api/games/gomoku/${id}/resign`, { method: 'POST' }),

  saveGameScore: (gameType, score, extraData) =>
    request('/api/games/score', {
      method: 'POST',
      body: JSON.stringify({ gameType, score, extraData }),
    }),

  getGameScores: () => request('/api/games/scores'),

  getCompatibility: () => request('/api/games/compatibility'),

  createQuiz: (question, options, correctIndex) =>
    request('/api/games/quiz', {
      method: 'POST',
      body: JSON.stringify({ question, options, correctIndex }),
    }),

  getPendingQuiz: () => request('/api/games/quiz/pending'),

  getMyQuiz: () => request('/api/games/quiz/mine'),

  getQuizReport: () => request('/api/games/quiz/report'),

  answerQuiz: (id, answerIndex) =>
    request(`/api/games/quiz/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answerIndex }),
    }),

  recordLocation: (lat, lng, placeName) =>
    request('/api/distance/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, placeName }),
    }),

  getLocations: () => request('/api/distance/locations'),

  getDistance: () => request('/api/distance/between'),
}
