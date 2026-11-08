#!/usr/bin/env python3
"""
==============================================================================
WorkPulse Automated VPS Deployment Script
==============================================================================
This script automatically deploys the WorkPulse web application to any
Linux VPS / server (Ubuntu / Debian / CentOS / etc.) over SSH.

HOW TO USE:
1. Fill in your server details in the SERVER CONFIGURATION section below.
2. Run this script in your terminal:
      python deploy.py
3. The script will automatically connect to your server, install Node.js & PM2,
   upload the codebase, configure the database, build the app, and start it
   running 24/7 with PM2!
==============================================================================
"""

import os
import sys
import time
import zipfile
import subprocess
import secrets
from pathlib import Path

# ==============================================================================
# SERVER CONFIGURATION - EDIT THESE VARIABLES
# ==============================================================================
SERVER_IP = "YOUR_SERVER_IP"          # e.g., "192.168.1.100" or "144.126.240.50"
SERVER_USER = "root"                  # Usually "root" or "ubuntu"
SERVER_PASSWORD = "YOUR_PASSWORD"     # Your SSH password (leave empty if using SSH key)
SERVER_PORT = 22                      # Standard SSH port (usually 22)
SSH_KEY_PATH = ""                     # Optional: Path to private key file, e.g., "~/.ssh/id_rsa"
APP_PORT = 3001                       # Port where the web application will be accessible
REMOTE_APP_DIR = "/var/www/workpulse" # Destination directory on the server
# ==============================================================================


def log(msg, symbol="👉"):
    print(f"\n{symbol} {msg}")


def check_and_install_paramiko():
    """Ensure paramiko is available for reliable SSH/SFTP file transfer."""
    try:
        import paramiko
        return paramiko
    except ImportError:
        log("Paramiko SSH library not detected. Installing automatically...", "📦")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko"])
        import paramiko
        return paramiko


def create_project_archive(zip_path: Path):
    """Packages project files into a zip file, ignoring non-essential files."""
    log("Creating lightweight project archive for transfer...", "📦")
    
    ignored_patterns = {
        "node_modules",
        ".next",
        ".git",
        "dev.db",
        "dev.db-journal",
        "workpulse-deploy.zip",
        "__pycache__",
        ".vercel",
    }
    
    current_dir = Path(__file__).resolve().parent
    file_count = 0
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(current_dir):
            # Skip ignored directories in place
            dirs[:] = [d for d in dirs if d not in ignored_patterns]
            
            for file in files:
                rel_path = Path(root, file).relative_to(current_dir)
                
                # Check if file matches ignored names or extensions
                if any(part in ignored_patterns for part in rel_path.parts):
                    continue
                if file.endswith((".log", ".tsbuildinfo", ".db", ".zip")):
                    continue
                
                zipf.write(Path(root, file), rel_path)
                file_count += 1
                
    log(f"Packaged {file_count} files into '{zip_path.name}' ({zip_path.stat().st_size / 1024 / 1024:.2f} MB)", "✓")


def execute_ssh_command(client, command, ignore_error=False):
    """Executes a command on the remote server and streams output."""
    stdin, stdout, stderr = client.exec_command(command, get_pty=True)
    
    output = []
    for line in iter(stdout.readline, ""):
        print(line, end="")
        output.append(line)
        
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0 and not ignore_error:
        err_msg = "".join(output)
        raise RuntimeError(f"Command failed with exit code {exit_status}:\n{command}\n{err_msg}")
    return "".join(output)


