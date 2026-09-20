"use client";

export interface TakeOfferButtonProps {
  onClick: () => void;
  disabled: boolean;
}

/**
 * @description Botón para aceptar (take) una oferta de escrow.
 * @param onClick - Acción al aceptar.
 * @param disabled - Estado deshabilitado.
 * @returns Botón accesible TakeOffer.
 */
export function TakeOfferButton({ onClick, disabled }: TakeOfferButtonProps) {
  return (
    <button
      type="button"
      aria-label="Tomar oferta"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
    >
      Tomar oferta
    </button>
  );
}
