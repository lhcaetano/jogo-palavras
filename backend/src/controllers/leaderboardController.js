import { Score } from '../models/Score.js';

// GET /api/leaderboard
// Retorna o ranking com APENAS a melhor partida de cada jogador.
// Ordenado por pontuacao (maior primeiro). Em caso de empate,
// quem alcancou a pontuacao mais cedo aparece antes.
export async function getLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    // Agregacao:
    // 1. Ordena todas as partidas pela melhor pontuacao (e mais antiga em empate).
    // 2. Agrupa por usuario, mantendo a primeira (= melhor) partida de cada um.
    // 3. Reordena o resultado e limita.
    const best = await Score.aggregate([
      { $sort: { points: -1, playedAt: 1 } },
      {
        $group: {
          _id: '$user',
          displayName: { $first: '$displayName' },
          points: { $first: '$points' },
          wordsGuessed: { $first: '$wordsGuessed' },
          wordsPlayed: { $first: '$wordsPlayed' },
          endReason: { $first: '$endReason' },
          playedAt: { $first: '$playedAt' },
        },
      },
      { $sort: { points: -1, playedAt: 1 } },
      { $limit: limit },
    ]);

    const ranking = best.map((s, i) => ({
      rank: i + 1,
      displayName: s.displayName,
      points: s.points,
      wordsGuessed: s.wordsGuessed,
      wordsPlayed: s.wordsPlayed,
      endReason: s.endReason,
      playedAt: s.playedAt,
    }));

    return res.json({ ranking });
  } catch (err) {
    console.error('[leaderboard] Erro ao carregar ranking:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
}
