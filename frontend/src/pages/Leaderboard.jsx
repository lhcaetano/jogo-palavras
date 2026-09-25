import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Footer from '../components/Footer.jsx';

// Formata a data/hora para exibicao (dia e hora).
function formatDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getLeaderboard();
        setRanking(data.ranking || []);
        setStatus('ready');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    })();
  }, []);

  return (
    <div className="container">
      <h1>Ranking</h1>
      <p className="obs">Obs.: apenas o melhor resultado de cada jogador é exibido.</p>
      <div className="card">
        {status === 'loading' && <p className="muted">Carregando ranking...</p>}
        {status === 'error' && <p className="error">{error}</p>}

        {status === 'ready' && ranking.length === 0 && (
          <p className="muted">
            Ainda não há partidas registradas. Seja o primeiro a jogar!
          </p>
        )}

        {status === 'ready' && ranking.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jogador</th>
                  <th>Pontos</th>
                  <th>Acertos</th>
                  <th>Tentativas</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={`${r.rank}-${r.displayName}-${r.playedAt}`}>
                    <td>{r.rank}</td>
                    <td>{r.displayName}</td>
                    <td>{r.points}</td>
                    <td>
                      {r.wordsGuessed}/{r.wordsPlayed}
                    </td>
                    <td>{r.attempts}</td>
                    <td>{formatDateTime(r.playedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/')}
        >
          Voltar
        </button>
      </div>
      <Footer />
    </div>
  );
}
