#!/bin/bash

# Build script for Claude Code Chat VS Code Extension
# Prompts for version bump before building

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Claude Code Chat Build Tool${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "Current version: ${GREEN}${CURRENT_VERSION}${NC}"
echo ""

# Prompt for version bump
echo "How would you like to bump the version?"
echo ""
echo -e "  ${YELLOW}1)${NC} patch  (${CURRENT_VERSION} -> x.x.+1) - Bug fixes"
echo -e "  ${YELLOW}2)${NC} minor  (${CURRENT_VERSION} -> x.+1.0) - New features"
echo -e "  ${YELLOW}3)${NC} major  (${CURRENT_VERSION} -> +1.0.0) - Breaking changes"
echo -e "  ${YELLOW}4)${NC} skip   - Keep current version"
echo -e "  ${YELLOW}5)${NC} custom - Enter version manually"
echo ""
read -p "Select option [1-5]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Bumping patch version...${NC}"
        npm version patch --no-git-tag-version
        ;;
    2)
        echo -e "${YELLOW}Bumping minor version...${NC}"
        npm version minor --no-git-tag-version
        ;;
    3)
        echo -e "${YELLOW}Bumping major version...${NC}"
        npm version major --no-git-tag-version
        ;;
    4)
        echo -e "${YELLOW}Keeping current version...${NC}"
        ;;
    5)
        read -p "Enter custom version (e.g., 1.2.3): " custom_version
        if [[ ! $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}Invalid version format. Use semantic versioning (e.g., 1.2.3)${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Setting version to ${custom_version}...${NC}"
        npm version "$custom_version" --no-git-tag-version
        ;;
    *)
        echo -e "${RED}Invalid option. Exiting.${NC}"
        exit 1
        ;;
esac

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")
OUTPUT_NAME="claude-code-chat-${NEW_VERSION}.vsix"

echo ""
echo -e "Building version: ${GREEN}${NEW_VERSION}${NC}"
echo ""

# Compile TypeScript
echo -e "${YELLOW}Compiling TypeScript...${NC}"
npm run compile

# Build the VSIX
echo -e "${YELLOW}Packaging VSIX...${NC}"
npx vsce package

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Output: ${BLUE}${OUTPUT_NAME}${NC}"
echo -e "Version: ${GREEN}${NEW_VERSION}${NC}"
echo ""

# Ask if user wants to build Open VSIX version too
read -p "Also build Open VSIX version? [y/N]: " build_open_vsix
if [[ $build_open_vsix =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Building Open VSIX version...${NC}"
    bash build/open-vsix/build.sh
fi
