FROM node:16-alpine

RUN mkdir -p /usr/src/node-app && chown -R node:node /usr/src/node-app

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./

USER node

RUN yarn install --pure-lockfile

COPY --chown=node:node . .

EXPOSE 3000

# Liveness: qualsiasi risposta HTTP sulla porta indica che il processo e' vivo
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/v1/docs',(r)=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
