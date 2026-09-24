// Teclado com as letras de A a Z.
// - Letras corretas ficam verdes; erradas ficam vermelhas.
// - Letras ja usadas ficam desabilitadas (nao podem ser escolhidas de novo).
export default function Alphabet({
  alphabet,
  guessedLetters,
  wrongLetters,
  onPick,
  disabled,
}) {
  const guessed = new Set(guessedLetters);
  const wrong = new Set(wrongLetters);

  return (
    <div className="alphabet">
      {alphabet.map((letter) => {
        const isCorrect = guessed.has(letter);
        const isWrong = wrong.has(letter);
        const used = isCorrect || isWrong;

        let cls = 'key';
        if (isCorrect) cls += ' correct';
        else if (isWrong) cls += ' wrong';

        return (
          <button
            key={letter}
            className={cls}
            onClick={() => onPick(letter)}
            disabled={used || disabled}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
