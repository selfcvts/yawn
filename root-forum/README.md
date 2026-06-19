# ROOT● Forum — rot.dpdns.org

A dark-aesthetic community forum with looksmaxxing, style, and general culture categories.

## Quick Start

```bash
bash setup.sh
```

One command. Installs everything, builds the frontend, starts the server on port 3001.

**Requirements:** Node.js v18+

---

## Owner Account
- **Username:** `triste`
- **Password:** `333...333`
- Role: OWNER with 👑 badge and full admin access

## Admin Account (backup)
- **Username:** `admin`
- **Password:** `root_admin_2024`

---

## Features

### Categories
| Section | Categories |
|---|---|
| 📌 Official | 📢 News (admin-only), ⭐ Best of the Best (mod-curated) |
| 💎 Looksmaxxing | Looksmaxxing, Looksmaxxing Questions, Rate Me |
| 💬 General | Off Topic, Different Languages |

### Rep System (copied from looksmaxxing.com)
| Reaction | Rep Value |
|---|---|
| ✅ Agree | +1 |
| ❌ Disagree | -1 |
| 😂 Funny | +1 |
| 📚 Informative | +2 |
| 🏆 Winner | +3 |
| 🎨 Creative | +1 |
| ⏰ Late | 0 |
| 🧩 Autistic | -1 |
| 💀 Retarded | -1 |
| 🤡 Cope | -1 |
| 👍 Like | +1 |
| 👎 Dislike | -1 |
| ⚡ **MEGA REP** | **+10** |
| 💀 **MEGA DISLIKE** | **-10** |

- Users: 20 reactions/day limit
- Admins/Owners: unlimited
- Rep donations: once per day (users), unlimited (admins)

### Text Formatting
- **150 Google Fonts** — searchable picker in composer
- **Font sizes** — 10px to 64px
- **Custom text colors** — color picker
- **Gradient text colorizer** — like stuffbydavid.com with 10 presets (Fire, Ocean, Void, Blood, Matrix, Gold, Sunset, Neon, Arctic, Lava) + custom color stops

### Emojis
- **1800+ built-in emojis** in 11 categories (Smileys, Gestures, Hearts, Symbols, Food, Travel, Tech, Animals, Dark, Fitness, Grooming)
- **Custom emoji upload** — admins can add custom :name: emojis

### Profiles
- Avatar upload (image)
- Banner upload (image)
- Profile music upload (audio file — plays on profile visit)
- Bio text
- Custom profile accent color
- Rep donation from other users

### Admin Tools (triste / admin panel at /admin)
- Ban / unban users
- Mute / unmute users (with duration)
- Set custom badges (any text/emoji + color)
- Set user roles (member → mod → admin → owner)
- Give / remove rep
- Feature threads in "Best of the Best"
- Upload / remove custom emojis
- View leaderboard

---

## Deployment on DigitalOcean (rot.dpdns.org)

1. SSH into your droplet
2. `git clone https://github.com/selfcvts/root && cd root`
3. `bash setup.sh`
4. For persistent hosting, use PM2:
   ```bash
   npm install -g pm2
   cd server && pm2 start index.js --name root-forum
   pm2 save && pm2 startup
   ```
5. Set up nginx reverse proxy to port 3001
6. Add SSL with certbot

### Nginx config example:
```nginx
server {
    server_name rot.dpdns.org;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    client_max_body_size 25M;
}
```

---

## File Structure
```
root/
├── setup.sh          ← Run this
├── server/
│   ├── index.js      ← Express + SQLite API
│   ├── package.json
│   └── data/         ← SQLite DB (auto-created)
│       └── root.db
└── client/
    ├── package.json
    └── src/
        ├── App.js
        ├── context/AuthContext.js
        ├── components/
        │   ├── Navbar.js
        │   ├── FontPicker.js      ← 150 fonts
        │   ├── TextColorizer.js   ← Gradient text
        │   ├── EmojiPicker.js     ← 1800+ emojis
        │   ├── ReactionBar.js     ← Rep reactions
        │   ├── PostComposer.js    ← Rich post editor
        │   └── UserCard.js
        └── pages/
            ├── Home.js
            ├── Auth.js
            ├── CategoryPage.js
            ├── ThreadPage.js
            ├── ProfilePage.js
            ├── AdminPanel.js
            ├── Leaderboard.js
            ├── ThreadsList.js
            └── CategoriesPage.js
```

Data is stored in `server/data/root.db` (SQLite). Back this file up to preserve all users, posts, and rep.
