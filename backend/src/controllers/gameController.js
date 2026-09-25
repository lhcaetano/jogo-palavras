import {
  startGame,
  guessLetter,
  quitGame,
  getGame,
  disposeGame,
} from '../services/gameEngine.js';
import { Score } from '../models/Score.js';

// POST /api/game/start
export function start(req, res) {
  const data = startGame(req.user);
  return res.status(201).json(data);
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
// Encerra a partida sem salvar (zera a pontuacao daquela partida).
export function quit(req, res) {
  const { gameId } = req.params;
  const outcome = quitGame(gameId, req.user);
  if (outcome.error) {
    return res.status(outcome.code || 400).json({ error: outcome.error });
  }
  return res.json({ ok: true, message: 'Partida encerrada. Pontuação não salva.' });
}
