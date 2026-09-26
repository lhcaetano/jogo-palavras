import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import WordDisplay from '../components/WordDisplay.jsx';
import Alphabet from '../components/Alphabet.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';
import Footer from '../components/Footer.jsx';

export default function Game() {
  const navigate = useNavigate();

  const [gameId, setGameId] = useState(null);
  const [alphabet, setAlphabet] = useState([]);
  const [word, setWord] = useState(null); // visao atual da palavra
  const [status, setStatus] = useState('loading'); // loading | playing | finished | error
  const [summary, setSummary] = useState(null);
  const [revealedWord, setRevealedWord] = useState(null);
  const [flash, setFlash] = useState(''); // mensagem rapida (acerto/erro)
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false); // pausa de acerto
  const [celebrateWord, setCelebrateWord] = useState(null); // palavra acertada

  // Inicia uma nova partida ao montar a tela.
  const startNew = useCallback(async () => {
    setStatus('loading');
    setSummary(null);
    setRevealedWord(null);
    setFlash('');
    setError('');
    setCelebrating(false);
    setCelebrateWord(null);
    try {
      const data = await api.startGame();
      setGameId(data.gameId);
      setAlphabet(data.alphabet);
      setWord(data.word);
      setStatus('playing');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    startNew();
  }, [startNew]);

  async function handlePick(letter) {
    if (busy || celebrating || status !== 'playing') return;
    setBusy(true);
    setFlash('');
    try {
      const res = await api.guessLetter(gameId, letter);

      // Acertou a palavra completa: mostra a palavra revelada com efeito
      // de comemoracao por ~2s antes de avancar (proxima palavra ou fim).
      if (res.result === 'correct') {
        setCelebrating(true);
        // Revela a palavra inteira na tela (mascara = a propria palavra).
        setCelebrateWord(res.solvedWord);
        setWord((w) => (w ? { ...w, mask: res.solvedWord } : w));
        setFlash(`Acertou a palavra "${res.solvedWord}". +10 pontos`);

        setTimeout(() => {
          setCelebrating(false);
          setCelebrateWord(null);
          setFlash('');
          if (res.status === 'finished') {
            if (res.revealedWord) setRevealedWord(res.revealedWord);
            setSummary(res.summary);
            setStatus('finished');
          } else if (res.word) {
            setWord(res.word);
          }
        }, 2000);
        return;
      }

      if (res.status === 'finished') {
        // Fim por game over (errou a ultima tentativa).
        if (res.revealedWord) setRevealedWord(res.revealedWord);
        setSummary(res.summary);
        setStatus('finished');
        return;
      }

      // Atualiza a visao da palavra.
      if (res.word) setWord(res.word);

      if (res.result === 'miss') {
        setFlash('Letra errada. -1 ponto');
      } else if (res.result === 'repeated') {
        setFlash('Você já tentou essa letra.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleQuit() {
    if (!gameId) {
      navigate('/');
      return;
    }
    const ok = window.confirm(
      'Encerrar a partida? Sua pontuação desta partida será perdida e não entrará no ranking.'
    );
    if (!ok) return;
    try {
      await api.quitGame(gameId);
    } catch {
      // mesmo se falhar, voltamos ao menu
    }
    navigate('/');
  }

  if (status === 'loading') {
    return <div className="container">Preparando o jogo...</div>;
  }

  if (status === 'error') {
    return (
      <div className="container">
        <div className="card">
          <p className="error">{error}</p>
          <button className="btn" onClick={startNew}>
            Tentar de novo
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Voltar ao menu
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela de fim de partida.
  if (status === 'finished' && summary) {
    const champion = summary.champion;
    return (
      <div className="container">
        <h1>{champion ? 'Campeão!' : 'Fim de jogo'}</h1>
        <div className={champion ? 'card champion-card' : 'card'}>
          {champion && (
            <div className="trophy" role="img" aria-label="Troféu de campeão">
              🏆
            </div>
          )}
          <p className={champion ? 'champion-message' : 'center'}>
            {summary.message}
          </p>
          {revealedWord && (
            <p className="muted">A palavra era: {revealedWord}</p>
          )}
          <div className="scoreboard" style={{ justifyContent: 'center', gap: 24 }}>
            <span>
              Pontuação final: <span className="points">{summary.points}</span>
            </span>
          </div>
          <p className="muted">
            Palavras acertadas: {summary.wordsGuessed} de {summary.wordsPlayed}{' '}
            jogadas
          </p>
          <button className="btn" onClick={startNew}>
            Jogar de novo
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/leaderboard')}
          >
            Ver ranking
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Voltar ao menu
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela de jogo em andamento.
  return (
    <div className="container">
      <div className="card">
        <ScoreBoard
          points={word.points}
          index={word.index}
          total={word.total}
          errorsLeft={word.errorsLeft}
          maxErrors={word.maxErrors}
        />
        <p className="hint">Dica: {word.hint}</p>

        <WordDisplay mask={word.mask} celebrating={celebrating} />

        <p className="flash">{flash || '\u00A0'}</p>

        <Alphabet
          alphabet={alphabet}
          guessedLetters={word.guessedLetters}
          wrongLetters={word.wrongLetters}
          onPick={handlePick}
          disabled={busy || celebrating}
        />

        <button className="btn btn-danger" onClick={handleQuit}>
          Encerrar partida
        </button>
      </div>
      <Footer />
    </div>
  );
}
