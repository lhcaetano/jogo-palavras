import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login } from '../controllers/authController.js';

const router = Router();

// Limita tentativas de login/cadastro por IP para dificultar
// ataques de forca bruta (importante em ambiente publico).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // ate 20 tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;
