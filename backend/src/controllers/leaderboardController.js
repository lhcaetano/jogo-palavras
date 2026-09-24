import { Score } from '../models/Score.js';

// GET /api/leaderboard
// Retorna o ranking ordenado por pontuacao (maior primeiro).
// Em caso de empate, quem alcancou a pontuacao mais cedo aparece antes.
export async function getLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const scores = await Score.find()
      .sort({ points: -1, playedAt: 1 })
      .limit(limit)
      .lean();

    const ranking = scores.map((s, i) => ({
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
