FROM node:22.14.0

WORKDIR /usr/src/portfolio_website

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]