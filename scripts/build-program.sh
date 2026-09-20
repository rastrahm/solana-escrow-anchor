#!/usr/bin/env bash
# Compila el programa Anchor usando platform-tools v1.52+
# (cargo ≥ 1.89, requerido por dependencias con edition2024).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TOOLS_VERSION="${PLATFORM_TOOLS_VERSION:-v1.52}"

echo "==> cargo-build-sbf (platform-tools ${TOOLS_VERSION})"
cargo-build-sbf \
  --tools-version "${TOOLS_VERSION}" \
  --manifest-path programs/escrow/Cargo.toml

echo "==> Generando IDL"
mkdir -p target/idl target/types
anchor idl build -p escrow \
  -o target/idl/escrow.json \
  -t target/types/escrow.ts

echo "==> Artefactos"
ls -la target/deploy/escrow.so target/idl/escrow.json target/types/escrow.ts

echo "OK — program ID: $(solana-keygen pubkey target/deploy/escrow-keypair.json 2>/dev/null || true)"
