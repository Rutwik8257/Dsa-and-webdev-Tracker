# DSA + WebDev Tracker — Backend

A tiny Express API that stores your tracker's data as one JSON document in MongoDB.
Your data lives in your own database — this server just reads/writes it.

## 1. Get a MongoDB database (free)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free (M0) cluster.
3. Under **Database Access**, create a database user with a username + password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — simplest for a personal project.
5. Click **Connect -> Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
   Add a database name before the `?`, e.g. `.../dsa_tracker?retryWrites=true...`

Keep this string private — do not paste it into any chat, commit it to a public repo, or put it in frontend code.

## 2. Deploy the server (Render — free tier, ~5 minutes)

1. Push this `tracker-backend` folder to a GitHub repo (can be private).
2. Go to https://render.com, sign up, click **New -> Web Service**, connect the repo.
3. Settings:
   - Build command: `npm install`
   - Start command: `npm start`
4. Under **Environment**, add:
   - `MONGODB_URI` = the connection string from step 1
   - `API_KEY` = a long random string you make up (this protects your data — anyone with your server URL + this key can read/write your tracker, so treat it like a password). Generate one with:
     ```
     node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
     ```
5. Deploy. Render gives you a URL like `https://your-app.onrender.com`.
6. Confirm it's alive: open `https://your-app.onrender.com/health` in a browser — you should see `{"ok":true,...}`.

(Railway, Fly.io, or any Node host work the same way — just set the same two env vars.)

## 3. Point the frontend at it

Open `dsa-webdev-tracker.html` in a text editor, find the `CONFIG` block near the top of the `<script>` section, and fill in:

```js
const CONFIG = {
  API_BASE_URL: "https://your-app.onrender.com",
  API_KEY: "the-same-random-string-you-set-on-render"
};
```

Save the file. The app will now read/write directly to your MongoDB via this API — no reliance on Claude's storage at all.

## Notes

- The whole tracker state (topics, problems, logs, everything) is stored as **one document** — simple and good enough for single-user personal use. If you ever want multi-collection structure or multiple users, this is the place to extend.
- The API key lives in plain text inside the frontend HTML file since it's a static file with no server-side secret storage. That's an acceptable tradeoff for a personal tool only you use, but don't publish that HTML file publicly with your real key in it.
- Free-tier hosts (Render included) may "sleep" after inactivity and take a few seconds to wake on the next request — the app already retries failed requests, so this just means the first save/load of the day might take a moment longer.
