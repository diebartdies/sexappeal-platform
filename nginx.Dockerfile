FROM nginx:alpine
RUN rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
