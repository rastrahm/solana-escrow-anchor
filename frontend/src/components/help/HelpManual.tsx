/**
 * @description Manual de ayuda: qué hace el escrow, cómo funciona y cómo operar.
 * @returns Contenido documental accesible de la dApp.
 */
export function HelpManual() {
  return (
    <article className="space-y-10 text-zinc-800 dark:text-zinc-200">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Manual de ayuda
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Guía de la dApp de escrow SPL: qué resuelve, cómo opera on-chain y
          cómo usar cada acción desde la interfaz.
        </p>
      </header>

      <section aria-labelledby="help-what" className="space-y-3">
        <h2
          id="help-what"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Qué hace
        </h2>
        <p>
          Es un <strong>escrow atómico</strong> de tokens SPL (Token clásico y
          Token-2022). El maker bloquea Token A en un vault controlado por el
          programa. Un taker puede intercambiar Token B por ese Token A, o el
          maker puede cancelar y recuperar su depósito. No hay intermediario
          custodio: las reglas viven en el programa Anchor en Solana.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>MakeOffer</strong> — crear oferta y depositar Token A.
          </li>
          <li>
            <strong>TakeOffer</strong> — aceptar: pagar Token B y recibir Token
            A.
          </li>
          <li>
            <strong>Refund</strong> — cancelar (solo el maker) y recuperar Token
            A + rent.
          </li>
        </ul>
      </section>

      <section aria-labelledby="help-how" className="space-y-3">
        <h2
          id="help-how"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Cómo lo hace
        </h2>
        <p>
          Al crear una oferta se abre una cuenta de estado{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            EscrowState
          </code>{" "}
          (PDA) con seeds{" "}
          <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
            [&quot;escrow&quot;, maker, seed]
          </code>
          . El vault de Token A es otra PDA{" "}
          <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
            [&quot;vault&quot;, escrow]
          </code>{" "}
          cuya autoridad es el propio escrow.
        </p>
        <p>
          Los movimientos de tokens usan solo{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            transfer_checked
          </code>{" "}
          (valida mint y decimals). En Take o Refund el programa firma como PDA,
          envía los tokens y cierra vault + estado para devolver el rent al
          maker. Si algo falla, la transacción revierte entera (atomicidad).
        </p>
      </section>

      <section aria-labelledby="help-wallet" className="space-y-3">
        <h2
          id="help-wallet"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Conectar wallet
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Configurá la extensión (Phantom, Solflare, etc.) en el mismo{" "}
            <strong>cluster</strong> que la app (p. ej. Devnet).
          </li>
          <li>
            Pulsá <strong>Select Wallet</strong> / conectar en la cabecera.
          </li>
          <li>
            Necesitás SOL para fees y tokens en las ATAs de los mints que
            uses.
          </li>
        </ol>
      </section>

      <section aria-labelledby="help-make" className="space-y-3">
        <h2
          id="help-make"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Crear oferta (MakeOffer)
        </h2>
        <p>En la home, formulario <em>Crear oferta</em>:</p>
        <dl className="space-y-2 border-l-2 border-teal-700 pl-4 dark:border-teal-500">
          <div>
            <dt className="font-medium">Mint A / Mint B</dt>
            <dd className="text-zinc-600 dark:text-zinc-400">
              Direcciones de los mints. A es lo que depositás; B es lo que
              pedís a cambio. Deben ser distintos.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Amount A / Receive B</dt>
            <dd className="text-zinc-600 dark:text-zinc-400">
              Cantidades en <strong>unidades base</strong> (con decimals).
              Ejemplo: 1 token con 6 decimals →{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                1000000
              </code>
              . Ambos deben ser &gt; 0.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Seed</dt>
            <dd className="text-zinc-600 dark:text-zinc-400">
              Entero único por maker. Misma seed + mismo maker = misma PDA;
              no podés recrear una oferta ya abierta con la misma seed.
            </dd>
          </div>
        </dl>
        <p>
          Al enviar, firmás el depósito de Token A al vault. La oferta aparece
          en <em>Escrows activos</em>.
        </p>
      </section>

      <section aria-labelledby="help-take" className="space-y-3">
        <h2
          id="help-take"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Tomar oferta (TakeOffer)
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Conectá una wallet que <strong>no</strong> sea el maker.</li>
          <li>
            Tené saldo de Token B ≥ <em>Receive B</em> y ATAs listas.
          </li>
          <li>
            En la lista, pulsá <strong>Tomar oferta</strong>.
          </li>
        </ol>
        <p>
          On-chain: transferís Token B al maker, recibís Token A del vault, y
          se cierran vault y escrow (rent al maker). El botón está deshabilitado
          si sos el maker de esa oferta.
        </p>
      </section>

      <section aria-labelledby="help-refund" className="space-y-3">
        <h2
          id="help-refund"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Cancelar oferta (Refund)
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Conectá la wallet del <strong>maker</strong>.</li>
          <li>
            En tu oferta, pulsá <strong>Cancelar oferta</strong>.
          </li>
        </ol>
        <p>
          Recuperás Token A del vault y el rent de las cuentas cerradas. Solo
          el maker puede ejecutar Refund; otras wallets verán el botón
          deshabilitado.
        </p>
      </section>

      <section aria-labelledby="help-tips" className="space-y-3">
        <h2
          id="help-tips"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Consejos
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
          <li>
            Usá el botón <strong>Actualizar</strong> tras una tx si la lista no
            refresca sola.
          </li>
          <li>
            El cluster y Program ID salen de{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              .env.local
            </code>
            .
          </li>
          <li>
            Modo oscuro: botón <strong>Oscuro / Claro</strong> en la cabecera
            (se guarda en el navegador).
          </li>
        </ul>
      </section>
    </article>
  );
}
