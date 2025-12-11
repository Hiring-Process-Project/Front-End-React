FROM node:14.18.2-alpine
WORKDIR /app
COPY . .
RUN npm i
EXPOSE 3000
CMD [ "npm", "run", "start" ]