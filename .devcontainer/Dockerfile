# Use the official Node.js 18 image as the base
FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install additional tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Supabase CLI
RUN npm install -g supabase

# Set the default shell
ENV SHELL /bin/bash

# Create workspace directory
RUN mkdir -p /workspaces/businessbranding
WORKDIR /workspaces/businessbranding

# Switch to node user
USER node