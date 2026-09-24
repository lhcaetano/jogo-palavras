import mongoose from 'mongoose';

// Registro de uma partida finalizada (para o leaderboard).
const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Nome exibido no ranking (copiado do usuario no momento da partida).
    displayName: {
      type: String,
      required: true,
    },
    // Pontuacao final (pode ser negativa).
    points: {
      type: Number,
      required: true,
    },
    // Estatisticas da partida.
    wordsGuessed: {
      type: Number,
      default: 0,
    },
    wordsPlayed: {
      type: Number,
      default: 0,
    },
    // Como a partida terminou: 'completed' (10 palavras) ou 'gameover' (5 erros).
    endReason: {
      type: String,
      enum: ['completed', 'gameover'],
      required: true,
    },
    // Data/hora do fim da partida (usado para exibir dia e hora no ranking).
    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indice para ordenar o ranking por pontuacao rapidamente.
scoreSchema.index({ points: -1, playedAt: 1 });

export const Score = mongoose.model('Score', scoreSchema);
