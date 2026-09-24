// Banco de palavras do jogo, organizado por tema.
//
// A "dica" mostrada ao jogador e o nome do tema (ex.: "Carro").
// As palavras usam apenas letras A-Z, sem acentos e sem espacos,
// para combinar com a mecanica de adivinhacao letra a letra.
//
// Para adicionar palavras, basta incluir novas entradas nos arrays.
// Mantenha tudo em MAIUSCULAS e sem acentos.

export const THEMES = [
  {
    hint: 'Carro',
    words: [
      'VOLANTE',
      'FAROL',
      'MOTOR',
      'PNEU',
      'FREIO',
      'CAMBIO',
      'PORTA',
      'RETROVISOR',
      'ESCAPAMENTO',
      'PARABRISA',
    ],
  },
  {
    hint: 'Comidas',
    words: [
      'ARROZ',
      'FEIJAO',
      'MACARRAO',
      'BATATA',
      'SALADA',
      'FRANGO',
      'PEIXE',
      'QUEIJO',
      'LASANHA',
      'PANQUECA',
    ],
  },
  {
    hint: 'Roupas',
    words: [
      'CAMISA',
      'CALCA',
      'VESTIDO',
      'JAQUETA',
      'MEIA',
      'SAPATO',
      'BLUSA',
      'SHORTS',
      'CASACO',
      'CINTO',
    ],
  },
  {
    hint: 'Computador',
    words: [
      'TECLADO',
      'MONITOR',
      'MOUSE',
      'MEMORIA',
      'PROCESSADOR',
      'PLACA',
      'GABINETE',
      'IMPRESSORA',
      'ARQUIVO',
      'TELA',
    ],
  },
  {
    hint: 'Casa',
    words: [
      'COZINHA',
      'JANELA',
      'TELHADO',
      'PORTA',
      'QUARTO',
      'BANHEIRO',
      'SALA',
      'PAREDE',
      'ESCADA',
      'GARAGEM',
    ],
  },
];
