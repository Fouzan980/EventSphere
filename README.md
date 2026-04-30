<div align="center">

<img src="https://img.shields.io/badge/EventSphere-Pakistan's%20%231%20Event%20Platform-FF2A5F?style=for-the-badge&logo=ticketmaster&logoColor=white" alt="EventSphere Banner" />

<h1>🎪 EventSphere</h1>

<p><strong>Pakistan's premier full-stack event discovery & ticketing platform</strong><br/>
Discover concerts, expos, workshops, and corporate events. Book in seconds.</p>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-FF2A5F?style=for-the-badge)](https://eventsphere.vercel.app)
[![Patreon](https://img.shields.io/badge/❤️_Support_on-Patreon-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/FouzanDev)
[![GitHub Stars](https://img.shields.io/github/stars/FouzanDev/eventsphere?style=for-the-badge&color=FFD700)](https://github.com/FouzanDev/eventsphere/stargazers)
[![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge)](LICENSE)

<br/>

<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" />
<img src="https://img.shields.io/badge/Framer_Motion-Animated-FF0055?style=flat-square&logo=framer" />
<img src="https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite" />

</div>

---

## ✨ Features

### 🎭 For Attendees
- 🔍 **Smart Search** — Search events by title, artist, city, or category
- 🗺️ **Interactive Map** — Find events with a live Leaflet.js map
- 🎫 **Instant Booking** — Book tickets in under 60 seconds
- 📅 **My Tickets** — View upcoming & past bookings in a sidebar panel
- 👤 **Profile Management** — Avatar upload, name, phone, password change
- 📧 **Email Confirmations** — Booking and reminder emails via Gmail SMTP

### 🏢 For Organizers
- 🚀 **Event Management** — Create, edit, and delete events with full controls
- 🖼️ **Dual Image Upload** — Separate card poster & wide hero banner per event
- 🎤 **Speaker & Artist Directory** — Auto-fetch profiles from Spotify & Wikipedia
- 📍 **Location Pinning** — Google Maps reverse geocoding + Leaflet pin drop
- 📊 **Analytics Dashboard** — Ticket sales, attendee counts, revenue tracking
- 🗓️ **Session Scheduling** — Multi-session schedule builder per event
- 🎟️ **Tiered Ticketing** — Standard, VIP, Backstage, Early Bird with sold-out flags

### 🛡️ For Admins
- 👥 **User Management** — View all users, exhibitors, verification requests
- ⚙️ **Global Settings** — Control banner messages, featured events
- 🏛️ **Exhibitor Directory** — Manage and verify exhibitor profiles
- 📨 **Application Tracking** — Review organizer & exhibitor applications

### 🌐 Platform-Wide
- 🌙 **Dark / Light Mode** — Full theme support across all pages
- 📱 **Fully Responsive** — Mobile-first with animated hamburger menu
- ⭐ **Featured Events** — Hero carousel on homepage with auto-sliding
- 🔥 **Trending Now** — Horizontal scroll strip of popular events
- 🤝 **Partner Marquee** — Auto-scrolling partner logos section
- 🇵🇸 **Palestine Solidarity** — Standing in solidarity ❤️

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite |
| **Styling** | Vanilla CSS + CSS Variables (dark/light theme) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose (Atlas) |
| **Auth** | JWT (JSON Web Tokens) |
| **Email** | Nodemailer + Gmail SMTP |
| **Maps** | Leaflet.js + Google Maps Geocoding API |
| **Artist Search** | Spotify Web API + Wikipedia REST API |
| **Scheduling** | node-cron (event reminders) |
| **Toast Alerts** | React Toastify |

---

## 📁 Project Structure

```
eventsphere/
├── 📂 client/                  # React Frontend (Vite)
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   └── 📂 layout/
│   │   │       ├── PublicNavbar.jsx    # Main nav with mobile menu
│   │   │       ├── Sidebar.jsx         # Dashboard sidebar
│   │   │       └── Topbar.jsx          # Dashboard topbar
│   │   ├── 📂 context/
│   │   │   ├── AuthContext.jsx         # Auth state & JWT
│   │   │   └── ThemeContext.jsx        # Dark/light mode
│   │   ├── 📂 pages/
│   │   │   ├── Home.jsx                # Landing page + carousel
│   │   │   ├── Events.jsx              # Event management (Organizer)
│   │   │   ├── Dashboard.jsx           # Admin/Organizer dashboard
│   │   │   ├── Profile.jsx             # User profile page
│   │   │   ├── ExhibitorDirectory.jsx  # Public exhibitor listing
│   │   │   ├── Orders.jsx              # Order management
│   │   │   ├── UserManagement.jsx      # Admin user management
│   │   │   └── ...
│   │   └── 📂 utils/
│   │       └── api.js                  # Axios instance
├── 📂 models/                  # Mongoose Schemas
│   ├── User.js
│   ├── Event.js
│   ├── Ticket.js
│   ├── Speaker.js
│   └── Setting.js
├── 📂 routes/                  # Express API Routes
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── ticketRoutes.js
│   ├── userRoutes.js
│   └── settingRoutes.js
├── 📂 middleware/
│   └── authMiddleware.js
├── 📂 utils/
│   ├── sendEmail.js
│   └── emailTemplates.js
├── 📂 cron/
│   └── eventReminders.js       # Automated reminder emails
├── .env.example                # Environment template
├── .gitignore
└── server.js                   # Express entry point
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Gmail account with App Password enabled

### 1. Clone the repository
```bash
git clone https://github.com/Fouzan980/eventsphere.git
cd eventsphere
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Fill in your values in `.env`:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/eventsphere
JWT_SECRET=your_super_secret_key
PORT=5000
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_app_password
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. Install dependencies
```bash
# Backend
npm install

# Frontend
cd client && npm install
```

### 4. Run development servers
```bash
# From project root — starts both backend and frontend
npm run dev
```

Frontend → `http://localhost:5173`  
Backend API → `http://localhost:5000`

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `PORT` | Backend server port (default: 5000) | ✅ |
| `EMAIL_USER` | Gmail address for sending emails | ✅ |
| `EMAIL_PASS` | Gmail App Password (16 chars) | ✅ |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API (geocoding) | ⚠️ Optional |
| `SPOTIFY_CLIENT_ID` | Spotify API for artist search | ⚠️ Optional |
| `SPOTIFY_CLIENT_SECRET` | Spotify API secret | ⚠️ Optional |

---

## 🚀 Deployment

### Frontend → Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Set Root Directory: `client`
3. Build Command: `npm run build`
4. Add `VITE_API_URL` pointing to your backend

### Backend → Render
1. Create new Web Service on [render.com](https://render.com)
2. Start Command: `node server.js`
3. Add all `.env` variables in the Render dashboard

### Keep Cron Jobs Alive (Free)
Use [cron-job.org](https://cron-job.org) to ping your backend every 10 minutes and prevent Render's free tier from sleeping.

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Attendee** | Browse events, book tickets, view schedule, manage profile |
| **Organizer** | All attendee features + create/edit/delete own events, manage speakers |
| **Exhibitor** | Browse events, manage exhibitor profile |
| **Admin** | Full platform control — users, events, applications, settings |

---

## 📸 Screenshots

> Coming soon — live demo available at the link above.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## ❤️ Support the Project

If EventSphere has been useful to you, consider supporting its development!

<div align="center">

[![Support on Patreon](https://img.shields.io/badge/❤️_Become_a_Patron-FF424D?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/FouzanDev)

*Every contribution helps keep this project alive and growing.*

</div>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Fouzan Uddin**

[![GitHub](https://img.shields.io/badge/GitHub-FouzanDev-181717?style=flat-square&logo=github)](https://github.com/FouzanDev)
[![Patreon](https://img.shields.io/badge/Patreon-FouzanDev-FF424D?style=flat-square&logo=patreon)](https://patreon.com/FouzanDev)

*Built with ❤️ in Pakistan 🇵🇰*

🇵🇸 *We stand in solidarity with the people of Palestine — Free Palestine* 🕊️

</div>
