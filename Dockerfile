FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY outputs/planificador-bandejas-acm.html /usr/share/nginx/html/index.html
