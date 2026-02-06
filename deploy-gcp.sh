#!/bin/bash
# Deploy SniperFox Discord Bot to GCP Compute Engine e2-micro (Always Free)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🦊 SniperFox GCP Deployment Script${NC}"
echo ""

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-""}
INSTANCE_NAME="sniperfox-bot"
ZONE="us-central1-a"  # Free tier eligible zone
MACHINE_TYPE="e2-micro"  # Always Free tier
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}❌ gcloud CLI not found. Please install it first.${NC}"
    exit 1
fi

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}Please enter your GCP Project ID:${NC}"
        read PROJECT_ID
    fi
fi

echo -e "${GREEN}📋 Using Project: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Check if instance already exists
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &>/dev/null; then
    echo -e "${YELLOW}⚠️  Instance '$INSTANCE_NAME' already exists.${NC}"
    echo "Do you want to delete and recreate it? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}🗑️  Deleting existing instance...${NC}"
        gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet
    else
        echo -e "${BLUE}📦 Updating existing instance...${NC}"
        echo "Run: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
        echo "Then: cd /opt/sniperfox && git pull && docker-compose down && docker-compose up -d --build"
        exit 0
    fi
fi

echo -e "${BLUE}🚀 Creating e2-micro instance (Always Free tier)...${NC}"

# Create the instance with startup script
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-standard \
    --tags=discord-bot \
    --metadata=startup-script='#!/bin/bash

    # Update system
    apt-get update
    apt-get install -y ca-certificates curl gnupg git

    # Install Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start Docker
    systemctl enable docker
    systemctl start docker

    # Create app directory
    mkdir -p /opt/sniperfox

    echo "✅ VM setup complete!"
'

echo -e "${GREEN}✅ Instance created successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Wait 2-3 minutes for the VM to fully initialize"
echo "2. SSH into the instance:"
echo "   ${BLUE}gcloud compute ssh $INSTANCE_NAME --zone=$ZONE${NC}"
echo ""
echo "3. Once connected, clone your repo and set up:"
echo "   ${BLUE}cd /opt/sniperfox${NC}"
echo "   ${BLUE}git clone <your-repo-url> .${NC}"
echo "   ${BLUE}nano .env  # Add your Discord tokens${NC}"
echo "   ${BLUE}docker compose up -d --build${NC}"
echo ""
echo "4. Check logs:"
echo "   ${BLUE}docker compose logs -f${NC}"
echo ""
echo -e "${GREEN}🎉 Your bot will be running 24/7 on the Always Free tier!${NC}"
