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

// Embaralha um array no lugar (Fisher-Yates com aleatoriedade cripto).
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sorteia n palavras sem repetir, com DISTRIBUICAO BALANCEADA por tema,
// EXCLUINDO as palavras que o jogador ja acertou (historico).
//
// history: objeto/Map { [tema]: [palavras ja acertadas] }. Para cada tema,
// as palavras ja acertadas nao entram no sorteio. A regra de negocio (reset
// ao esgotar) garante que sempre sobra ao menos 1 palavra disponivel por tema.
function drawWords(n, history = {}) {
  // Normaliza o historico para um acesso simples por tema -> Set de palavras.
  const histFor = (hint) => {
    const arr =
      history instanceof Map ? history.get(hint) : history[hint];
    return new Set(Array.isArray(arr) ? arr : []);
  };

  // Prepara, para cada tema, sua lista de palavras DISPONIVEIS (fora do
  // historico) ja embaralhada. Deduplica palavras entre temas.
  const seen = new Set();
  const buckets = THEMES.map((theme) => {
    const jaAcertadas = histFor(theme.hint);
    const disponiveis = theme.words.filter((w) => {
      if (seen.has(w)) return false; // dedup entre temas
      if (jaAcertadas.has(w)) return false; // ja acertada -> nao sorteia
      seen.add(w);
      return true;
    });
    return { hint: theme.hint, words: shuffle(disponiveis) };
  });

  // Embaralha a ordem dos temas para nao privilegiar sempre os primeiros.
  shuffle(buckets);

  // Distribui em rodadas: uma palavra por tema por rodada, ate atingir n
  // ou esgotar as palavras disponiveis.
  const drawn = [];
  let progressed = true;
  while (drawn.length < n && progressed) {
    progressed = false;
    for (const bucket of buckets) {
      if (drawn.length >= n) break;
      const word = bucket.words.pop();
      if (word) {
        drawn.push({ hint: bucket.hint, word });
        progressed = true;
      }
    }
  }

  // Embaralha o resultado final para a ordem das palavras nao seguir
  // sempre a mesma sequencia de temas.
  return shuffle(drawn).slice(0, Math.min(n, drawn.length));
}

// Total de palavras UNICAS por tema (considerando dedup entre temas),
// usado para saber quando o jogador esgotou um tema.
function totalWordsByTheme() {
  const totals = {};
  const seen = new Set();
  for (const theme of THEMES) {
    let count = 0;
    for (const w of theme.words) {
      if (!seen.has(w)) {
        seen.add(w);
        count += 1;
      }
    }
    totals[theme.hint] = count;
  }
  return totals;
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
// history: { [tema]: [palavras ja acertadas] } (opcional).
export function startGame(user, history = {}) {
  // Normaliza o historico recebido (Map ou objeto) para um objeto simples
  // de trabalho, que sera atualizado durante a partida.
  const workingHistory = {};
  const entries =
    history instanceof Map ? history.entries() : Object.entries(history || {});
  for (const [hint, words] of entries) {
    workingHistory[hint] = Array.isArray(words) ? [...words] : [];
  }

  const drawn = drawWords(TOTAL_WORDS, workingHistory);

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
    // Copia de trabalho do historico do jogador; atualizada a cada acerto.
    history: workingHistory,
    // Marca que o historico mudou e precisa ser persistido.
    historyDirty: false,
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
  if (!game) return { error: 'Partida não encontrada.', code: 404 };
  if (game.userId !== user.id) {
    return { error: 'Essa partida não é sua.', code: 403 };
  }
  return { game };
}

// Monta o resumo final da partida (estatisticas + mensagem).
function buildSummary(game) {
  const allGuessed = game.wordsGuessed === game.words.length;
  // E campeao quem completou o jogo (10 palavras) acertando TODAS elas.
  const champion = game.endReason === 'completed' && allGuessed;
  let message;

  if (game.endReason === 'completed') {
    if (allGuessed) {
      message = `CAMPEÃO! Parabéns, ${game.displayName}! Você acertou todas as ${game.words.length} palavras!`;
    } else {
      message = `Parabéns, ${game.displayName}! Você completou o jogo com ${game.wordsGuessed} de ${game.words.length} palavras.`;
    }
  } else {
    message = `Fim de jogo, ${game.displayName}! Você acertou ${game.wordsGuessed} palavra(s) antes de esgotar as tentativas. Não desista, tente de novo!`;
  }

  return {
    points: game.points,
    wordsGuessed: game.wordsGuessed,
    // Denominador de "acertos" e sempre o total de palavras da partida (ex.: 10),
    // independentemente de ter dado game over antes do fim.
    wordsPlayed: game.words.length,
    endReason: game.endReason,
    champion,
    message,
  };
}

// Registra uma palavra ACERTADA no historico do jogador (por tema),
// aplicando a regra de reset: se, ao acertar, o tema ficou completo
// (todas as palavras acertadas), o historico daquele tema e reiniciado
// mantendo APENAS a palavra recem-acertada.
function registerWordInHistory(game, hint, word) {
  const totals = totalWordsByTheme();
  const total = totals[hint] || 0;

  const atual = Array.isArray(game.history[hint]) ? game.history[hint] : [];
  // Evita duplicar a mesma palavra no historico.
  const semDuplicar = atual.includes(word) ? atual : [...atual, word];

  if (total > 0 && semDuplicar.length >= total) {
    // Esgotou o tema: reinicia mantendo so a ultima palavra acertada.
    game.history[hint] = [word];
  } else {
    game.history[hint] = semDuplicar;
  }

  game.historyDirty = true;
}

// Processa o chute de uma letra.
export function guessLetter(gameId, user, rawLetter) {
  const owned = getOwnedGame(gameId, user);
  if (owned.error) return owned;
  const game = owned.game;

  if (game.status !== 'playing') {
    return { error: 'Essa partida já terminou.', code: 400 };
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
      // Bloqueia a palavra acertada no historico do jogador (por tema),
      // aplicando o reset do tema se ele foi esgotado.
      registerWordInHistory(game, round.hint, round.word);
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

// Retorna o historico atualizado da partida se houve mudanca desde a
// ultima persistencia (para o controller salvar no banco). Retorna null
// se nada mudou. Marca como persistido (limpa a flag dirty).
export function pullHistoryUpdate(gameId, user) {
  const owned = getOwnedGame(gameId, user);
  if (owned.error || !owned.game.historyDirty) return null;
  owned.game.historyDirty = false;
  // Retorna uma copia rasa para o controller persistir.
  const snapshot = {};
  for (const [hint, words] of Object.entries(owned.game.history)) {
    snapshot[hint] = [...words];
  }
  return snapshot;
}

export const GAME_CONFIG = {
  TOTAL_WORDS,
  MAX_ERRORS,
  POINTS_PER_WORD,
  PENALTY_PER_ERROR,
};

// Exportado para testes (sorteio balanceado).
export { drawWords };
