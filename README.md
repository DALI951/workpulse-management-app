# WorkPulse - Projects & Tasks Management Web Application

A full-stack project management web application built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **SQLite (Prisma ORM)**. Features role-based access control (Admin & Collaborator portals), full internationalization (English, Français, العربية with RTL), dark/light mode toggle, and mobile responsive design.

---

## ✨ Features

- **Authentication Gate & RBAC**:
  - Unauthenticated visitors are automatically directed to `/login`.
  - Roles: `ADMIN` (access to `/admin/*`) and `COLLABORATOR` (access to `/collaborator/*`).
- **Administrator Portal**:
  - **Collaborator Management**: Add, edit credentials, delete, and view their assigned projects in a dedicated preview modal.
  - **Project Management**: Create projects (requires a responsible collaborator), filter projects by collaborator, and view progress.
  - **Task Management**: Create tasks assigned to projects (automatically sets initial status to Pending), edit, and filter by project or status (All, In Progress, Pending, Completed).
  - **Dashboard**: Live metrics tracking completed tasks, active in-progress tasks, and performance breakdown per collaborator.
- **Collaborator Portal**:
  - View assigned projects with progress bars and task counts.
  - Interactive project detail view where collaborators can toggle task status (`Pending` $\to$ `In Progress` $\to$ `Completed`).
- **Multilingual Support**:
  - Switch instantly between **English**, **Français**, and **العربية (with full RTL support)**.
- **Dark Mode**:
  - Smooth light/dark mode switch persisted in `localStorage`.
- **Mobile Responsive**:
  - Optimized for smartphone screens with mobile navigation drawer and touch-friendly cards.

---

## 🔑 Default Credentials

- **Administrator**:
  - **Email**: `admin@example.com`
  - **Password**: `admin123`
- **Pre-seeded Collaborators** (TechVanguard team):
  - `sarah.jenkins@techvanguard.com` / `password123`
  - `alex.dubois@techvanguard.com` / `password123`
  - `tariq.mansoor@techvanguard.com` / `password123`
  - `elena.rostova@techvanguard.com` / `password123`
  - `marcus.vance@techvanguard.com` / `password123`
  - `leila.benali@techvanguard.com` / `password123`
  - `lucas.bernard@techvanguard.com` / `password123`
  - `chloe.martin@techvanguard.com` / `password123`

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup SQLite database
npx prisma db push

# 3. Seed company demo data
npx tsx scripts/seed-company-data.ts

# 4. Start local development server (port 3001)
npm run dev
```

Visit: `http://localhost:3001`

---

## 🚀 1-Click Automated VPS Server Deployment

The repository includes an automated Python deployment script (`deploy.py`) that deploys the application to any Linux server/VPS (Ubuntu / Debian / etc.) with zero manual setup required on the server.

### How to Host on Your Server:

1. **Open `deploy.py`** and set your server details at the top:
   ```python
   SERVER_IP = "YOUR_SERVER_IP"         # e.g., "192.168.1.100" or "144.126.240.50"
   SERVER_USER = "root"                 # Usually "root" or "ubuntu"
   SERVER_PASSWORD = "YOUR_PASSWORD"    # Your server SSH password
   SERVER_PORT = 22                     # SSH port (usually 22)
   APP_PORT = 3001                      # Port where the web app will be available
   ```

2. **Run the deployment script**:
   ```bash
   python deploy.py
   ```

3. **What the script automatically does on the server**:
   - Connects to your server over SSH.
   - Installs Node.js 20 LTS, npm, unzip, and PM2 if not present.
   - Packages and uploads the application files.
   - Generates production `.env` with a secure random `JWT_SECRET`.
   - Runs `npm install`, pushes the database schema, seeds the company data, and builds the production bundle.
   - Starts the application 24/7 with PM2 and enables reboot persistence.
   - Configures the firewall (`ufw allow 3001/tcp`).
   - Outputs your live website URL: `http://<YOUR_SERVER_IP>:3001`.
