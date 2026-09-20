"use client";

import { FormEvent, useState } from "react";
import {
  MakeOfferFormSchema,
  type MakeOfferFormInput,
} from "@/lib/schemas/offer";
import { TxMessage } from "@/components/ui/TxMessage";

export interface MakeOfferFormProps {
  onSubmit: (input: MakeOfferFormInput) => Promise<void>;
  disabled: boolean;
}

/**
 * @description Formulario para crear una oferta de escrow (montos en unidades base).
 * @param onSubmit - Callback con datos ya validados por Zod.
 * @param disabled - Deshabilita el form (wallet desconectada / tx en curso).
 * @returns Formulario accesible de MakeOffer.
 */
export function MakeOfferForm({ onSubmit, disabled }: MakeOfferFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const parsed = MakeOfferFormSchema.safeParse({
      mintA: form.get("mintA"),
      mintB: form.get("mintB"),
      amountA: form.get("amountA"),
      receiveB: form.get("receiveB"),
      seed: form.get("seed"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setPending(true);
    try {
      await onSubmit(parsed.data);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear oferta");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Crear oferta de escrow"
      className="space-y-3 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Crear oferta
      </h2>
      <Field name="mintA" label="Mint A" placeholder="Pubkey mint A" />
      <Field name="mintB" label="Mint B" placeholder="Pubkey mint B" />
      <Field name="amountA" label="Amount A" placeholder="1000000" type="number" />
      <Field name="receiveB" label="Receive B" placeholder="2000000" type="number" />
      <Field name="seed" label="Seed" placeholder="42" type="number" />
      <TxMessage message={error} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-md bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Crear oferta"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        name={name}
        aria-label={label}
        placeholder={placeholder}
        type={type}
        required
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
      />
    </label>
  );
}
