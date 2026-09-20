"use client";

export interface RefundButtonProps {
  onClick: () => void;
  disabled: boolean;
}

/**
 * @description Botón para cancelar (refund) una oferta propia.
 * @param onClick - Acción al cancelar.
 * @param disabled - Estado deshabilitado (p. ej. no es maker).
 * @returns Botón accesible Refund.
 */
export function RefundButton({ onClick, disabled }: RefundButtonProps) {
  return (
    <button
      type="button"
      aria-label="Cancelar oferta"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 disabled:opacity-40"
    >
      Cancelar oferta
    </button>
  );
}
