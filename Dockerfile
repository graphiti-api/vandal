FROM node:13.8.0-stretch

ENV FORCE_REBUILD=20200110
RUN apt-get update -y && \
  apt-get install -y \
  joe \
  procps \
  gettext-base \
  socat 

ENV APP_DIR=/vandal
ENV REMOTE_HOSTS="[]"

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install

ADD . $APP_DIR

ENTRYPOINT [ "/vandal/bin/run" ]