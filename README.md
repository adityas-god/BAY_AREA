# BAY AREA™ — SOP Hub for GreyOrange

> **Operations Hub for GreyOrange teams, categories, and standard operating procedures (SOPs).**
> Features an interactive 2.5D Isometric Campus Town view ("Village") alongside a structured Document Directory view ("Website").

---

## 🛠️ Architecture

- **Frontend**: React 19 + TypeScript + Vite + TanStack Router
- **Visualization**: 2.5D Isometric Clash-of-Clans styled SVG campus engine with directional shadows, AMR guidance tracks, and holographic telemetry
- **Styling**: Tailwind CSS + Custom Industrial Matte Orange theme tokens (`#D9531E`, `#EA580C`)
- **Web Server**: Production Nginx container with SPA routing, gzip compression, security headers, and health checks
- **Deployment**: Docker & Docker Compose multi-stage build

---

## 🚀 Quick Start for VM Deployment

```bash
# 1. Clone repository
git clone <YOUR_GIT_REPO_URL> bay-area
cd bay-area

# 2. Make deployment script executable and run
chmod +x deploy.sh
./deploy.sh
```

For complete VM setup instructions (firewalls, SSL/HTTPS, port configuration, systemd auto-restart), see **[DEPLOY_VM.md](file:///c:/Users/aditya.s.ctr/Downloads/BAY%20AREA/DEPLOY_VM.md)**.

---

## 💻 Local Development

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.
