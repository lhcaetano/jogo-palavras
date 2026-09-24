import mongoose from 'mongoose';

// Conecta ao MongoDB usando a URI definida no ambiente (docker-compose).
// Faz algumas tentativas antes de desistir, porque o container do banco
// pode demorar um pouco a mais para aceitar conexoes.
export async function connectDB(retries = 5, delayMs = 3000) {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Variavel de ambiente MONGO_URI nao definida.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log('[db] Conectado ao MongoDB.');
      return;
    } catch (err) {
      console.error(
        `[db] Falha ao conectar (tentativa ${attempt}/${retries}): ${err.message}`
      );
      if (attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
