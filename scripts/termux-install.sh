#!/data/data/com.termux/files/usr/bin/bash
# ==========================================================
#  BLOOD × DIAMONDS — instalare automata pe Termux
#  Rulezi o singura comanda si se ocupa de tot pana la
#  configurare. Vezi README pentru pasii de dupa.
# ==========================================================
set -e

RED='\033[31m'; GREEN='\033[32m'; CYAN='\033[36m'; BOLD='\033[1m'; DIM='\033[2m'; OFF='\033[0m'
step() { printf "\n${CYAN}${BOLD}▸ %s${OFF}\n" "$1"; }
ok()   { printf "${GREEN}  ✔ %s${OFF}\n" "$1"; }
warn() { printf "${RED}  ! %s${OFF}\n" "$1"; }

printf "\n${RED}🩸${OFF} ${BOLD}BLOOD × DIAMONDS${OFF} ${CYAN}💎${OFF}  —  instalare\n"
printf "${DIM}Dureaza 3-5 minute. Lasa telefonul deschis pe Termux.${OFF}\n"

REPO="https://github.com/dinica600-bot/Test.git"
DIR="$HOME/bxd"

step "1/4  Actualizez Termux"
if command -v pkg >/dev/null 2>&1; then
  yes '' | pkg update -y >/dev/null 2>&1 || true
  ok "gata"
else
  warn "Nu pare a fi Termux — sar peste actualizare."
fi

step "2/4  Instalez Node.js si Git"
if command -v pkg >/dev/null 2>&1; then
  pkg install -y nodejs git >/dev/null 2>&1
fi
command -v node >/dev/null 2>&1 || { warn "Node.js nu s-a instalat. Ruleaza manual: pkg install nodejs git"; exit 1; }
ok "Node $(node -v)  •  $(git --version | cut -d' ' -f3)"

step "3/4  Descarc botul"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only >/dev/null 2>&1 && ok "actualizat (aveai deja o copie)"
else
  git clone --depth 1 "$REPO" "$DIR" >/dev/null 2>&1
  ok "descarcat in ~/bxd"
fi

step "4/4  Instalez dependintele ${DIM}(pasul lung, ai rabdare)${OFF}"
cd "$DIR"
npm install --no-audit --no-fund >/dev/null 2>&1
ok "gata"

printf "\n${GREEN}${BOLD}✔ Instalarea e completa!${OFF}\n"
printf "\nMai ai ${BOLD}3 comenzi${OFF}. Copiaza-le pe rand:\n\n"
printf "   ${CYAN}cd ~/bxd && npm run setup${OFF}\n"
printf "   ${DIM}# lipesti tokenul, restul se completeaza singur${OFF}\n\n"
printf "   ${CYAN}npm run deploy${OFF}\n"
printf "   ${DIM}# inregistreaza cele 39 de comenzi /${OFF}\n\n"
printf "   ${CYAN}termux-wake-lock && npm start${OFF}\n"
printf "   ${DIM}# porneste botul${OFF}\n\n"
printf "Cand apare ${GREEN}online${OFF} pe server, scrii in Discord:  ${BOLD}/setup server${OFF}\n\n"
