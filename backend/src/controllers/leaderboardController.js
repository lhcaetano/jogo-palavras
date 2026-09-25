import { Score } from '../models/Score.js';

// GET /api/leaderboard
// Retorna o ranking com APENAS a melhor partida de cada jogador.
// Ordenado por pontuacao (maior primeiro). Em caso de empate,
// quem alcancou a pontuacao mais cedo aparece antes.
export async function getLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    // Agregacao:
    // 1. Ordena todas as partidas pela melhor pontuacao (e mais antiga em empate),
    //    para que o $first de cada grupo seja a melhor partida do jogador.
    // 2. Agrupa por usuario (melhor partida + total de tentativas).
    // 3. Ordena o ranking final por:
    //    - pontos (maior primeiro)
    //    - tentativas (menor primeiro): mesmo placar com menos partidas fica na frente
    //    - data de registro (mais antiga primeiro): quem alcancou primeiro
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
          // Numero de partidas que o jogador ja finalizou.
          attempts: { $sum: 1 },
        },
      },
      { $sort: { points: -1, attempts: 1, playedAt: 1 } },
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
      attempts: s.attempts,
    }));

    return res.json({ ranking });
  } catch (err) {
    console.error('[leaderboard] Erro ao carregar ranking:', err.message);
    return res.status(500).json({ error: 'Erro ao carregar o ranking.' });
  }
}
