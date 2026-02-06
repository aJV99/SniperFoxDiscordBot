# GCP Deployment Guide for SniperFox

This guide shows you how to deploy SniperFox to Google Cloud Platform's **Always Free tier** using Docker.

## 💰 Cost: $0/month (Always Free Tier)

The e2-micro instance in us-west1, us-central1, or us-east1 is **free forever** under GCP's Always Free tier.

## Prerequisites

1. GCP account with billing enabled (required even for free tier)
2. `gcloud` CLI installed and authenticated
3. Your Discord bot tokens and configuration

## Quick Start

### 1. Initial Setup

```bash
# Authenticate with GCP
gcloud auth login

# Set your project (or create a new one)
gcloud config set project YOUR_PROJECT_ID

# Run the deployment script
./deploy-gcp.sh
```

### 2. Configure the Bot

After the VM is created (wait 2-3 minutes for initialization):

```bash
# SSH into the instance
gcloud compute ssh sniperfox-bot --zone=us-central1-a

# Clone your repository
cd /opt/sniperfox
git clone YOUR_REPO_URL .

# Create and configure .env file
nano .env
# Add your Discord tokens (see .env.example)

# Build and start the bot
docker compose up -d --build

# Check logs
docker compose logs -f
```

### 3. Verify It's Running

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f sniperfox

# Exit SSH
exit
```

## Useful Commands

### On Your Local Machine

```bash
# SSH into the VM
gcloud compute ssh sniperfox-bot --zone=us-central1-a

# View VM details
gcloud compute instances describe sniperfox-bot --zone=us-central1-a

# Stop the VM (to save resources if needed)
gcloud compute instances stop sniperfox-bot --zone=us-central1-a

# Start the VM
gcloud compute instances start sniperfox-bot --zone=us-central1-a

# Delete the VM
gcloud compute instances delete sniperfox-bot --zone=us-central1-a
```

### On the VM (after SSH)

```bash
# Navigate to app directory
cd /opt/sniperfox

# View running containers
docker compose ps

# View logs
docker compose logs -f

# Restart bot
docker compose restart

# Stop bot
docker compose down

# Update bot (after git push)
git pull
docker compose down
docker compose up -d --build

# View disk usage
df -h

# View memory usage
free -h
```

## Updating Your Bot

When you make changes to your code:

```bash
# On your local machine, push changes to git
git add .
git commit -m "Your changes"
git push

# SSH into the VM
gcloud compute ssh sniperfox-bot --zone=us-central1-a

# Update and restart
cd /opt/sniperfox
git pull
docker compose down
docker compose up -d --build
```

## Monitoring

### Check Bot Health

```bash
# SSH into VM
gcloud compute ssh sniperfox-bot --zone=us-central1-a

# Check if container is running
docker compose ps

# View recent logs
docker compose logs --tail=100

# Follow logs in real-time
docker compose logs -f
```

### System Resources

```bash
# Check CPU and memory usage
docker stats

# Check disk space
df -h

# View system logs
sudo journalctl -u docker -f
```

## Troubleshooting

### Bot Not Starting

```bash
# Check container logs
docker compose logs sniperfox

# Check if .env file exists and has correct values
cat .env

# Restart the bot
docker compose restart
```

### Out of Disk Space

```bash
# Clean up Docker images
docker system prune -a

# Check what's using space
du -sh /opt/sniperfox/*
```

### Connection Issues

```bash
# Check if Docker is running
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Restart bot
cd /opt/sniperfox
docker compose restart
```

## Cost Management

The e2-micro instance is **free forever** if you:
- Use it in us-west1, us-central1, or us-east1
- Stay within 30 GB standard persistent disk
- Keep it as the only e2-micro instance in your account

**You will NOT be charged** as long as you meet these conditions.

## Security Best Practices

1. **Never commit .env file** - It's already in .gitignore
2. **Use secrets management** - Consider GCP Secret Manager for production
3. **Keep system updated**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```
4. **Monitor access logs**:
   ```bash
   gcloud compute instances get-serial-port-output sniperfox-bot --zone=us-central1-a
   ```

## Backup Data

Your `data.json` file is persisted outside the container. To back it up:

```bash
# SSH into VM
gcloud compute ssh sniperfox-bot --zone=us-central1-a

# Copy data.json
cat /opt/sniperfox/data.json
# Save this output somewhere safe
```

Or download it to your local machine:

```bash
gcloud compute scp sniperfox-bot:/opt/sniperfox/data.json ./backup-data.json --zone=us-central1-a
```

## Alternative: Cloud Run (If WebSocket Works)

If you want to try serverless (may have issues with Discord WebSocket):

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sniperfox

# Deploy to Cloud Run
gcloud run deploy sniperfox \
  --image gcr.io/YOUR_PROJECT_ID/sniperfox \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DISCORD_BOT_TOKEN=your_token
```

**Note**: Cloud Run may not be ideal for Discord bots due to WebSocket connection requirements.
