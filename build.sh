# Use "name" and "version" from package.json as a Docker material.
APP_NAME=$(grep '"name"' package.json | sed -E 's/.*"name": *"([^"]+)".*/\1/')
VERSION=$(grep '"version"' package.json | sed -E 's/.*"version": *"([^"]+)".*/\1/')

# Update modules
pnpm install

# Delete existing container
echo "Container '$APP_NAME' exists. Deleting."
docker rm -f "$APP_NAME"

# Build the container
docker create -p --name $APP_NAME $IMAGE_ID

# Start the container
docker start $APP_NAME

# Success message
echo "Container created under the name, $APP_NAME"