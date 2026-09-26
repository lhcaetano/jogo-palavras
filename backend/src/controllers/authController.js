import { User } from '../models/User.js';
import { signToken } from '../config/jwt.js';

// POST /api/auth/register
// Cria um novo usuario com nome + senha.
export async function register(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Informe nome e senha.' });
    }
    if (String(username).trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'O nome deve ter pelo menos 2 caracteres.' });
    }
    if (String(password).length < 4) {
      return res
        .status(400)
        .json({ error: 'A senha deve ter pelo menos 4 caracteres.' });
    }

    const displayName = String(username).trim();
    const normalized = displayName.toLowerCase();

    const exists = await User.findOne({ username: normalized });
    if (exists) {
      return res.status(409).json({ error: 'Esse nome já está em uso.' });
    }

    const user = new User({ username: normalized, displayName });
    await user.setPassword(String(password));
    await user.save();

    const token = signToken({ sub: user.id, displayName: user.displayName });
    return res.status(201).json({
      token,
      user: { id: user.id, displayName: user.displayName },
    });
  } catch (err) {
    // Caso raro de corrida: dois cadastros simultaneos com o mesmo nome.
    // O indice unico do MongoDB barra o segundo (codigo 11000).
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Esse nome já está em uso.' });
    }
    console.error('[auth] Erro no cadastro:', err.message);
    return res.status(500).json({ error: 'Erro ao cadastrar.' });
  }
}

// POST /api/auth/login
// Autentica com nome + senha e devolve um token.
export async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Informe nome e senha.' });
    }

    const normalized = String(username).trim().toLowerCase();
    const user = await User.findOne({ username: normalized });
    if (!user) {
      return res.status(401).json({ error: 'Nome ou senha incorretos.' });
    }

    const ok = await user.verifyPassword(String(password));
    if (!ok) {
      return res.status(401).json({ error: 'Nome ou senha incorretos.' });
    }

    const token = signToken({ sub: user.id, displayName: user.displayName });
    return res.json({
      token,
      user: { id: user.id, displayName: user.displayName },
    });
  } catch (err) {
    console.error('[auth] Erro no login:', err.message);
    return res.status(500).json({ error: 'Erro ao fazer login.' });
  }
}
