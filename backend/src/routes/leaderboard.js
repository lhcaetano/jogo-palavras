import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();

// Ranking publico (nao exige login para visualizar).
router.get('/', getLeaderboard);

export default router;
