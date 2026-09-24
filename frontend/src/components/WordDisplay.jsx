// Mostra a palavra oculta como uma sequencia de caixas.
// Cada caractere revelado aparece; os ocultos ficam vazios.
export default function WordDisplay({ mask }) {
  return (
    <div className="word">
      {mask.split('').map((ch, i) => (
        <div key={i} className="letter-box">
          {ch === '_' ? '' : ch}
        </div>
      ))}
    </div>
  );
}
