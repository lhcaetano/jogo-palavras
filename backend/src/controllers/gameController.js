import {
  startGame,
  guessLetter,
  quitGame,
  getGame,
  disposeGame,
  pullHistoryUpdate,
} from '../services/gameEngine.js';
import { Score } from '../models/Score.js';
import { User } from '../models/User.js';

// POST /api/game/start
export async function start(req, res) {
  try {
    // Carrega o historico de palavras ja acertadas pelo jogador.
    const user = await User.findById(req.user.id).lean();
    const history = (user && user.wordHistory) || {};
    const data = startGame(req.user, history);
    return res.status(201).json(data);
  } catch (err) {
    console.error('[game] Erro ao iniciar partida:', err.message);
    return res.status(500).json({ error: 'Erro ao iniciar a partida.' });
  }
}

// Persiste o historico de palavras do jogador no banco, se houve mudanca.
async function persistHistory(gameId, user) {
  const snapshot = pullHistoryUpdate(gameId, user);
  if (!snapshot) return;
  try {
    await User.findByIdAndUpdate(user.id, { wordHistory: snapshot });
  } catch (err) {
    console.error('[game] Erro ao salvar historico de palavras:', err.message);
  }
}

// Salva a pontuacao no banco quando a partida termina (naturalmente).
async function persistScoreIfFinished(game) {
  if (game.status !== 'finished' || !game.endReason) return;

  try {
    await Score.create({
      user: game.userId,
      displayName: game.displayName,
      points: game.points,
      wordsGuessed: game.wordsGuessed,
      // Denominador de "acertos": total de palavras da partida (ex.: 10),
      // mesmo em caso de game over antes do fim.
      wordsPlayed: game.words.length,
      endReason: game.endReason,
      playedAt: new Date(),
    });
  } catch (err) {
    console.error('[game] Erro ao salvar pontuacao:', err.message);
  }
}

// POST /api/game/:gameId/guess  { letter }
export async function guess(req, res) {
  const { gameId } = req.params;
  const { letter } = req.body || {};

  const outcome = guessLetter(gameId, req.user, letter);

  if (outcome.error) {
    return res.status(outcome.code || 400).json({ error: outcome.error });
  }

  // Persiste o historico imediatamente se o jogador acertou uma palavra
  // (a palavra e "bloqueada" assim que acerta, mesmo que a partida termine
  // depois em game over).
  await persistHistory(gameId, req.user);

  // Se a partida terminou, salva a pontuacao e limpa da memoria.
  if (outcome.status === 'finished') {
    const owned = getGame(gameId, req.user);
    if (owned.game) {
      await persistScoreIfFinished(owned.game);
      disposeGame(gameId);
    }
  }

  return res.json(outcome);
}

// POST /api/game/:gameId/quit
// Encerra a partida sem salvar a pontuacao (zera a pontuacao daquela partida).
// O historico de palavras ja acertadas NAO e desfeito (acertos ja foram
// persistidos no momento em que ocorreram).
export function quit(req, res) {
  const { gameId } = req.params;
  const outcome = quitGame(gameId, req.user);
  if (outcome.error) {
    return res.status(outcome.code || 400).json({ error: outcome.error });
  }
  return res.json({ ok: true, message: 'Partida encerrada. Pontuação não salva.' });
}
