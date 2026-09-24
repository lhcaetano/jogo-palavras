import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { start, guess, quit } from '../controllers/gameController.js';

const router = Router();

// Todas as rotas do jogo exigem usuario autenticado.
router.use(requireAuth);

router.post('/start', start);
router.post('/:gameId/guess', guess);
router.post('/:gameId/quit', quit);

export default router;
