import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Nome de usuario usado no login. Guardamos em minusculas para
    // evitar duplicatas do tipo "Joao" e "joao".
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 30,
    },
    // Nome como o usuario digitou (para exibir no leaderboard).
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    // Hash da senha (nunca guardamos a senha em texto puro).
    passwordHash: {
      type: String,
      required: true,
    },
    // Historico de palavras JA ACERTADAS pelo jogador, por tema.
    // Chave = nome do tema (hint); valor = lista de palavras acertadas.
    // Palavras aqui nao sao mais sorteadas, ate o tema ser "reiniciado".
    wordHistory: {
      type: Map,
      of: [String],
      default: {},
    },
  },
  { timestamps: true }
);

// Metodo auxiliar para definir a senha (gera o hash).
userSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

// Metodo auxiliar para verificar a senha no login.
userSchema.methods.verifyPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
