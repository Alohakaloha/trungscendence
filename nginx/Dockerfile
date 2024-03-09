FROM nginx:latest

RUN mkdir -p /etc/nginx/ssl/
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt -subj "/C=DE/ST=Germany/L=WOB/O=42Wolfsburg/CN=localhost"

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

