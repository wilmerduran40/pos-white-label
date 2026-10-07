FROM nginx:alpine

# Sitio estático de la marca + proxy de /api y /admin hacia el servicio `api`.
# Build context = raíz del repo (docker-compose: context: ., dockerfile: core/web/Dockerfile).

ARG BRAND=kiki

COPY core/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY core/web/maintenance.html /usr/share/nginx/html/maintenance.html

# Estáticos por marca (index, menu, css, data, img).
COPY brands/${BRAND}/index.html /usr/share/nginx/html/index.html
COPY brands/${BRAND}/menu.html /usr/share/nginx/html/menu.html
COPY brands/${BRAND}/data /usr/share/nginx/html/data
COPY brands/${BRAND}/css /usr/share/nginx/html/css
COPY brands/${BRAND}/img /usr/share/nginx/html/img

EXPOSE 80