// Mostra a palavra oculta como uma sequencia de caixas.
// Cada caractere revelado aparece; os ocultos ficam vazios.
// Quando `celebrating` e true (acabou de acertar a palavra), aplica um
// efeito visual de destaque nas caixas.
export default function WordDisplay({ mask, celebrating = false }) {
  return (
    <div className={celebrating ? 'word celebrating' : 'word'}>
      {mask.split('').map((ch, i) => (
        <div
          key={i}
          className={celebrating ? 'letter-box celebrate' : 'letter-box'}
          style={celebrating ? { animationDelay: `${i * 60}ms` } : undefined}
        >
          {ch === '_' ? '' : ch}
        </div>
      ))}
    </div>
  );
}
