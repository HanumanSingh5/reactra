# Reactra — Internal College Reactra

A Next.js + Firebase web app for running a physical, two-round college
hackathon: announcements, team registration, round progression, evaluator
scoring, results, and seating — all in one place.

This project **builds successfully** (verified with `npm run build`, zero
TypeScript errors, zero lint errors) — you just need to plug in your own
Firebase project before it can actually read/write data.

---

## 1. Create a Firebase project

1. Go to **https://console.firebase.google.com** → **Add project**
2. Once created, click the **web icon (`</>`)** to register a web app
3. Copy the `firebaseConfig` object it gives you

### Enable the services this app uses:
- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → Create database → start in **production mode**
- **Storage** → Get started (for PPT/documentation uploads)

---

## 2. Plug in your config

Open **`src/lib/firebase.ts`** and replace the placeholder values with the
config you copied in Step 1:

```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

---

## 3. Install and run locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

---

## 4. Deploy security rules

This project includes `firestore.rules` and `storage.rules` that enforce
role-based access (students can only edit their own team, only evaluators
can submit scores, only admins can post announcements/manage seating, etc).

Install the Firebase CLI once:
```bash
npm install -g firebase-tools
firebase login
firebase init
```
When `firebase init` asks, select **Firestore** and **Storage**, and point
it at the `firestore.rules` / `storage.rules` files already in this project
(don't let it overwrite them).

Then deploy:
```bash
firebase deploy --only firestore:rules,storage:rules
```

**Important:** Until you deploy these rules, Firestore/Storage will use
whatever default rules your project started with — for testing that's fine,
but do this before anyone outside your team uses the real app.

---

## 5. How roles work

Every new signup automatically becomes a **student**. There is deliberately
no public "sign up as admin/evaluator" option — that would let anyone grant
themselves admin access.

To promote someone to **admin** or **evaluator**:
1. Have them sign up normally on the site (`/signup`)
2. Go to **Firebase Console → Firestore Database → `users` collection**
3. Find their document (by their email or uid)
4. Change the `role` field from `"student"` to `"admin"` or `"evaluator"`
5. They may need to log out and back in for the change to take effect

---

## 6. How the app is organized

| Route | Who can access | What it does |
|---|---|---|
| `/` | Everyone | Announcements feed |
| `/about` | Everyone | Static event info + scoring criteria |
| `/login`, `/signup` | Everyone | Auth |
| `/team` | Students | Register team, add members, upload PPT/documentation, view round status |
| `/results` | Students | View team's scores (once admin publishes results) |
| `/seating` | Students | View team's assigned room/table |
| `/evaluate` | Evaluators | Score teams per round against the fixed criteria |
| `/admin` | Admin | Post announcements, toggle Round 2/results visibility, mark teams qualified/eliminated, assign seating |

### Data model (Firestore collections)
- **`users`** — `{ name, email, role }`
- **`teams`** — `{ teamName, members[], createdBy, round1Status, pptUrl, docUrl, createdAt }`
- **`announcements`** — `{ title, message, postedBy, createdAt }`
- **`scores`** — `{ teamId, evaluatorId, evaluatorName, round, frontend, presentation, documentation, total, comments, createdAt }`
- **`eventConfig/config`** — single doc: `{ round2Visible, resultsVisible }`
- **`seating`** — `{ teamId, teamName, room, tableNumber }`

If multiple evaluators score the same team, the Results page automatically
**averages** their scores per criterion.

---

## 7. Deploy the live site

The easiest path is **Vercel** (made by the same team as Next.js):
1. Push this project to a GitHub repo
2. Go to **https://vercel.com** → New Project → import the repo
3. Add your Firebase config as environment variables if you prefer not to
   hardcode it in `firebase.ts` (optional — hardcoding is fine for an
   internal college tool, just don't commit real API keys to a public repo)
4. Deploy — Vercel gives you a live URL immediately

---

## 8. Known simplifications (intentional, for a first working version)

- **One person registers the whole team** — there's no "join by invite code"
  flow yet. All member details are entered by whoever creates the team.
- **Round 1 qualification is set manually by the admin** — not
  auto-calculated from scores. This is deliberate: promoting a team to the
  next round is usually a judgment call, not a pure cutoff.
- **File uploads accept PDF/PPT/DOC formats** but there's no file-size limit
  enforced in the UI yet (Firebase Storage will still cap it project-wide).
- **No email notifications** — students find out about announcements/results
  by visiting the site, not via email.

Happy to build any of these out further.
