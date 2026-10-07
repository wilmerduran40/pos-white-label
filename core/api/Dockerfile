FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Marca a empaquetar (build por marca desde la raíz del repo: context: .).
ARG BRAND=kiki

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public
COPY db ./db

# Assets de marca del panel (logo, favicon, marca de agua) a nombres FIJOS.
COPY brands/${BRAND}/panel-assets ./public/img/
# Semilla de datos de la marca (menú/inventario) aplicada una sola vez.
COPY brands/${BRAND}/seed.sql ./db/brand_seed.sql

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000
CMD ["node", "src/server.js"]