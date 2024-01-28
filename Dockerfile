FROM node:20-alpine

WORKDIR /app

COPY package-lock.json package.json /app/

RUN npm install pm2 && npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
