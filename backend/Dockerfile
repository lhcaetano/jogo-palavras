# Dockerfile de producao do backend (usado pelo Render).
FROM node:20-alpine

WORKDIR /app

# Instala apenas as dependencias de producao para uma imagem menor.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copia o codigo da aplicacao.
COPY . .

# O Render injeta a porta via variavel PORT.
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/server.js"]
