FROM node:20-alpine AS Build

COPY package*.json ./

RUN npm install

COPY . . 


CMD ["npm", "start"]

FROM nginx-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY --chown=user:group nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]