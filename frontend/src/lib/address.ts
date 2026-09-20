/**
 * @description Trunca una pubkey base58 para mostrarla en UI.
 * @param address - Dirección completa en base58.
 * @param chars - Cantidad de caracteres visibles al inicio/final.
 * @returns Cadena truncada tipo `AbCd…XyZ1`.
 */
export function truncateAddress(address: string, chars = 8): string {
  if (address.length <= chars * 2) {
    return address;
  }
  return `${address.slice(0, chars)}…${address.slice(-4)}`;
}
