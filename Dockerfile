# ---- Stage 1: solo dipendenze di produzione ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
# Installa SOLO le dipendenze di produzione
RUN yarn install --production --frozen-lockfile && yarn cache clean

# ---- Stage 2: immagine finale (runtime) ----
FROM node:20-alpine AS runtime
# Patch dei pacchetti OS (sicurezza) + tini come init di PID 1 (inoltra i segnali, raccoglie gli zombie).
# Rimuove npm: non serve a runtime (l'app gira con 'node') ed elimina le CVE delle sue dipendenze (tar, ecc.)
RUN apk upgrade --no-cache \
  && apk add --no-cache tini \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production
WORKDIR /usr/src/node-app
# Copia le dipendenze di sola produzione dallo stage precedente e il codice, come utente non root
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
# Esegue come utente non privilegiato (utente presente di default nell'immagine di node)
USER node
EXPOSE 3000
# Liveness: qualsiasi risposta HTTP sulla porta indica che il processo è vivo
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/v1/docs',(r)=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
