<div align="center">

# node-express-boilerplate - REST API hardening

Progetto per *Software Engineering for Secure Cloud Systems* |
Autore: **Amodio Raffaele Merone**

[![CI](https://github.com/AmodioMerone/node-express-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/AmodioMerone/node-express-boilerplate/actions/workflows/ci.yml)
[![Security](https://github.com/AmodioMerone/node-express-boilerplate/actions/workflows/security.yml/badge.svg)](https://github.com/AmodioMerone/node-express-boilerplate/actions/workflows/security.yml)

[Repository](https://github.com/AmodioMerone/node-express-boilerplate) · [Immagine su Docker Hub](https://hub.docker.com/r/amodiomerone/node-express-boilerplate)

</div>

---

## Indice

1. [Descrizione del progetto](#1-descrizione-del-progetto)
    - [1.1 Cosa fa l'applicazione](#11-cosa-fa-lapplicazione)
    - [1.2 Obiettivo del progetto](#12-obiettivo-del-progetto)
    - [1.3 Stack tecnologico](#13-stack-tecnologico)
    - [1.4 Struttura del repository](#14-struttura-del-repository)
2. [Architettura dell'applicazione](#2-architettura-dellapplicazione)
    - [2.1 Componenti](#21-componenti)
    - [2.2 Ruoli e autorizzazione](#22-ruoli-e-autorizzazione)
    - [2.3 Catena dei middleware di sicurezza](#23-catena-dei-middleware-di-sicurezza)
    - [2.4 Modello dati](#24-modello-dati)
3. [API Reference](#3-api-reference)
    - [3.1 Autenticazione (`/v1/auth`)](#31-autenticazione-v1auth)
    - [3.2 Utenti (`/v1/users`)](#32-utenti-v1users)
4. [Configurazione](#4-configurazione)
5. [Metodologia DevSecOps](#5-metodologia-devsecops)
6. [Vulnerabilità e test di sicurezza](#6-vulnerabilità-e-test-di-sicurezza)
    - [6.1 Broken Access Control - A01](#61-broken-access-control---a01)
    - [6.2 Cryptographic Failures - A02](#62-cryptographic-failures---a02)
    - [6.3 Injection - A03](#63-injection---a03)
    - [6.4 Security Misconfiguration - A05](#64-security-misconfiguration---a05)
    - [6.5 Identification & Authentication Failures - A07](#65-identification--authentication-failures---a07)
    - [6.6 Vulnerable & Outdated Components - A06](#66-vulnerable--outdated-components---a06)
    - [6.7 Riepilogo dei test di sicurezza](#67-riepilogo-dei-test-di-sicurezza)
7. [Conformità OWASP Top 10](#7-conformità-owasp-top-10)
8. [Strumenti di sicurezza automatici](#8-strumenti-di-sicurezza-automatici)
    - [8.1 CodeQL](#81-codeql)
    - [8.2 SonarCloud](#82-sonarcloud)
    - [8.3 Snyk](#83-snyk)
    - [8.4 Trivy](#84-trivy)
    - [8.5 GitGuardian](#85-gitguardian)
    - [8.6 gitleaks](#86-gitleaks)
9. [Remediation delle vulnerabilità](#9-remediation-delle-vulnerabilità)
    - [9.1 Dipendenze (correzioni reali)](#91-dipendenze-correzioni-reali)
    - [9.2 Hardening applicativo](#92-hardening-applicativo)
    - [9.3 Falsi positivi accettati e motivati](#93-falsi-positivi-accettati-e-motivati)
    - [9.4 Triage del code scanning](#94-triage-del-code-scanning)
10. [Containerizzazione](#10-containerizzazione)
    - [10.1 Immagine di produzione (Dockerfile multi-stage)](#101-immagine-di-produzione-dockerfile-multi-stage)
    - [10.2 Orchestrazione hardened (Docker Compose)](#102-orchestrazione-hardened-docker-compose)
11. [Pipeline CI/CD](#11-pipeline-cicd)
    - [11.1 Workflow CI (`ci.yml`)](#111-workflow-ci-ciyml)
    - [11.2 Workflow Security (`security.yml`)](#112-workflow-security-securityyml)
    - [11.3 Workflow CD (`cd.yml`)](#113-workflow-cd-cdyml)
    - [11.4 Sicurezza della pipeline](#114-sicurezza-della-pipeline)
    - [11.5 Segreti della pipeline](#115-segreti-della-pipeline)
12. [Esecuzione locale](#12-esecuzione-locale)
    - [12.1 Requisiti](#121-requisiti)
    - [12.2 Avvio con Docker Compose](#122-avvio-con-docker-compose)
    - [12.3 Test](#123-test)
    - [12.4 Uso dell'immagine pubblicata](#124-uso-dellimmagine-pubblicata)
13. [Riferimenti](#13-riferimenti)

---

## 1. Descrizione del progetto

### 1.1 Cosa fa l'applicazione

È il **backend di un servizio con gestione utenti e autenticazione**: un'API REST pronta all'uso che fornisce le funzionalità richieste da quasi ogni applicazione dotata di account. Espone, sotto il prefisso `/v1`:

- **Registrazione e login** degli utenti, con password protette tramite hashing bcrypt;
- **Autenticazione stateless a token JWT**, con coppia *access token* (breve durata) e *refresh token* (lunga durata) e relativo rinnovo;
- **Logout** con invalidazione del refresh token;
- **Recupero password** via email (richiesta di reset e reimpostazione con token a scadenza);
- **Verifica dell'indirizzo email** tramite token inviato per email;
- **Gestione utenti (CRUD)**: creazione, elenco paginato e filtrabile, lettura, aggiornamento ed eliminazione;
- **Autorizzazione basata su ruoli** (`user`, `admin`) con permessi per rotta;
- **Invio di email transazionali** via SMTP (nodemailer) per reset password e verifica;
- **Documentazione OpenAPI/Swagger** interattiva (`/v1/docs`), generata dai commenti del codice;
- **Validazione degli input** (Joi), **gestione centralizzata degli errori** e **logging** strutturato.

Non implementa quindi un dominio applicativo specifico, ma una **base (boilerplate)** su cui costruire applicazioni reali.

### 1.2 Obiettivo del progetto

Il progetto parte da una web application open source ([`hagopj13/node-express-boilerplate`](https://github.com/hagopj13/node-express-boilerplate)) e la sottopone a un percorso di **messa in sicurezza DevSecOps**: analisi statica e delle dipendenze in pipeline, correzione delle vulnerabilità, containerizzazione hardened e pubblicazione dell'immagine solo dopo il superamento dei controlli di sicurezza.

Il codice in sè non è stato riscritto: è stata migliorata solo la **superficie di sicurezza** (autenticazione, validazione, header, dipendenze, immagine, pipeline), mantenendo il comportamento funzionale e la suite di test verde.

### 1.3 Stack tecnologico

| Ambito | Tecnologie |
|---|---|
| Runtime | Node.js, Express |
| Persistenza | MongoDB, Mongoose |
| Autenticazione | Passport (strategia JWT), `jsonwebtoken`, bcrypt |
| Validazione input | Joi |
| Middleware di sicurezza | Helmet, `express-mongo-sanitize`, `xss-clean`, `express-rate-limit`, CORS |
| Documentazione API | swagger-jsdoc, swagger-ui-express (OpenAPI) |
| Test | Jest, Supertest |
| Containerizzazione | Docker (multi-stage), Docker Compose |
| CI/CD | GitHub Actions |

### 1.4 Struttura del repository

```
.
├── src/                         # codice applicativo (config, middleware, models, routes, services)
├── tests/                       # unit + integration (inclusi i test di sicurezza)
├── .github/workflows/
│   ├── ci.yml                   # lint + test su MongoDB
│   ├── security.yml             # SAST, SCA, secret scanning
│   └── cd.yml                   # build, scansione immagine e pubblicazione
├── Dockerfile                   # immagine di produzione multi-stage hardened
├── docker-compose.hardened.yml  # orchestrazione di produzione hardened
├── .trivyignore / .snyk         # accettazioni motivate dei falsi positivi
├── .gitleaks.toml               # allowlist del secret scanning
└── sonar-project.properties     # configurazione SonarCloud
```

---

## 2. Architettura dell'applicazione

### 2.1 Componenti

L'applicazione è un servizio stateless che espone un'API REST versionata sotto `/v1` e si appoggia a MongoDB per la persistenza. L'autenticazione è basata su **access/refresh token JWT** (nessuna sessione lato server), il che rende il servizio orizzontalmente scalabile.

```
Client ──HTTP──> Express (API /v1) ──Mongoose──> MongoDB
                    │
                    └── Passport JWT (Bearer token)
```

### 2.2 Ruoli e autorizzazione

Sono previsti due ruoli (`user`, `admin`). L'autorizzazione è basata su permessi per rotta gestiti dal middleware `auth(<permesso>)`: `getUsers` e `manageUsers` sono assegnati al solo ruolo `admin`. Fa eccezione l'accesso alla **propria** risorsa: un utente autenticato può leggere/aggiornare/eliminare esclusivamente il proprio account.

### 2.3 Catena dei middleware di sicurezza

Ogni richiesta attraversa, nell'ordine, una pipeline di middleware registrata in `src/app.js`:

| Middleware | Ruolo |
|---|---|
| `helmet()` | Header di sicurezza HTTP (nosniff, HSTS, X-Frame-Options, no X-Powered-By) |
| `express.json({ limit: '10kb' })` | Limite di dimensione del body (mitiga DoS da payload) |
| `xss-clean` | Sanitizzazione dell'input contro XSS |
| `express-mongo-sanitize` | Rimozione degli operatori NoSQL (`$`, `.`) dall'input |
| `cors` | Controllo delle origini cross-origin (configurabile) |
| Passport JWT | Verifica dell'access token |
| `express-rate-limit` | Limitazione dei tentativi sulle rotte di autenticazione |

### 2.4 Modello dati

Due entità Mongoose principali. Il plugin `toJSON` normalizza l'output (`_id` -> `id`, rimozione di `__v`) e **omette i campi marcati `private`**.

**User** (`src/models/user.model.js`)

| Campo | Tipo | Note |
|---|---|---|
| `name` | String | obbligatorio |
| `email` | String | obbligatorio, univoco, lowercase, validato |
| `password` | String | obbligatorio, min 8, almeno una lettera e un numero, `private` (escluso dal JSON), **hash bcrypt (costo 10)** in `pre('save')` |
| `role` | String | enum `user`/`admin`, default `user` |
| `isEmailVerified` | Boolean | default `false` |

Metodi rilevanti: `isEmailTaken(email)` e `isPasswordMatch(password)` (confronto bcrypt).

**Token** (`src/models/token.model.js`)

| Campo | Tipo | Note |
|---|---|---|
| `token` | String | obbligatorio, indicizzato |
| `user` | ObjectId | riferimento a `User` |
| `type` | String | enum `refresh`/`resetPassword`/`verifyEmail` |
| `expires` | Date | obbligatorio |
| `blacklisted` | Boolean | default `false` |

---

## 3. API Reference

Base path: `/v1`. I token si trasmettono nell'header `Authorization: Bearer <accessToken>`. La documentazione interattiva OpenAPI è esposta su `/v1/docs` in ambiente di sviluppo.

### 3.1 Autenticazione (`/v1/auth`)

| Metodo | Endpoint | Auth | Descrizione |
|---|---|:---:|---|
| POST | `/auth/register` | No | Registra un utente, restituisce `user` + `tokens` |
| POST | `/auth/login` | No | Login con email e password |
| POST | `/auth/logout` | No | Invalida il refresh token |
| POST | `/auth/refresh-tokens` | No | Rinnova la coppia di token a partire dal refresh token |
| POST | `/auth/forgot-password` | No | Invia l'email di reset password |
| POST | `/auth/reset-password?token=` | No | Reimposta la password (token in query) |
| POST | `/auth/send-verification-email` | Sì | Invia l'email di verifica |
| POST | `/auth/verify-email?token=` | No | Verifica l'email (token in query) |

### 3.2 Utenti (`/v1/users`)

Tutte le rotte richiedono un access token; le operazioni su account altrui sono riservate agli `admin`.

| Metodo | Endpoint | Permesso | Descrizione |
|---|---|:---:|---|
| POST | `/users` | `manageUsers` | Crea un utente |
| GET | `/users` | `getUsers` | Elenco paginato (filtri `name`, `role`; `sortBy`, `limit`, `page`) |
| GET | `/users/:userId` | `getUsers` o self | Dettaglio utente |
| PATCH | `/users/:userId` | `manageUsers` o self | Aggiorna utente |
| DELETE | `/users/:userId` | `manageUsers` o self | Elimina utente |

---

## 4. Configurazione

La configurazione è gestita da variabili d'ambiente, validate all'avvio con Joi (`src/config/config.js`): se una variabile obbligatoria manca o non rispetta il vincolo, **l'applicazione non parte**. In locale si parte da `.env.example`.

| Variabile | Obbl. | Default | Descrizione |
|---|:---:|---|---|
| `PORT` | No | `3000` | Porta HTTP |
| `MONGODB_URL` | Sì | - | URL di connessione MongoDB |
| `JWT_SECRET` | Sì | - | Segreto HMAC, **minimo 32 caratteri** |
| `JWT_ACCESS_EXPIRATION_MINUTES` | No | `30` | Scadenza access token (minuti) |
| `JWT_REFRESH_EXPIRATION_DAYS` | No | `30` | Scadenza refresh token (giorni) |
| `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` | No | `10` | Scadenza token reset password |
| `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES` | No | `10` | Scadenza token verifica email |
| `CORS_ORIGIN` | No | *(vuoto)* | Origini consentite, separate da virgola; vuoto = nessuna |
| `SMTP_HOST` / `SMTP_PORT` | No | - | Server SMTP per l'invio email |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | No | - | Credenziali SMTP |
| `EMAIL_FROM` | No | - | Mittente delle email |

> **Nota:** `.env.example` contiene solo valori placeholder. Questi vengono cambiati in prod.

---

## 5. Metodologia DevSecOps

L'intero lavoro segue un ciclo esplicito, ripetibile a ogni push:

```
scansione (SAST + SCA + secret)  ->  analisi/triage dei finding
        ->  correzione (upgrade dipendenze / hardening del codice)
        ->  push  ->  ri-scansione automatica in CI  ->  verifica dell'esito
```

**Correzione sempre applicata dove possibile. Eventuale CVE accettate sono documentate per quando il rischio non è sfruttabile nel contesto.** Ogni accettazione è tracciata in un file di policy (`.trivyignore`, `.snyk`, `.gitleaks.toml`) con motivazione, e resta rivalutabile.

---

## 6. Vulnerabilità e test di sicurezza

Ai test funzionali della baseline sono stati aggiunti test di sicurezza mirati, mappati sulle categorie OWASP. Per ciascuna area è indicata la **misura** adottata e il **test** che la verifica (in `tests/integration/security.test.js`, `tests/integration/jwt.security.test.js`, `tests/unit/middlewares/rateLimiter.test.js`). Complessivamente la suite conta **128 test** (di cui **15 di sicurezza**), eseguiti a ogni push, con la coverage importata in SonarCloud.

### 6.1 Broken Access Control - A01

- **Mass assignment:** in fase di registrazione non è possibile impostare `role: admin`; lo schema Joi respinge i campi non previsti.
- *Test:* la registrazione con `role: admin` restituisce `400`.

### 6.2 Cryptographic Failures - A02

- **Algoritmo JWT fissato a HS256** in firma e verifica (`{ algorithm: 'HS256' }` / `{ algorithms: ['HS256'] }`), per prevenire l'*algorithm confusion* (es. token `alg: none`).
- **Segreto JWT >= 32 caratteri** imposto in validazione della configurazione: l'app non parte con un segreto debole.
- **Hashing password con bcrypt** a costo >= 10.
- *Test:* token con `alg: none` e token con payload manomesso vengono rifiutati; l'hash memorizzato rispetta `$2[aby]$1x$`.

### 6.3 Injection - A03

- **NoSQL injection:** neutralizzata da `express-mongo-sanitize` (rimozione degli operatori) unita alla validazione Joi (i campi sono vincolati a stringa).
- **XSS riflesso:** input sanitizzato da `xss-clean`; le risposte API sono JSON con `X-Content-Type-Options: nosniff`.
- *Test:* un login con `{ "email": { "$gt": "" }, "password": { "$gt": "" } }` non autentica.

### 6.4 Security Misconfiguration - A05

- **Header di sicurezza** via Helmet (nosniff, HSTS, X-Frame-Options, rimozione di `X-Powered-By`).
- **CORS secure-by-default:** nessuna origine `*` nel codice; le origini consentite si abilitano esplicitamente via variabile d'ambiente.
- **Gestione errori:** le risposte di errore non espongono lo stack trace.
- *Test:* verifica della presenza/assenza degli header, dell'assenza del wildcard CORS e dell'assenza di stack trace nel `404`.

### 6.5 Identification & Authentication Failures - A07

- **Rate limiting** sulle rotte di autenticazione (`express-rate-limit`) contro brute-force e credential stuffing.
- **Anti account enumeration:** credenziali errate restituiscono lo stesso messaggio a prescindere dal fatto che l'email esista.
- *Test:* dopo N tentativi falliti si ottiene `429`; email inesistente e password errata restituiscono lo stesso errore.

### 6.6 Vulnerable & Outdated Components - A06

Gestita in modo continuo tramite SCA (Snyk, Trivy) in pipeline, vedi [9](#9-remediation-delle-vulnerabilità).

### 6.7 Riepilogo dei test di sicurezza

| # | Test | OWASP | Suite |
|:---:|---|:---:|---|
| 1 | `X-Content-Type-Options: nosniff` presente | A05 | `security.test.js` |
| 2 | `X-Frame-Options` presente | A05 | `security.test.js` |
| 3 | `Strict-Transport-Security` presente | A05 | `security.test.js` |
| 4 | `X-Powered-By` assente | A05 | `security.test.js` |
| 5 | CORS senza wildcard (`!= *`) | A05 | `security.test.js` |
| 6 | Operatori NoSQL nel login non autenticano | A03 | `security.test.js` |
| 7 | Registrazione non consente `role: admin` | A01 | `security.test.js` |
| 8 | Stesso errore per email/password errate | A07 | `security.test.js` |
| 9 | `404` senza stack trace | A05/A09 | `security.test.js` |
| 10 | Body oltre il limite -> `413` | A05 | `security.test.js` |
| 11 | Hash password con costo bcrypt >= 10 | A02 | `security.test.js` |
| 12 | Access token valido accettato | A07 | `jwt.security.test.js` |
| 13 | Token `alg: none` rifiutato | A02 | `jwt.security.test.js` |
| 14 | Token con payload manomesso rifiutato | A02 | `jwt.security.test.js` |
| 15 | `429` dopo i tentativi falliti consentiti | A07 | `rateLimiter.test.js` |

---

## 7. Conformità OWASP Top 10

| Categoria OWASP | Copertura nel progetto |
|---|---|
| A01 - Broken Access Control | Permessi per rotta, protezione mass assignment |
| A02 - Cryptographic Failures | JWT HS256, segreto >= 32, bcrypt |
| A03 - Injection | `express-mongo-sanitize`, `xss-clean`, validazione Joi |
| A05 - Security Misconfiguration | Helmet, CORS ristretto, gestione errori |
| A06 - Vulnerable Components | SCA in CI (Snyk, Trivy), remediation continua |
| A07 - Identification & Auth Failures | Rate limiting, anti enumeration |
| A09 - Logging & Monitoring | Logging strutturato (winston/morgan), scan schedulati |

---

## 8. Strumenti di sicurezza automatici

L'analisi di sicurezza è demandata a strumenti eterogenei e complementari, orchestrati dal workflow `security.yml`. La ridondanza è voluta: ogni tool ha un proprio database di advisory e un proprio motore, quindi coprono aree diverse.

| Strumento | Tipo | Cosa analizza |
|---|---|---|
| **CodeQL** | SAST | Analisi statica del codice |
| **SonarCloud** | SAST + Quality | Bug, code smell, security hotspot, coverage |
| **Snyk** | SCA + SAST | Vulnerabilità delle dipendenze e del codice |
| **Trivy** | SCA / Misconfig / Secret | Dipendenze, misconfigurazioni, secret, immagine Docker |
| **GitGuardian** | Secret scanning | Segreti nell'intera storia git |
| **gitleaks** | Secret scanning | Segreti (regole di default + allowlist) |

### 8.1 CodeQL

SAST nativo di GitHub. Inizializzato sul linguaggio JavaScript con il set di query `security-extended` (più esteso del default) e passo di `analyze`. I risultati confluiscono nella tab *Security -> Code scanning*.

### 8.2 SonarCloud

SAST e analisi di qualità con importazione della **coverage**. Il job avvia un servizio MongoDB, genera la coverage (`yarn coverage`) ed esegue la scansione. Configurazione in `sonar-project.properties` (`sonar.organization`, `sonar.projectKey`). Attivo solo se sono presenti i segreti `SONAR_TOKEN` e `SONAR_HOST_URL`.

### 8.3 Snyk

Software Composition Analysis sulle dipendenze (`snyk test --severity-threshold=high`, che fa **fallire il job** in presenza di vulnerabilità HIGH) più analisi statica del codice (`snyk code test`). Le eccezioni motivate vivono nel file `.snyk`. Attivo se è presente `SNYK_TOKEN`.

### 8.4 Trivy

Scansione del filesystem (`scan-type: fs`) con tre scanner: `vuln` (CVE delle dipendenze), `misconfig` (Dockerfile/compose) e `secret`. Opzioni `ignore-unfixed` e `severity: HIGH,CRITICAL`; l'output SARIF viene caricato nella tab Security. Trivy è usato anche come **gate sull'immagine** nel workflow CD. Le eccezioni motivate vivono nel file `.trivyignore`.

### 8.5 GitGuardian

Secret scanning sull'intera storia git (`fetch-depth: 0`) tramite `ggshield`. Attivo se è presente `GITGUARDIAN_API_KEY`.

### 8.6 gitleaks

Secondo scanner di segreti, non richiede chiavi. Usa le regole di default estese da un'**allowlist** documentata in `.gitleaks.toml` (per i valori di esempio del template `.env.example` e per il segreto fittizio usato nei test/CI).


---

## 9. Remediation delle vulnerabilità

Il ciclo *scan -> fix -> push -> verifica* è stato applicato ai finding emersi dagli strumenti automatici. Gli esiti sono verificabili nella tab **Security** del repository e nei log dei workflow.

### 9.1 Dipendenze (correzioni reali)

Sul **lockfile originale**, Trivy rileva (allo stato attuale del suo database) **109 vulnerabilità note** su **40 pacchetti**: 2 CRITICAL, 50 HIGH, 44 MEDIUM, 13 LOW. Il conteggio dipende dallo stato del database al momento della scansione (nuovi advisory compaiono nel tempo). Sono state risolte con quattro strategie:

| Strategia | CVE | Interventi principali |
|---|:---:|---|
| Upgrade (diretto o del pacchetto padre) | 46 | `mongoose` 5→6, `jsonwebtoken` 8→9, `express` 4.17→4.21 (con le sue transitive `body-parser`/`qs`/`send`/`path-to-regexp`/…), `joi`, `passport`, `validator`, `moment`, `nodemailer`, `morgan` 1.10→1.11 (CVE-2026-5078), `swagger-ui-express` |
| Rimozione di `pm2` | 37 | elimina un ampio sottoalbero non necessario in produzione (`axios`, `systeminformation`, `pac-resolver`, `follow-redirects`, `degenerator`, …) |
| Upgrade transitivo (lockfile rigenerato) | 12 | `semver`, `ws`, `braces`, `picomatch`, `lodash` |
| Pin via `resolutions` | 10 | `async`, `cross-spawn`, `minimatch`, `brace-expansion`, `on-headers` |
| Accettazione motivata | 4 | `js-yaml`, `uuid` (non sfruttabili, vedi [9.3](#93-falsi-positivi-accettati-e-motivati)) |

<details>
<summary>Elenco completo dei pacchetti vulnerabili nel baseline e relativa risoluzione (dati Trivy)</summary>

| Pacchetto | CRIT | HIGH | MED | LOW | Risoluzione |
|---|:---:|:---:|:---:|:---:|---|
| `mongoose@5.13.20` | 1 | 2 | - | - | Upgrade (diretto o del padre) |
| `systeminformation@5.7.7` | 1 | 5 | - | - | Rimozione di pm2 (transitiva eliminata) |
| `async@2.6.3` | - | 1 | - | - | Pin via resolutions |
| `async@3.2.0` | - | 1 | - | - | Pin via resolutions |
| `axios@0.21.4` | - | 10 | 10 | 1 | Rimozione di pm2 (transitiva eliminata) |
| `body-parser@1.19.0` | - | 1 | - | - | Upgrade (diretto o del padre) |
| `braces@3.0.2` | - | 1 | - | - | Upgrade transitivo (lockfile rigenerato) |
| `cross-spawn@7.0.3` | - | 1 | - | - | Pin via resolutions |
| `degenerator@2.2.0` | - | 1 | - | - | Rimozione di pm2 (transitiva eliminata) |
| `fast-json-patch@3.0.0-1` | - | 1 | - | - | Rimozione di pm2 (transitiva eliminata) |
| `ip@1.1.5` | - | 1 | - | 1 | Rimozione di pm2 (transitiva eliminata) |
| `jsonwebtoken@8.5.1` | - | 1 | 2 | - | Upgrade (diretto o del padre) |
| `jws@3.2.2` | - | 1 | - | - | Upgrade (diretto o del padre) |
| `lodash@4.17.21` | - | 1 | 2 | - | Upgrade transitivo (lockfile rigenerato) |
| `minimatch@3.0.4` | - | 4 | - | - | Pin via resolutions |
| `moment@2.29.1` | - | 2 | - | - | Upgrade (diretto o del padre) |
| `nodemailer@6.6.2` | - | 2 | 6 | 1 | Upgrade (diretto o del padre) |
| `pac-resolver@4.2.0` | - | 1 | - | - | Rimozione di pm2 (transitiva eliminata) |
| `path-to-regexp@0.1.7` | - | 3 | - | - | Upgrade (diretto o del padre) |
| `picomatch@2.3.0` | - | 1 | 1 | - | Upgrade transitivo (lockfile rigenerato) |
| `qs@6.7.0` | - | 1 | 1 | 1 | Upgrade (diretto o del padre) |
| `semver@6.3.0` | - | 1 | - | - | Upgrade transitivo (lockfile rigenerato) |
| `semver@7.2.3` | - | 1 | - | - | Upgrade transitivo (lockfile rigenerato) |
| `validator@12.2.0` | - | 1 | 3 | - | Upgrade (diretto o del padre) |
| `validator@13.6.0` | - | 1 | 3 | - | Upgrade (diretto o del padre) |
| `ws@7.4.6` | - | 2 | - | - | Upgrade transitivo (lockfile rigenerato) |
| `ws@7.5.2` | - | 2 | - | - | Upgrade transitivo (lockfile rigenerato) |
| `@sideway/formula@3.0.0` | - | - | 1 | - | Upgrade (diretto o del padre) |
| `brace-expansion@1.1.11` | - | - | 1 | 1 | Pin via resolutions |
| `express@4.17.1` | - | - | 1 | 1 | Upgrade (diretto o del padre) |
| `follow-redirects@1.15.2` | - | - | 3 | - | Rimozione di pm2 (transitiva eliminata) |
| `joi@17.4.0` | - | - | 1 | - | Upgrade (diretto o del padre) |
| `js-yaml@4.1.0` | - | - | 2 | - | Accettata (vedi 9.3) |
| `moment-timezone@0.5.33` | - | - | 1 | 1 | Upgrade (diretto o del padre) |
| `morgan@1.10.0` | - | - | 1 | - | Upgrade (diretto o del padre) |
| `passport@0.4.1` | - | - | 1 | - | Upgrade (diretto o del padre) |
| `swagger-ui-dist@3.51.1` | - | - | 2 | - | Upgrade (diretto o del padre) |
| `uuid@3.4.0` | - | - | 1 | - | Accettata (vedi 9.3) |
| `uuid@8.3.2` | - | - | 1 | - | Accettata (vedi 9.3) |
| `@tootallnate/once@1.1.2` | - | - | - | 1 | Rimozione di pm2 (transitiva eliminata) |
| `cookie@0.4.0` | - | - | - | 1 | Upgrade (diretto o del padre) |
| `on-headers@1.0.2` | - | - | - | 1 | Pin via resolutions |
| `pm2@5.1.0` | - | - | - | 1 | Rimozione di pm2 (transitiva eliminata) |
| `send@0.17.1` | - | - | - | 1 | Upgrade (diretto o del padre) |
| `serve-static@1.14.1` | - | - | - | 1 | Upgrade (diretto o del padre) |

</details>

A queste si aggiungono due advisory ReDoS emerse più tardi da Snyk (`CVE-2026-13149` su `brace-expansion`, `CVE-2026-59869` su `js-yaml`), anch'esse non sfruttabili e accettate in `.snyk` (vedi [9.3](#93-falsi-positivi-accettati-e-motivati)).

Esito: **0 vulnerabilità su tutte le severità** (CRITICAL/HIGH/MEDIUM/LOW). Suite di test verde dopo ogni aggiornamento.

### 9.2 Hardening applicativo

Interventi mirati sul codice/configurazione (dettagliati in [6](#6-vulnerabilità-e-test-di-sicurezza)): pinning dell'algoritmo JWT, lunghezza minima del segreto, CORS secure-by-default, rate limiting incondizionato sulle rotte di autenticazione, limiti di dimensione del body. Ogni intervento è accompagnato dal relativo test di regressione.

### 9.3 Falsi positivi accettati e motivati

Elenco completo dei finding classificati come **falsi positivi** (non sfruttabili nel contesto) e relativa gestione. Le accettazioni degli scanner di dipendenze/segreti vivono in **file di policy versionati**; i falsi positivi del code scanning sono **archiviati (dismissed)** nella tab Security con motivazione tecnica.

| Finding | Strumento | Gestione | Motivazione sintetica |
|---|---|---|---|
| `CVE-2025-64718`, `CVE-2026-53550` (js-yaml, DoS parsing YAML) | Trivy | `.trivyignore` | Solo build-time (doc OpenAPI), input fidato; il fix romperebbe js-yaml 3.x usato da ESLint |
| `CVE-2026-41907` (uuid) | Trivy | `.trivyignore` | Dipendenza solo di test, assente in produzione (`--omit=dev`) |
| `CVE-2026-13149` (brace-expansion, ReDoS) | Snyk | `.snyk` | Solo pattern glob fidati di swagger-jsdoc; fix solo in major 5.x, incompatibile con `minimatch@3` |
| `CVE-2026-59869` (js-yaml, ReDoS) | Snyk | `.snyk` | Parsing della doc OpenAPI a build-time; fix `4.3.0` non forzabile senza rompere ESLint (js-yaml 3.x) |
| Secret di esempio/test (`.env.example`, segreto CI, token JWT di esempio nella history del progetto originale) | gitleaks | `.gitleaks.toml` | Valori placeholder/fittizi e token di documentazione, nessun segreto reale |
| Reflected XSS (`user.controller.js`) | CodeQL | dismissed (Code scanning) | Risposta JSON + `nosniff` (helmet) + input sanificato da `xss-clean` |
| NoSQL injection (`auth`/`user`/`token.service.js`, 3 alert) | CodeQL | dismissed (Code scanning) | `express-mongo-sanitize` + validazione Joi; per il token il campo `sub` proviene da un JWT firmato |

> i dismissal riportano autore e commento nella tab Security, e tutto viene rivalutato a ogni aggiornamento del toolchain.

### 9.4 Triage del code scanning

I finding di GitHub Code scanning (CodeQL + Trivy) sono stati chiusi in due modi:

- **corretti nel codice** e verificati dalla ri-scansione automatica dopo il push (rate limiting, CORS, rimozione di uno script di scaffolding non necessario, sostituzione di token di esempio nella documentazione, `HEALTHCHECK` nell'immagine);
- **archiviati come falsi positivi** con motivazione tecnica i casi non sfruttabili (reflected-XSS e NoSQL injection), elencati nella tabella di [9.3](#93-falsi-positivi-accettati-e-motivati).

Esito: **0 alert aperti** su Code scanning, **0 alert** di secret scanning.

---

## 10. Containerizzazione

### 10.1 Immagine di produzione (Dockerfile multi-stage)

Il `Dockerfile` produce un'immagine minimale e hardened:

- **build multi-stage:** uno stage installa le sole dipendenze di produzione (`yarn install --production --frozen-lockfile`), lo stage finale copia solo quelle e il codice, senza toolchain di sviluppo;
- **base `node:20-alpine`** (LTS mantenuta) con `apk upgrade` per le patch dei pacchetti di sistema;
- **rimozione di `npm`** dall'immagine finale: non necessario a runtime, elimina le CVE delle sue dipendenze bundlate;
- **utente non root** (`USER node`) e **`tini`** come init di PID 1 (gestione corretta dei segnali);
- **`HEALTHCHECK`** di liveness HTTP.

### 10.2 Orchestrazione hardened (Docker Compose)

`docker-compose.hardened.yml` orchestra due servizi - l'**app** e **MongoDB** - su una **rete bridge dedicata** (`backend`), applicando il principio del privilegio minimo. Verso l'host è pubblicata **una sola porta** (quella dell'app); il database è raggiungibile solo dall'interno della rete.

```
[host] :3000 ──► app ──(rete interna "backend")──► mongodb        (DB non esposto all'host)
```

**Servizio `app`**
- `NODE_ENV=production`, connessione al DB per **nome di servizio** (`mongodb://mongodb:27017/...`), segreti caricati da `.env`;
- avvio **subordinato** allo stato `healthy` di MongoDB (`depends_on: condition: service_healthy`), così non parte prima che il DB sia pronto;
- **healthcheck** applicativo (richiesta HTTP interna sulla porta 3000, ogni 30s);
- hardening: `read_only` + `tmpfs /tmp`, `cap_drop: ALL`, `no-new-privileges`, limiti CPU (1.0) e memoria (512M).

**Servizio `mongodb`**
- immagine ufficiale `mongo:6.0`, **nessuna porta pubblicata** (isolato sulla rete interna);
- **persistenza** su volume Docker dedicato (`dbdata` montato su `/data/db`): i dati sopravvivono al riavvio del container;
- **healthcheck** con `mongosh` (`ping`, ogni 15s) + `no-new-privileges` e limiti CPU (1.0) / memoria (1G).

Aspetti comuni a entrambi i servizi: **`restart: unless-stopped`** (riavvio automatico salvo stop manuale) e **rotazione dei log** (driver `json-file`, max 10 MB × 3 file) per evitare che i log saturino il disco.

Riepilogo delle misure di hardening:

| Misura | Servizio | Descrizione |
|---|---|---|
| DB non esposto | `mongodb` | Nessuna porta verso l'host; raggiungibile solo dalla rete interna `backend` |
| `read_only` + `tmpfs` | `app` | Filesystem root in sola lettura; scritture temporanee solo in RAM (`/tmp`) |
| `cap_drop: ALL` | `app` | Rimozione di tutte le Linux capability (non necessarie all'app) |
| `no-new-privileges` | `app`, `mongodb` | Divieto di escalation dei privilegi |
| Limiti di risorse | `app`, `mongodb` | Tetto su CPU e memoria (mitiga il DoS da esaurimento risorse) |
| Healthcheck + `depends_on` | `app`, `mongodb` | L'app parte solo a DB `healthy`; stato monitorato in continuo |
| Rete dedicata | entrambi | Bridge isolato, comunicazione per nome di servizio |
| Persistenza su volume | `mongodb` | Volume `dbdata`: i dati non si perdono al riavvio |
| Rotazione dei log | entrambi | `json-file` con dimensione e numero massimo di file |

---

## 11. Pipeline CI/CD

Tre workflow GitHub Actions separano nettamente integrazione, sicurezza e rilascio.

### 11.1 Workflow CI (`ci.yml`)

Su ogni push/PR: **lint** (ESLint) e **test** (Jest) eseguiti contro un servizio MongoDB effimero. Garantisce che ogni modifica sia buildabile e non regredisca la suite.

### 11.2 Workflow Security (`security.yml`)

Esegue in parallelo gli strumenti di [8](#8-strumenti-di-sicurezza-automatici) (CodeQL, Snyk, GitGuardian, gitleaks, Trivy, SonarCloud) e la *dependency review* sulle PR. È schedulato anche **settimanalmente** (cron), perché nuovi advisory possono comparire su dipendenze immutate.

### 11.3 Workflow CD (`cd.yml`)

Implementa la pubblicazione **condizionata all'esito dei controlli di sicurezza**:

```
Security (success su master)  ─►  build immagine hardened
        ─►  gate Trivy sull'immagine (HIGH/CRITICAL)
        ─►  push su Docker Hub (:latest, :<sha>)   [solo se il gate passa]
```

Il workflow si attiva tramite `workflow_run` solo quando il workflow *Security* termina con **successo** su `master`. L'immagine viene ricostruita, sottoposta a un **gate Trivy** (`--exit-code 1` su HIGH/CRITICAL): se il gate fallisce, la pubblicazione non avviene. Solo al superamento del gate l'immagine viene pubblicata su Docker Hub con i tag `:latest` e `:<sha>`.

### 11.4 Sicurezza della pipeline

La pipeline stessa è trattata come superficie da proteggere:

- **`permissions` a privilegio minimo** per ogni workflow (`contents: read`; `security-events: write` solo dove serve caricare i risultati SARIF);
- **action con versione fissata** (evita di eseguire tag mobili non controllati);
- **job condizionati alla presenza del segreto** (`if: env.<TOKEN> != ''`): in assenza di credenziali il job viene saltato senza far fallire la pipeline;
- **`HUSKY: 0`** per disabilitare gli hook git in ambiente CI;
- **scansioni schedulate** oltre che su push/PR.

### 11.5 Segreti della pipeline

Configurati in *Settings -> Secrets and variables -> Actions*:

| Segreto | Uso |
|---|---|
| `SNYK_TOKEN` | Autenticazione Snyk |
| `SONAR_TOKEN`, `SONAR_HOST_URL` | SonarCloud |
| `GITGUARDIAN_API_KEY` | GitGuardian |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Pubblicazione dell'immagine |

---

## 12. Esecuzione locale

### 12.1 Requisiti

- Docker e Docker Compose.

### 12.2 Avvio con Docker Compose

```bash
# 1. Creare il file .env dai valori di esempio
cp .env.example .env
#    e impostare un JWT_SECRET di almeno 32 caratteri

# 2. Avviare lo stack hardened (app + MongoDB)
docker compose -f docker-compose.hardened.yml up -d --build
```

L'API risponde su `http://localhost:3000/v1`. La documentazione OpenAPI (`/v1/docs`) è disponibile in ambiente di sviluppo.

### 12.3 Test

La suite si esegue in un container Node con un MongoDB effimero (nessuna installazione sull'host); la stessa esecuzione avviene automaticamente nel workflow CI a ogni push:

```bash
docker run --rm -e NODE_ENV=test \
  -e MONGODB_URL=mongodb://<mongo-host>:27017/node-boilerplate \
  -e JWT_SECRET=<segreto_di_almeno_32_caratteri> \
  -v "$PWD:/app" -w /app node:16-alpine yarn test
```

### 12.4 Uso dell'immagine pubblicata

In alternativa alla build locale si può usare l'immagine già scansionata e pubblicata dal workflow CD su Docker Hub:

```bash
docker pull amodiomerone/node-express-boilerplate:latest
```

Nel file `docker-compose.hardened.yml` è predisposta la riga (commentata) per usare questa immagine al posto della build locale.

---

## 13. Riferimenti

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE - Common Weakness Enumeration](https://cwe.mitre.org/)
- [CodeQL](https://codeql.github.com/) · [Snyk](https://docs.snyk.io/) · [Trivy](https://trivy.dev/) · [SonarCloud](https://docs.sonarsource.com/) · [GitGuardian](https://docs.gitguardian.com/) · [gitleaks](https://github.com/gitleaks/gitleaks)
- Progetto di partenza: [hagopj13/node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate)

