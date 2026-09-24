import { verifyToken } from '../config/jwt.js';

// Middleware que protege rotas: exige um token JWT valido no cabecalho
// Authorization no formato "Bearer <token>". Se valido, coloca os dados
// do usuario em req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ error: 'Autenticacao necessaria. Faca login.' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, displayName: payload.displayName };
    next();
  } catch {
    return res.status(401).json({ error: 'Sessao invalida ou expirada.' });
  }
}
