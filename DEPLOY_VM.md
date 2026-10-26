# 🚀 BAY AREA™ SOP Hub for GreyOrange — CI/CD & VM Deployment Guide

> **Repository**: [https://github.com/adityas-god/BAY_AREA.git](https://github.com/adityas-god/BAY_AREA.git)  
> **Unified Architecture**: Both the 3D Village Campus and the complete Team SOP Hub document directory are packaged as **one unified application** in `frontend/`.

---

## ⚡ Automated CI/CD Pipeline (`git push`)

The repository includes GitHub Actions that automatically build, test, and deploy every push to `main` directly to your VM.

### How it works:
1. **Developer pushes code**:
   ```bash
   git add .
   git commit -m "feat: updates"
   git push origin main
   ```
2. **CI Pipeline ([.github/workflows/ci.yml](file:///.github/workflows/ci.yml))**:
   - Triggers on GitHub cloud (`ubuntu-latest`).
   - Runs linting, Vitest unit tests, and production build verification.
3. **Deploy Pipeline ([.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml))**:
   - Triggers on your VM via the GitHub Self-Hosted Runner (`runs-on: self-hosted`).
   - Checks out the latest commit.
   - Builds the unified frontend bundle (`npm install --legacy-peer-deps && npm run build`).
   - Deploys the Nginx container via Docker Compose (`docker compose up -d --build --force-recreate`).
   - Verifies container health on port `8083` (or configured `HOST_PORT`).
   - Prunes old Docker images automatically to keep the VM disk clean.

---

## 🖥️ First-Time VM Setup (Self-Hosted Runner)

If you are connecting a new VM to GitHub Actions:

### 1. In GitHub Repository:
Go to **Settings** → **Actions** → **Runners** → **New self-hosted runner** → select **Linux x64**.

### 2. On your VM terminal:
Run the download and configure commands shown by GitHub:
```bash
# Create runner directory
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download runner package (check GitHub page for latest version)
curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/...
tar xzf ./actions-runner-linux-x64.tar.gz

# Configure with your repo token
./config.sh --url https://github.com/adityas-god/BAY_AREA --token <RUNNER_TOKEN>

# Install as systemd service (so it runs continuously in background)
sudo ./svc.sh install
sudo ./svc.sh start
```

Once started, the runner shows as **Idle / Active** in GitHub, and every future `git push origin main` will automatically build and update the VM container!

---

## 🛠️ Manual VM Deployment (Fallback without CI/CD)

If you ever need to manually deploy or restart on the VM:

```bash
cd /path/to/BAY_AREA
chmod +x deploy.sh
./deploy.sh
```

---

## 📋 Docker & Port Configuration

The container binds to:
- **Container Port**: `80` (Internal Nginx)
- **Host VM Port**: `${HOST_PORT:-8083}` (Accessible at `http://<VM_IP>:8083`)

To change the external port (e.g. to port `80` or `3000`), edit `.env` on the VM:
```bash
echo "HOST_PORT=80" > .env
docker compose up -d --force-recreate
```

---

## 🔄 Daily Operations & Monitoring

| Action | Command |
| :--- | :--- |
| **Check Container Status** | `docker ps --filter "name=bay-area-frontend"` |
| **Stream Live Logs** | `docker compose logs -f` |
| **Restart Container** | `docker compose restart` |
| **Stop Container** | `docker compose down` |
| **Verify Healthcheck** | `curl -i http://localhost:8083/health` |
