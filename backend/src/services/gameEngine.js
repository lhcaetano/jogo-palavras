import crypto from 'crypto';
import { THEMES } from '../data/words.js';

// ============================================================
// Motor do jogo (regras no servidor).
//
// As partidas ficam guardadas em memoria, indexadas por um id de
// sessao de jogo. A palavra secreta NUNCA e enviada inteira ao
// frontend enquanto a palavra esta em andamento - o cliente recebe
// apenas a mascara (ex.: "_ O _ _ _") e as letras ja tentadas.
// ============================================================

// Configuracoes das regras.
const TOTAL_WORDS = 10; // palavras por partida
const MAX_ERRORS = 5; // erros permitidos por palavra
const POINTS_PER_WORD = 10; // pontos por palavra acertada
const PENALTY_PER_ERROR = 1; // pontos perdidos por letra errada

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Armazenamento em memoria das partidas ativas.
// Chave: gameId. Valor: objeto de estado da partida.
const games = new Map();

// Sorteia n palavras sem repetir, cada uma com sua dica (tema).
function drawWords(n) {
  // Monta a lista completa de {hint, word}, evitando palavras duplicadas
  // (ex.: PORTA aparece em mais de um tema).
  const pool = [];
  const seen = new Set();
  for (const theme of THEMES) {
    for (const word of theme.words) {
      if (!seen.has(word)) {
        seen.add(word);
        pool.push({ hint: theme.hint, word });
      }
    }
  }

  // Embaralha (Fisher-Yates) e pega as n primeiras.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(n, pool.length));
}

// Monta a mascara da palavra revelando apenas as letras ja acertadas.
function buildMask(word, guessedLetters) {
  return word
    .split('')
    .map((ch) => (guessedLetters.has(ch) ? ch : '_'))
    .join('');
}

// Monta a "foto" segura da palavra atual para enviar ao frontend.
function currentWordView(game) {
  const round = game.rounds[game.currentIndex];
  return {
    index: game.currentIndex,
    total: game.words.length,
    hint: round.hint,
    length: round.word.length,
    mask: buildMask(round.word, round.guessedLetters),
    guessedLetters: Array.from(round.guessedLetters).sort(),
    wrongLetters: Array.from(round.wrongLetters).sort(),
    errorsLeft: MAX_ERRORS - round.wrongLetters.size,
    maxErrors: MAX_ERRORS,
    points: game.points,
  };
}

// Inicia uma nova partida para um usuario.
export function startGame(user) {
  const drawn = drawWords(TOTAL_WORDS);

  const gameId = crypto.randomUUID();
  const game = {
    id: gameId,
    userId: user.id,
    displayName: user.displayName,
    words: drawn,
    rounds: drawn.map((d) => ({
      hint: d.hint,
      word: d.word,
      guessedLetters: new Set(), // letras corretas ja reveladas
      wrongLetters: new Set(), // letras erradas ja tentadas
      solved: false,
    })),
    currentIndex: 0,
    points: 0,
    wordsGuessed: 0,
    status: 'playing', // 'playing' | 'finished'
    endReason: null, // 'completed' | 'gameover'
    createdAt: Date.now(),
  };

  games.set(gameId, game);

  return {
    gameId,
    alphabet: ALPHABET,
    word: currentWordView(game),
    status: game.status,
  };
}

// Recupera uma partida garantindo que pertence ao usuario.
function getOwnedGame(gameId, user) {
  const game = games.get(gameId);
  if (!game) return { error: 'Partida nao encontrada.', code: 404 };
  if (game.userId !== user.id) {
    return { error: 'Essa partida nao e sua.', code: 403 };
  }
  return { game };
}

