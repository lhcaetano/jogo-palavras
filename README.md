# Jogo de Adivinhar Palavras

Jogo web estilo forca: o jogador adivinha palavras ocultas escolhendo uma letra por vez.

## Regras

- Cadastro/login com nome e senha.
- O jogo tem 10 palavras, sorteadas aleatoriamente e sem repetir, de 5 temas.
- Cada palavra vem com uma dica (o nome do tema).
- O jogador escolhe uma letra por vez.
- 5 erros permitidos por palavra. Cada letra errada vale -1 ponto.
- Acertar a palavra completa vale +10 pontos.
- A pontuacao pode ficar negativa.
- Esgotar as 5 tentativas encerra o jogo (game over).
- Completar a 10a palavra encerra o jogo.
- Letras ja usadas ficam desabilitadas.
- E possivel encerrar a partida a qualquer momento (zera a pontuacao, nao salva).
- Ao final, a pontuacao e salva e aparece no leaderboard (ranking com pontos, data e hora).

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: MongoDB
- Orquestracao: Docker Compose (com hot reload)

## Como rodar

Pre-requisitos: Docker e Docker Compose.

```bash
docker compose up -d
```

Acesse no navegador:

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Comandos uteis

```bash
# Ver logs
docker compose logs -f

# Parar (mantendo os dados do banco)
docker compose down

# Parar e APAGAR os dados do banco
docker compose down -v
```

## Persistencia

Os dados do MongoDB ficam num volume Docker nomeado (`mongodb-data`).
Ao reiniciar com `docker compose down` e `up`, os dados sao preservados.
Somente `docker compose down -v` apaga os dados.
