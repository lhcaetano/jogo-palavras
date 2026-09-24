// Camada de comunicacao com a API do backend.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Le o token salvo no navegador.
function getToken() {
  return localStorage.getItem('token');
}

// Faz uma requisicao JSON, anexando o token quando existir.
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // resposta sem corpo JSON
  }

  if (!res.ok) {
    const message = (data && data.error) || 'Erro na requisicao.';
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Autenticacao
  register: (username, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: { username, password },
    }),
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  // Jogo
  startGame: () => request('/api/game/start', { method: 'POST', auth: true }),
  guessLetter: (gameId, letter) =>
    request(`/api/game/${gameId}/guess`, {
      method: 'POST',
      body: { letter },
      auth: true,
    }),
  quitGame: (gameId) =>
    request(`/api/game/${gameId}/quit`, { method: 'POST', auth: true }),

  // Leaderboard
  getLeaderboard: () => request('/api/leaderboard'),
};