// Monta o resumo final da partida (estatisticas + mensagem).
function buildSummary(game) {
  const allGuessed = game.wordsGuessed === game.words.length;
  let message;

  if (game.endReason === 'completed') {
    if (allGuessed) {
      message = `Incrivel, ${game.displayName}! Voce acertou todas as ${game.words.length} palavras!`;
    } else {
      message = `Parabens, ${game.displayName}! Voce completou o jogo com ${game.wordsGuessed} de ${game.words.length} palavras.`;
    }
  } else {
    message = `Fim de jogo, ${game.displayName}! Voce acertou ${game.wordsGuessed} palavra(s) antes de esgotar as tentativas. Nao desista, tente de novo!`;
  }

  return {
    points: game.points,
    wordsGuessed: game.wordsGuessed,
    wordsPlayed:
      game.endReason === 'completed' ? game.words.length : game.currentIndex + 1,
    endReason: game.endReason,
    message,
  };
}

// Processa o chute de uma letra.
export function guessLetter(gameId, user, rawLetter) {
  const owned = getOwnedGame(gameId, user);
  if (owned.error) return owned;
  const game = owned.game;

  if (game.status !== 'playing') {
    return { error: 'Essa partida ja terminou.', code: 400 };
  }

  const letter = String(rawLetter || '').toUpperCase().trim();
  if (letter.length !== 1 || !ALPHABET.includes(letter)) {
    return { error: 'Escolha uma letra de A a Z.', code: 400 };
  }

  const round = game.rounds[game.currentIndex];

  // Letra ja usada: ignora (nao penaliza, nao gasta tentativa).
  if (round.guessedLetters.has(letter) || round.wrongLetters.has(letter)) {
    return {
      result: 'repeated',
      word: currentWordView(game),
      status: game.status,
    };
  }

  const isInWord = round.word.includes(letter);

  if (isInWord) {
    round.guessedLetters.add(letter);
    // A palavra foi completamente revelada?
    const solved = round.word
      .split('')
      .every((ch) => round.guessedLetters.has(ch));
    if (solved) {
      round.solved = true;
      game.points += POINTS_PER_WORD;
      game.wordsGuessed += 1;
      return advanceOrFinish(game, 'correct');
    }
    return {
      result: 'hit',
      word: currentWordView(game),
      status: game.status,
    };
  }

  // Letra errada: penaliza e verifica game over.
  round.wrongLetters.add(letter);
  game.points -= PENALTY_PER_ERROR;

  if (round.wrongLetters.size >= MAX_ERRORS) {
    game.status = 'finished';
    game.endReason = 'gameover';
    return {
      result: 'gameover',
      revealedWord: round.word,
      status: game.status,
      summary: buildSummary(game),
    };
  }

  return {
    result: 'miss',
    word: currentWordView(game),
    status: game.status,
  };
}

// Avanca para a proxima palavra ou finaliza a partida (10 palavras).
function advanceOrFinish(game, result) {
  const solvedWord = game.rounds[game.currentIndex].word;

  const isLast = game.currentIndex >= game.words.length - 1;
  if (isLast) {
    game.status = 'finished';
    game.endReason = 'completed';
    return {
      result,
      solvedWord,
      status: game.status,
      summary: buildSummary(game),
    };
  }

  game.currentIndex += 1;
  return {
    result,
    solvedWord,
    status: game.status,
    word: currentWordView(game),
  };
}

// Encerra a partida manualmente (sem salvar pontuacao).
export function quitGame(gameId, user) {
  const owned = getOwnedGame(gameId, user);
  if (owned.error) return owned;
  games.delete(gameId);
  return { ok: true };
}

// Remove uma partida da memoria (chamado apos salvar a pontuacao).
export function disposeGame(gameId) {
  games.delete(gameId);
}

// Recupera o estado de uma partida (usado ao salvar a pontuacao).
export function getGame(gameId, user) {
  return getOwnedGame(gameId, user);
}

export const GAME_CONFIG = {
  TOTAL_WORDS,
  MAX_ERRORS,
  POINTS_PER_WORD,
  PENALTY_PER_ERROR,
};
