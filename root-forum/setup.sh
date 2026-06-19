#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; DIM='\033[2m'; BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "${RED}${BOLD}"
echo "  ██████╗  ██████╗  ██████╗ ████████╗"
echo "  ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝"
echo "  ██████╔╝██║   ██║██║   ██║   ██║   "
echo "  ██╔══██╗██║   ██║██║   ██║   ██║   "
echo "  ██║  ██║╚██████╔╝╚██████╔╝   ██║   "
echo "  ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   "
echo -e "${RESET}${DIM}  rot.dpdns.org | v2.0${RESET}"
echo ""

if ! command -v node &>/dev/null; then echo -e "${RED}Node.js not found. Install from nodejs.org (v18+)${RESET}"; exit 1; fi
echo -e "${GREEN}✓ Node $(node -v)${RESET}"

echo -e "${CYAN}[1/4] Installing server deps...${RESET}"
cd server && npm install --silent && cd ..
echo -e "${GREEN}✓ Server ready${RESET}"

echo -e "${CYAN}[2/4] Installing client deps...${RESET}"
cd client && npm install --silent && cd ..
echo -e "${GREEN}✓ Client ready${RESET}"

echo -e "${CYAN}[3/4] Building React app...${RESET}"
cd client && npm run build && cd ..
echo -e "${GREEN}✓ Build complete${RESET}"

echo -e "${CYAN}[4/4] Linking to server...${RESET}"
rm -rf server/public
cp -r client/build server/public
echo -e "${GREEN}✓ Linked${RESET}"

echo ""
echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  ROOT v2 is running.${RESET}"
echo -e "  ${DIM}Local:${RESET}  http://localhost:3001"
echo -e "  ${DIM}Domain:${RESET} https://rot.dpdns.org"
echo ""
echo -e "  ${DIM}Owner login:${RESET}"
echo -e "  ${DIM}  Username: triste${RESET}"
echo -e "  ${DIM}  Password: 333...333${RESET}"
echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

cd server && node index.js
