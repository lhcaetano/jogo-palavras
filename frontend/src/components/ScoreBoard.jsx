// Placar mostrado durante a partida: pontuacao atual, progresso das
// palavras e quantos erros ainda restam nesta palavra.
export default function ScoreBoard({ points, index, total, errorsLeft, maxErrors }) {
  return (
    <div className="scoreboard">
      <span>
        Palavra <strong>{index + 1}</strong>/{total}
      </span>
      <span>
        Pontos: <span className="points">{points}</span>
      </span>
      <span>
        Erros restantes: <span className="errors">{errorsLeft}</span>/{maxErrors}
      </span>
    </div>
  );
}
