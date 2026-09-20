#!/usr/bin/env bash
# Hardening estático pre-despliegue (Fase 5).
# Falla si aparecen patrones prohibidos por .cursorrules / registro de ataques.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT}/programs/escrow/src"
# Solo código on-chain de producción (excluye layout_tests en lib.rs)
SCAN_DIRS=(
  "${SRC}/instructions"
  "${SRC}/state"
  "${SRC}/error.rs"
  "${SRC}/constants.rs"
)
FAIL=0

echo "==> harden-check: production sources"

check_absent() {
  local label="$1"
  local pattern="$2"
  local found=0
  for path in "${SCAN_DIRS[@]}"; do
    if [[ ! -e "${path}" ]]; then
      continue
    fi
    if command -v rg >/dev/null 2>&1; then
      if rg -n --glob '*.rs' -e "${pattern}" "${path}"; then
        found=1
      fi
    else
      if grep -RIn --include='*.rs' -E "${pattern}" "${path}"; then
        found=1
      fi
    fi
  done
  if [[ "${found}" -eq 1 ]]; then
    echo "FAIL: encontrado patrón prohibido (${label}): ${pattern}"
    FAIL=1
  else
    echo "OK: ausente (${label})"
  fi
}

# transfer( sin ser transfer_checked
FOUND_TRANSFER=0
for path in "${SCAN_DIRS[@]}"; do
  [[ -e "${path}" ]] || continue
  if command -v rg >/dev/null 2>&1; then
    if rg -n --glob '*.rs' -e '\btransfer\s*\(' "${path}" | rg -v 'transfer_checked'; then
      FOUND_TRANSFER=1
    fi
  else
    if grep -RIn --include='*.rs' -E '\btransfer\s*\(' "${path}" | grep -v 'transfer_checked'; then
      FOUND_TRANSFER=1
    fi
  fi
done
if [[ "${FOUND_TRANSFER}" -eq 1 ]]; then
  echo "FAIL: uso de transfer( sin _checked"
  FAIL=1
else
  echo "OK: solo transfer_checked"
fi

check_absent "init_if_needed" 'init_if_needed'
check_absent "unwrap" '\.unwrap\s*\('
check_absent "expect" '\.expect\s*\('

# Confirmar overflow-checks en release
if grep -q 'overflow-checks = true' "${ROOT}/Cargo.toml"; then
  echo "OK: overflow-checks = true en Cargo.toml"
else
  echo "FAIL: falta overflow-checks = true en Cargo.toml [profile.release]"
  FAIL=1
fi

# Confirmar que EscrowState declara orden Pubkey → u64 → u8
STATE="${SRC}/state/mod.rs"
if grep -q 'pub maker: Pubkey' "${STATE}" \
  && grep -q 'pub mint_a: Pubkey' "${STATE}" \
  && grep -q 'pub receive: u64' "${STATE}" \
  && grep -q 'pub bump: u8' "${STATE}"; then
  echo "OK: EscrowState mantiene campos Pubkey/u64/u8"
else
  echo "FAIL: layout EscrowState inesperado"
  FAIL=1
fi

if [[ "${FAIL}" -ne 0 ]]; then
  echo "==> harden-check FAILED"
  exit 1
fi

echo "==> harden-check OK"
