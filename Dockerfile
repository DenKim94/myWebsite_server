FROM node:22.14.0 AS base

WORKDIR /usr/src/portfolio_website

COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den gesmten Quellcode
COPY . .

# Tests ausführen
FROM base AS test
RUN npm test || exit 1

# Finales Image erstellen
FROM base AS production

EXPOSE 3001

CMD ["node", "server.js"]