# Deployment Guide – Excelidraw Turborepo (Hinglish)

Yeh guide tumhe step-by-step batayegi ki is Turborepo project ko kaise deploy karna hai. Tum **teen cheezein** deploy karoge: database (jo tumhare paas pehle se Supabase par hai), do backends (Render par), aur ek Next.js frontend (Vercel par).

---

## Tumhara stack – yeh sahi hai

| Part | Kya hai | Kahan deploy karoge |
|------|---------|---------------------|
| **Database** | PostgreSQL (Supabase) | Supabase – tumne pehle hi project bana rakha hai, URL mil gaya |
| **http-backend** | Express REST API (signup, signin, rooms, chats) | Render |
| **ws-backend** | WebSocket server (real-time canvas + chat) | Render (alag service) |
| **excelidraw-project** | Main Next.js app (whiteboard UI) | Vercel |

**Yeh combination accha hai:** Supabase free tier achha hai, Render par do alag services easily bana sakte ho, aur Vercel Next.js ke liye best hai. Sirf ek hi frontend (excelidraw-project) deploy karenge, dusra “web” app nahi.

---

## Env variables ka flow (DATABASE_URL, DIRECT_URL, JWT_SECRET)

### Dono DB URLs (DATABASE_URL + DIRECT_URL) kyun?

- **DATABASE_URL** – Yeh **runtime** par use hota hai. Jab http-backend ya ws-backend chal raha hota hai, `@repo/db` isi se Supabase se connect hota hai. **Render par dono backends ke Environment Variables mein yeh zaroor daalo.**
- **DIRECT_URL** – Yeh Prisma **migrations** ke liye use hota hai (e.g. `prisma migrate deploy`). Deployed backends sirf DATABASE_URL se query karte hain. Lekin agar kabhi build/migrate Render par chalaye ya same env use ho, toh **DIRECT_URL bhi daal do** – Supabase mein generally **Connection string** (pooled) = DATABASE_URL, **Direct connection** (port 5432) = DIRECT_URL. Dono daalne se koi problem nahi, aur consistency rahti hai.

**Render par (http-backend + ws-backend dono ke liye):**  
`DATABASE_URL` = Supabase connection string (pooled, port 6543)  
`DIRECT_URL` = Supabase direct connection string (port 5432) – optional for runtime, but add if you have it.

### JWT_SECRET – code mein nahi, env se kaise aata hai?

- **http-backend** aur **ws-backend** dono `JWT_SECRET` ko **import** karte hain: `import { JWT_SECRET } from "@repo/backend-common/config"`.
- **@repo/backend-common** ke andar (`packages/backend-common/src/index.ts`) sirf yeh hai:  
  `export const JWT_SECRET = process.env.JWT_SECRET || "123123"`  
  Matlab **runtime** par yeh value **process.env** se aati hai.
- **Render par** jab tum **Environment Variables** mein `JWT_SECRET` add karte ho, Render har request se pehle Node process ko yeh env vars inject kar deta hai. Toh jab `index.ts` run hota hai aur `@repo/backend-common/config` se `JWT_SECRET` import karta hai, tab tak `process.env.JWT_SECRET` set ho chuka hota hai.
- **Good practice:** JWT kabhi code mein hardcode mat karo. Sirf env mein set karo (Render/Vercel dashboard). Code already sahi hai – bas Render par `JWT_SECRET` env variable daalna hai; koi code change nahi.

**Short flow:**  
Render env (JWT_SECRET) → Node `process.env` → backend-common read karta hai → http-backend/ws-backend import karte hain → use hota hai sign/verify mein.

---

## Poora deployment flow (ek nazar mein)

1. **Supabase** – DB pehle se hai; sirf **DATABASE_URL** (aur agar use karte ho toh **DIRECT_URL**) copy karo.
2. **Render – http-backend**  
   - Repo connect karo, Root Directory = `apps/http-backend`, build/start commands set karo.  
   - Env: `DATABASE_URL`, `DIRECT_URL` (optional but recommended), `JWT_SECRET`.  
   - Deploy → URL milta hai (e.g. `https://excelidraw-http-backend.onrender.com`).
