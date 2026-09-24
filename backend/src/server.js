import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import leaderboardRoutes from './routes/leaderboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Atras do proxy do Render/plataformas, confia no cabecalho X-Forwarded-For
// para que o rate limit enxergue o IP real do cliente.
app.set('trust proxy', 1);

// CORS_ORIGIN pode conter varias URLs separadas por virgula.
// Ex.: "http://localhost:5173,https://meu-jogo.vercel.app"
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Middlewares globais.
app.use(
  cors({
    origin(origin, callback) {
      // Permite requisicoes sem Origin (ex.: curl, apps mobile) e as
      // origens explicitamente liberadas.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origem nao permitida pelo CORS: ${origin}`));
    },
  })
);
app.use(express.json());

// Rota de saude (util para checar se a API esta no ar).
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas da aplicacao.
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Rota nao encontrada.
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

// Tratador de erros geral.
app.use((err, req, res, _next) => {
  console.error('[server] Erro nao tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Sobe o servidor apos conectar ao banco.
async function bootstrap() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] API rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('[server] Falha ao iniciar:', err.message);
    process.exit(1);
  }
}

bootstrap();