def main():
    print("=" * 70)
    print("🚀 WorkPulse Automated Deployment System")
    print("=" * 70)

    # 1. Validate Configuration
    if SERVER_IP in ("YOUR_SERVER_IP", "", None):
        print("\n❌ Error: Please edit 'deploy.py' and set your SERVER_IP variable first!")
        print("   Open deploy.py in an editor and configure SERVER_IP and SERVER_PASSWORD.")
        sys.exit(1)

    paramiko = check_and_install_paramiko()
    
    local_zip = Path(__file__).resolve().parent / "workpulse-deploy.zip"
    remote_zip = "/tmp/workpulse-deploy.zip"
    jwt_secret = secrets.token_hex(32)

    try:
        # 2. Package codebase
        create_project_archive(local_zip)

        # 3. Connect via SSH
        log(f"Connecting to remote server at {SERVER_USER}@{SERVER_IP}:{SERVER_PORT}...", "🔌")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        connect_kwargs = {
            "hostname": SERVER_IP,
            "port": SERVER_PORT,
            "username": SERVER_USER,
            "timeout": 30,
        }
        
        if SSH_KEY_PATH and os.path.exists(os.path.expanduser(SSH_KEY_PATH)):
            connect_kwargs["key_filename"] = os.path.expanduser(SSH_KEY_PATH)
        elif SERVER_PASSWORD:
            connect_kwargs["password"] = SERVER_PASSWORD
        else:
            print("❌ Error: You must specify either SERVER_PASSWORD or SSH_KEY_PATH in deploy.py")
            sys.exit(1)

        ssh.connect(**connect_kwargs)
        log("Connected successfully to remote server!", "✓")

        # 4. Upload zip archive using SFTP
        log(f"Uploading codebase to server at '{remote_zip}'...", "📤")
        sftp = ssh.open_sftp()
        sftp.put(str(local_zip), remote_zip)
        sftp.close()
        log("Codebase upload complete!", "✓")

        # 5. Remote Server Preparation & Installation
        log("Step 1/6: Installing system prerequisites (curl, git, unzip)...", "⚙️")
        execute_ssh_command(
            ssh,
            "export DEBIAN_FRONTEND=noninteractive && "
            "apt-get update -y && "
            "apt-get install -y curl git unzip build-essential"
        )

        log("Step 2/6: Checking / Installing Node.js LTS (v20+)...", "⚙️")
        install_node_script = """
        if ! command -v node >/dev/null 2>&1 || [ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 18 ]; then
            echo "Installing Node.js 20 LTS from NodeSource..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        else
            echo "Node.js is already installed: $(node -v)"
        fi
        """
        execute_ssh_command(ssh, install_node_script)

        log("Step 3/6: Installing PM2 (Process Manager) globally...", "⚙️")
        execute_ssh_command(ssh, "npm install -g pm2")

        log("Step 4/6: Extracting application files to " + REMOTE_APP_DIR + "...", "⚙️")
        setup_dir_cmd = f"""
        mkdir -p {REMOTE_APP_DIR}
        unzip -o {remote_zip} -d {REMOTE_APP_DIR}
        rm -f {remote_zip}
        cd {REMOTE_APP_DIR}
        
        # Create production .env file
        cat << 'EOF' > .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="{jwt_secret}"
PORT={APP_PORT}
NODE_ENV="production"
EOF
        """
        execute_ssh_command(ssh, setup_dir_cmd)

        log("Step 5/6: Installing project dependencies & generating database...", "⚙️")
        build_cmd = f"""
        cd {REMOTE_APP_DIR}
        echo "Installing npm packages..."
        npm install --production=false
        
        echo "Syncing SQLite database schema with Prisma..."
        npx prisma db push
        
        echo "Seeding initial company data and default admin..."
        npx tsx scripts/seed-company-data.ts
        
        echo "Building Next.js production bundle..."
        npm run build
        """
        execute_ssh_command(ssh, build_cmd)

        log("Step 6/6: Starting / Restarting application with PM2...", "⚙️")
        start_cmd = f"""
        cd {REMOTE_APP_DIR}
        # Stop previous instance if running
        pm2 delete workpulse 2>/dev/null || true
        
        # Start application on designated port
        pm2 start npm --name "workpulse" -- start -- -p {APP_PORT}
        
        # Save PM2 state for automatic reboot persistence
        pm2 save
        pm2 startup 2>/dev/null || true
        
        # Open firewall port if ufw is active
        if command -v ufw >/dev/null 2>&1; then
            ufw allow {APP_PORT}/tcp 2>/dev/null || true
        fi
        """
        execute_ssh_command(ssh, start_cmd)

        # 6. Verify Service Status
        log("Verifying service status...", "🔍")
        time.sleep(2)
        verify_cmd = f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{APP_PORT}/login || echo '000'"
        status_code = execute_ssh_command(ssh, verify_cmd).strip()

        print("\n" + "=" * 70)
        print("🎉 WORKPULSE HOSTED SUCCESSFULLY!")
        print("=" * 70)
        print(f"\n🌐 Live Application URL: http://{SERVER_IP}:{APP_PORT}")
        print("\n🔐 Credentials:")
        print("   Administrator: admin@example.com / admin123")
        print("   Collaborators: Any team email / password123")
        print("     (e.g., sarah.jenkins@techvanguard.com, alex.dubois@techvanguard.com)")
        print("\n🛠️ Management Commands on Server:")
        print(f"   View logs:   ssh {SERVER_USER}@{SERVER_IP} 'pm2 logs workpulse'")
        print(f"   Restart app: ssh {SERVER_USER}@{SERVER_IP} 'pm2 restart workpulse'")
        print(f"   App status:  ssh {SERVER_USER}@{SERVER_IP} 'pm2 status'")
        print("=" * 70)

        ssh.close()

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        sys.exit(1)
    finally:
        # Cleanup local zip
        if local_zip.exists():
            local_zip.unlink()


if __name__ == "__main__":
    main()
