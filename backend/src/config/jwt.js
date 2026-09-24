import jwt from 'jsonwebtoken';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Variavel de ambiente JWT_SECRET nao definida.');
  }
  return secret;
}

// Gera um token para o usuario, valido por 7 dias.
export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

// Verifica e decodifica um token. Lanca erro se invalido/expirado.
export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