3. **Render – ws-backend**  
   - Naya Web Service, same repo, Root Directory = `apps/ws-backend`.  
   - Same env: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (dono backends ka JWT_SECRET same hona chahiye).  
   - Deploy → WebSocket URL (isko **wss://...** se use karenge).
4. **Vercel – excelidraw-project**  
   - Repo connect, Root = `apps/excelidraw-project`, build command monorepo hisaab se.  
   - Env: `NEXT_PUBLIC_HTTP_BACKEND` = http-backend URL, `NEXT_PUBLIC_WS_BACKEND` = wss URL.  
   - Deploy → frontend live.

Dekho: **database** Supabase par already hai; **backend** 2 baar (2 services), **frontend** 1 baar deploy. Sab env vars platform ke dashboard par set hote hain – code mein secret mat daalo.

---

## "Whole monorepo ek saath deploy" – possible?

- **Ek hi platform par sab (DB + backends + frontend) ek button se:** Aisa koi single platform nahi jo tumhare stack (Next.js + Express + WebSocket + Postgres) ko ek "single deploy" mein run kare. DB alag (Supabase), server alag (Render), frontend alag (Vercel) – yeh separation normal hai.
- **Ek repo, ek push – sab update:** Haan, yeh possible hai. Render par **2 services** (http-backend, ws-backend) aur Vercel par **1 project** (excelidraw-project) sab **same GitHub repo** se connect karo. Jab tum `git push` karoge, Render dono services ko rebuild kar sakta hai (auto-deploy on), aur Vercel bhi naya deploy kar sakta hai. Toh **one push → three deploys** (2 Render + 1 Vercel) – monorepo ek saath update ho jata hai.
- **Alternative:** **Railway** bhi use kar sakte ho – ek hi project mein multiple services (http-backend, ws-backend) add kar sakte ho, same repo se. Phir bhi frontend ke liye Vercel alag rahega. So "whole monorepo at once" matlab: **one repo, one push, sab platforms auto-deploy** – yeh flow tum abhi bhi use kar sakte ho (Render + Vercel dono GitHub se connected).

---

## Deployment ka order (is order mein karo)

1. **Database** – Supabase URL confirm karo, phir migrations chalao (tables bane)
2. **http-backend** – Render par Express API deploy karo
3. **ws-backend** – Render par WebSocket server deploy karo
4. **excelidraw-project** – Vercel par Next.js app deploy karo, API + WebSocket URLs set karo

---

## Step 1: Database – Supabase (tumhara pehle se bana hua project)

**Agar tumhara Supabase pehle se connected hai aur tables (User, Room, Chat) mein data aa raha hai** – matlab DB **already deployed** hai. Sirf **DATABASE_URL** copy karke Render backends ke env vars mein daalna hai (Step 2 & 3). Migration dubara chalaane ki zarurat nahi. Neeche 1.1 se URL lena hai, 1.2 skip kar sakte ho.

### 1.1 Supabase se connection string lo

Tumne jab app banate waqt Supabase par project bana liya tha. Ab bas **DATABASE_URL** copy karna hai.

1. [Supabase](https://supabase.com) par login karo.
2. Apna project open karo (jo tumne pehle banaya tha).
3. Left side **Project Settings** (gear icon) par jao.
4. **Database** section mein jao.
5. Neeche **Connection string** dikhega. **URI** wala option select karo.
6. Jo string dikhegi (e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`) – yeh copy karo. Agar password placeholder hai toh apna database password paste karo.
7. Yeh hi tumhara **DATABASE_URL** hai. Isko safe rakho – abhi backend deploy karte waqt use karenge.

**Note:** Supabase **Connection pooling** wala URL use karo (port 6543) – production ke liye better hai. Direct connection (port 5432) bhi chalega.

### 1.2 Migrations chalao (production DB mein tables banao)

Ab production database mein bhi wahi tables chahiye jo local par hain (User, Room, Chat). Iske liye **ek baar** Prisma migrations run karna padega.

**Apne computer se (easiest):**

```bash
# Monorepo root par jao
cd my-turborepo

# DATABASE_URL set karo (Supabase wala URL paste karo)
# PowerShell (Windows):
$env:DATABASE_URL = "postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Mac/Linux:
# export DATABASE_URL="postgresql://..."

# packages/db mein jao aur migrations chalao
cd packages/db
pnpm exec prisma migrate deploy
```

Agar pehle kabhi `prisma migrate` nahi chalaaya, pehle local par ek migration bana lo, phir `migrate deploy` se production par apply ho jayega. Iske baad Supabase par tables (User, Room, Chat) aa jayengi.

---

## Step 2: http-backend – Render par deploy karo

### 2.1 Render par naya Web Service banao

1. [render.com](https://render.com) par sign up / login karo.
2. **Dashboard** se **New +** → **Web Service** par click karo.
3. GitHub connect karo (agar pehle se nahi hai) aur **is repo** ko connect karo.
4. **Repository** select karo (Excelidraw wala).
5. Settings yeh rakhna:

| Field | Value |
|-------|--------|
| **Name** | `excelidraw-http-backend` (ya kuch bhi naam) |
| **Region** | Singapore ya apne paas wala |
| **Root Directory** | `apps/http-backend` |
| **Runtime** | Node |
| **Build Command** | `cd ../.. && pnpm install && pnpm --filter @repo/db build && pnpm --filter http-backend build` |
| **Start Command** | `node dist/index.js` |

6. **Advanced** mein jao. **Working Directory** empty chhod sakte ho; start command `apps/http-backend` se run hoga agar Root Directory sahi hai.

### 2.2 Environment variables daalo (http-backend)

Render par same service ki **Environment** tab mein jao. **Add Environment Variable** se yeh add karo:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Supabase wala connection string (Step 1.1 se – pooled, port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432) – agar tumhare paas hai toh daalo, optional for runtime |
| `JWT_SECRET` | Koi bhi lambi random string (e.g. `mySecretKey123!@#xyz` ya [randomkeygen.com](https://randomkeygen.com) se generate karo) |

**Important:** `JWT_SECRET` dono backends (http + ws) mein **same** hona chahiye, warna auth nahi chalega.

Save karo, phir **Manual Deploy** → **Deploy latest commit** se deploy chalao.

### 2.3 Public URL copy karo

Deploy complete hone ke baad **top par** service ka URL dikhega (e.g. `https://excelidraw-http-backend.onrender.com`). Isko copy karo – frontend mein **HTTP_BACKEND** ki jagah yeh use karenge.

**Note:** Render free tier par service thodi der inactive rehne par sleep ho jati hai; pehla request slow aa sakta hai (cold start).

---

## Step 3: ws-backend – Render par doosri service banao

### 3.1 Render par dusra Web Service (WebSocket ke liye)

1. Render dashboard par **New +** → **Web Service** phir se.
2. **Same GitHub repo** select karo.
3. Settings yeh rakhna:

| Field | Value |
|-------|--------|
| **Name** | `excelidraw-ws-backend` |
| **Root Directory** | `apps/ws-backend` |
| **Build Command** | `cd ../.. && pnpm install && pnpm --filter @repo/db build && pnpm --filter ws-backend build` |
| **Start Command** | `node dist/index.js` |

### 3.2 Environment variables (ws-backend)

**Same** values jo http-backend mein dali thi:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Wahi Supabase URL |
| `DIRECT_URL` | Wahi DIRECT_URL (agar http-backend mein dala tha) |
| `JWT_SECRET` | Wahi JWT_SECRET (http-backend jaisa – dono same hona zaroori) |

### 3.3 WebSocket URL (WSS) copy karo

Deploy ke baad jo URL milega (e.g. `https://excelidraw-ws-backend.onrender.com`), frontend mein **WebSocket** ke liye **wss://** use karna hai:

- `https://...` → **`wss://excelidraw-ws-backend.onrender.com`** (https ko wss se replace)

Yeh URL frontend mein **NEXT_PUBLIC_WS_BACKEND** (ya jo variable ho) mein daalna hai.

---

## Step 4: excelidraw-project – Vercel par frontend deploy karo

### 4.1 Vercel par project banao

1. [vercel.com](https://vercel.com) par sign up / login karo (GitHub se easy hai).
2. **Add New** → **Project**.
3. GitHub repo select karo (Excelidraw wala).
4. **Configure Project** par:

| Field | Value |
|-------|--------|
| **Framework Preset** | Next.js (auto detect ho sakta hai) |
| **Root Directory** | **Edit** karke `apps/excelidraw-project` select karo (sirf is app ko build karna hai) |
| **Build Command** | `cd ../.. && pnpm install && pnpm --filter excelidraw-project build` (ya override karke yeh daalo) |
| **Output Directory** | Next.js default (`.next`) – usually change nahi karna |

5. **Deploy** click karo. Pehli baar build ho sakta hai thoda time le; agar build fail ho toh Root Directory aur Build Command check karo (monorepo ke liye root se pnpm run karna padta hai).

### 4.2 Frontend ko production backends se jodna

Abhi app local URLs use karti hai. Production mein **deployed** API aur WebSocket URLs use karne hain.

1. Vercel project open karo → **Settings** → **Environment Variables**.
2. Ye **two variables** add karo (Production, Preview, Development sab ke liye daal sakte ho):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_HTTP_BACKEND` | http-backend ka URL (e.g. `https://excelidraw-http-backend.onrender.com`) |
| `NEXT_PUBLIC_WS_BACKEND` | ws-backend ka **wss** URL (e.g. `wss://excelidraw-ws-backend.onrender.com`) |

3. **excelidraw-project** ke andar `config.ts` (ya jahan URLs hain) ko update karna padega taaki ye env vars use hon. Agar abhi hardcoded `localhost` hai toh wahan:
   - `process.env.NEXT_PUBLIC_HTTP_BACKEND || "http://localhost:3005"`
   - `process.env.NEXT_PUBLIC_WS_BACKEND || "ws://localhost:8080"`
   daal do – local par bhi chalega, production par Vercel ki env use hogi.

Save karke **Redeploy** karo (Deployments → ... → Redeploy).

### 4.3 CORS (agar error aaye)

Agar frontend (Vercel) se API call par CORS error aaye, toh **http-backend** (Render) mein CORS allow karna padega. Express app mein jahan `cors()` use ho raha hai, wahan origin add karo:

```js
app.use(cors({
  origin: [
    "https://your-app.vercel.app",   // Vercel par jo URL aaya
    "http://localhost:3002"
  ]
}));
```

Phir http-backend ko Render par redeploy karo.

---

## Checklist – go live se pehle

- [ ] Supabase se **DATABASE_URL** copy kiya. (Agar tables pehle se hain aur data aa raha hai toh **prisma migrate deploy** skip kar sakte ho; warna ek baar `packages/db` se chala do.)
- [ ] **http-backend** Render par deploy ho gaya, **DATABASE_URL** aur **JWT_SECRET** set kiye, URL copy kiya.
- [ ] **ws-backend** Render par deploy ho gaya, same env vars, **wss://** wala URL copy kiya.
- [ ] **excelidraw-project** Vercel par deploy ho gaya, **NEXT_PUBLIC_HTTP_BACKEND** aur **NEXT_PUBLIC_WS_BACKEND** set kiye (aur config.ts env se read kare).
- [ ] CORS (agar zarurat ho) http-backend mein add kiya.
- [ ] Browser mein deployed site khol ke test kiya: sign up, sign in, room banao, draw karo – sab kaam karna chahiye.

---

## Quick reference – env vars (tumhare stack ke hisaab se)

| Kahan | Variables |
|-------|-----------|
| **Supabase** | Sirf URL copy – **DATABASE_URL** (connection string) |
| **http-backend (Render)** | `DATABASE_URL`, `DIRECT_URL` (optional), `JWT_SECRET` |
| **ws-backend (Render)** | `DATABASE_URL`, `DIRECT_URL` (optional), `JWT_SECRET` (same as http-backend) |
| **excelidraw-project (Vercel)** | `NEXT_PUBLIC_HTTP_BACKEND`, `NEXT_PUBLIC_WS_BACKEND` |

---

## Chhota summary

1. **DB** – Supabase URL hai, migrations chala do (Step 1).
2. **Backends** – Render par do alag Web Services: ek http-backend, ek ws-backend; dono ko same **DATABASE_URL** aur **JWT_SECRET** do.
3. **Frontend** – Vercel par sirf **excelidraw-project**; Root Directory `apps/excelidraw-project`, env vars mein production API + WebSocket URLs do.

Agar kisi step par atak jao toh error message ya screenshot bhejo, us hisaab se exact command ya setting bata sakte hain.
