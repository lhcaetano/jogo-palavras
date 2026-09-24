import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/Footer.jsx';

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Jogo de Adivinhar Palavras</h1>
      <div className="card">
        <p className="center">
          Olá, <strong>{user?.displayName}</strong>! O que vamos fazer?
        </p>
        <button className="btn" onClick={() => navigate('/jogar')}>
          Jogar
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/leaderboard')}
        >
          Ver ranking
        </button>
        <button className="btn btn-secondary" onClick={logout}>
          Sair
        </button>
      </div>

      <div className="card">
        <h2>Como jogar</h2>
        <p className="muted">
          São 10 palavras. Cada uma vem com uma dica de tema. Escolha uma letra
          por vez: acertar a palavra vale +10 pontos, cada letra errada vale -1.
          Você tem 5 erros por palavra. Se errar todos, o jogo acaba. Boa sorte!
        </p>
      </div>
      <Footer />
    </div>
  );
}
