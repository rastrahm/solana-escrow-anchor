import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Escrow } from "../target/types/escrow";
import idl from "../target/idl/escrow.json";

const EXPECTED_INIT_SPACE = 32 + 32 + 32 + 8 + 8 + 1; // 113
const EXPECTED_TOTAL_SPACE = 8 + EXPECTED_INIT_SPACE; // 121

const EXPECTED_ERRORS = [
  { code: 6000, name: "Unauthorized" },
  { code: 6001, name: "InvalidMint" },
  { code: 6002, name: "InvalidAmount" },
  { code: 6003, name: "ArithmeticOverflow" },
] as const;

function escrowPda(
  programId: PublicKey,
  maker: PublicKey,
  seed: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

/** Vault token account PDA: ["vault", escrow] — no ATA. */
function vaultPda(
  programId: PublicKey,
  escrow: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), escrow.toBuffer()],
    programId
  )[0];
}

describe("escrow — layout / space (Fase 1)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.escrow as Program<Escrow>;

  it("espacio total = 8 + INIT_SPACE (121) y queda bajo 128 bytes", () => {
    expect(EXPECTED_INIT_SPACE).to.equal(113);
    expect(EXPECTED_TOTAL_SPACE).to.equal(121);
    expect(EXPECTED_TOTAL_SPACE).to.be.lessThan(128);
  });

  it("IDL expone EscrowError con códigos 6000–6003", () => {
    const errors = (idl as anchor.Idl).errors ?? [];
    for (const expected of EXPECTED_ERRORS) {
      const found = errors.find((e) => e.code === expected.code);
      expect(found, `error code ${expected.code}`).to.exist;
      expect(found!.name).to.equal(expected.name);
    }
  });

  it("program id del workspace coincide con declare_id / Anchor.toml", () => {
    expect(program.programId.toBase58()).to.equal(
      "2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS"
    );
  });

  it("IDL incluye la cuenta EscrowState tras MakeOffer", () => {
    const accounts = (idl as anchor.Idl).accounts ?? [];
    const types = (idl as anchor.Idl).types ?? [];
    const hasAccount = accounts.some(
      (a) => a.name === "escrowState" || a.name === "EscrowState"
    );
    const typeDef = types.find(
      (t) => t.name === "EscrowState" || t.name === "escrowState"
    );
    expect(hasAccount || typeDef, "EscrowState en IDL").to.exist;
    if (typeDef && typeDef.type.kind === "struct") {
      // IDL JSON usa snake_case; target/types/*.ts usa camelCase.
      expect(typeDef.type.fields.map((f) => f.name)).to.deep.equal([
        "maker",
        "mint_a",
        "mint_b",
        "receive",
        "seed",
        "bump",
      ]);
    }
  });
});

describe("escrow — make_offer (Fase 2)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.escrow as Program<Escrow>;
  const connection = provider.connection;
  const maker = (provider.wallet as anchor.Wallet).payer;

  const decimals = 6;
  const seed = new BN(42);
  const depositAmount = new BN(1_000_000); // 1 Token A
  const receiveAmount = new BN(2_000_000); // 2 Token B esperados

  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;
  let escrow: PublicKey;
  let vault: PublicKey;

  before(async () => {
    mintA = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    mintB = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    makerAtaA = await createAssociatedTokenAccount(
      connection,
      maker,
      mintA,
      maker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      BigInt(depositAmount.toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    [escrow] = escrowPda(program.programId, maker.publicKey, seed);
    vault = vaultPda(program.programId, escrow);
  });

  it("MakeOffer: inicializa EscrowState, deposita Token A en el vault", async () => {
    await program.methods
      .makeOffer(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const escrowAccount = await program.account.escrowState.fetch(escrow);
    expect(escrowAccount.maker.toBase58()).to.equal(maker.publicKey.toBase58());
    expect(escrowAccount.mintA.toBase58()).to.equal(mintA.toBase58());
    expect(escrowAccount.mintB.toBase58()).to.equal(mintB.toBase58());
    expect(escrowAccount.receive.toString()).to.equal(receiveAmount.toString());
    expect(escrowAccount.seed.toString()).to.equal(seed.toString());
    expect(escrowAccount.bump).to.be.a("number");

    const vaultAccount = await getAccount(
      connection,
      vault,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(vaultAccount.amount.toString()).to.equal(depositAmount.toString());
    expect(vaultAccount.owner.toBase58()).to.equal(escrow.toBase58());
    expect(vaultAccount.mint.toBase58()).to.equal(mintA.toBase58());

    const makerAfter = await getAccount(
      connection,
      makerAtaA,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(makerAfter.amount.toString()).to.equal("0");

    const escrowInfo = await connection.getAccountInfo(escrow);
    expect(escrowInfo).to.not.be.null;
    expect(escrowInfo!.data.length).to.equal(EXPECTED_TOTAL_SPACE);
  });

  it("MakeOffer falla con amount = 0", async () => {
    const otherSeed = new BN(99);
    const [otherEscrow] = escrowPda(
      program.programId,
      maker.publicKey,
      otherSeed
    );
    const otherVault = vaultPda(program.programId, otherEscrow);

    // amount=0 se rechaza en el handler antes del transfer; no hace falta saldo.
    try {
      await program.methods
        .makeOffer(otherSeed, receiveAmount, new BN(0))
        .accountsPartial({
          maker: maker.publicKey,
          mintA,
          mintB,
          makerAtaA,
          escrow: otherEscrow,
          vault: otherVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("debió rechazar amount = 0");
    } catch (err: unknown) {
      const message = String(err);
      expect(message).to.match(/InvalidAmount|custom program error|6002/i);
    }
  });
});

describe("escrow — take_offer (Fase 3)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.escrow as Program<Escrow>;
  const connection = provider.connection;
  const maker = (provider.wallet as anchor.Wallet).payer;

  const decimals = 6;
  const seed = new BN(77);
  const depositAmount = new BN(1_000_000);
  const receiveAmount = new BN(2_000_000);

  let taker: anchor.web3.Keypair;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;
  let makerAtaB: PublicKey;
  let takerAtaA: PublicKey;
  let takerAtaB: PublicKey;
  let escrow: PublicKey;
  let vault: PublicKey;
  let makerLamportsBefore: number;

  before(async () => {
    taker = anchor.web3.Keypair.generate();
    const sig = await connection.requestAirdrop(
      taker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(sig, "confirmed");

    mintA = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    mintB = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    makerAtaA = await createAssociatedTokenAccount(
      connection,
      maker,
      mintA,
      maker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );
    makerAtaB = await createAssociatedTokenAccount(
      connection,
      maker,
      mintB,
      maker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );
    takerAtaA = await createAssociatedTokenAccount(
      connection,
      maker,
      mintA,
      taker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );
    takerAtaB = await createAssociatedTokenAccount(
      connection,
      maker,
      mintB,
      taker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      BigInt(depositAmount.toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
    await mintTo(
      connection,
      maker,
      mintB,
      takerAtaB,
      maker,
      BigInt(receiveAmount.toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    [escrow] = escrowPda(program.programId, maker.publicKey, seed);
    vault = vaultPda(program.programId, escrow);

    await program.methods
      .makeOffer(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    makerLamportsBefore = await connection.getBalance(maker.publicKey);
  });

  it("TakeOffer: swap atómico, cierra vault y escrow, rent al maker", async () => {
    await program.methods
      .takeOffer()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        escrow,
        mintA,
        mintB,
        vault,
        takerAtaA,
        takerAtaB,
        makerAtaB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc();

    const takerA = await getAccount(
      connection,
      takerAtaA,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(takerA.amount.toString()).to.equal(depositAmount.toString());

    const makerB = await getAccount(
      connection,
      makerAtaB,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(makerB.amount.toString()).to.equal(receiveAmount.toString());

    const takerB = await getAccount(
      connection,
      takerAtaB,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(takerB.amount.toString()).to.equal("0");

    expect(await connection.getAccountInfo(vault)).to.be.null;
    expect(await connection.getAccountInfo(escrow)).to.be.null;

    const makerLamportsAfter = await connection.getBalance(maker.publicKey);
    expect(makerLamportsAfter).to.be.greaterThan(makerLamportsBefore);
  });

  it("TakeOffer falla con mint A falso (account substitution)", async () => {
    const attackSeed = new BN(88);
    const deposit = new BN(500_000);
    const receive = new BN(500_000);

    const makerAtaA2 = makerAtaA;
    await mintTo(
      connection,
      maker,
      mintA,
      makerAtaA2,
      maker,
      BigInt(deposit.toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    // Recargar Token B al taker
    await mintTo(
      connection,
      maker,
      mintB,
      takerAtaB,
      maker,
      BigInt(receive.toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    const [escrow2] = escrowPda(program.programId, maker.publicKey, attackSeed);
    const vault2 = vaultPda(program.programId, escrow2);

    await program.methods
      .makeOffer(attackSeed, receive, deposit)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA: makerAtaA2,
        escrow: escrow2,
        vault: vault2,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const fakeMintA = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    try {
      await program.methods
        .takeOffer()
        .accountsPartial({
          taker: taker.publicKey,
          maker: maker.publicKey,
          escrow: escrow2,
          mintA: fakeMintA,
          mintB,
          vault: vault2,
          takerAtaA,
          takerAtaB,
          makerAtaB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([taker])
        .rpc();
      expect.fail("debió rechazar mint A falso");
    } catch (err: unknown) {
      const message = String(err);
      expect(message).to.match(
        /InvalidMint|ConstraintHasOne|custom program error|6001|0x7d1/i
      );
    }
  });
});

describe("escrow — refund (Fase 4)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.escrow as Program<Escrow>;
  const connection = provider.connection;
  const maker = (provider.wallet as anchor.Wallet).payer;

  const decimals = 6;
  const seed = new BN(101);
  const depositAmount = new BN(1_500_000);
  const receiveAmount = new BN(3_000_000);

  let attacker: anchor.web3.Keypair;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;
  let escrow: PublicKey;
  let vault: PublicKey;
  let makerLamportsBefore: number;

  before(async () => {
    attacker = anchor.web3.Keypair.generate();
    const sig = await connection.requestAirdrop(
      attacker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(sig, "confirmed");

    mintA = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    mintB = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    makerAtaA = await createAssociatedTokenAccount(
      connection,
      maker,
      mintA,
      maker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      BigInt(depositAmount.toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    [escrow] = escrowPda(program.programId, maker.publicKey, seed);
    vault = vaultPda(program.programId, escrow);

    await program.methods
      .makeOffer(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    makerLamportsBefore = await connection.getBalance(maker.publicKey);
  });

  it("Refund falla si un no-maker intenta cancelar", async () => {
    try {
      await program.methods
        .refund()
        .accountsPartial({
          maker: attacker.publicKey,
          escrow,
          mintA,
          vault,
          makerAtaA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([attacker])
        .rpc();
      expect.fail("debió rechazar refund de no-maker");
    } catch (err: unknown) {
      const message = String(err);
      expect(message).to.match(
        /Unauthorized|ConstraintSeeds|ConstraintHasOne|custom program error|6000|0x7d6|0x7d3/i
      );
    }

    // Escrow y vault siguen vivos
    expect(await connection.getAccountInfo(escrow)).to.not.be.null;
    expect(await connection.getAccountInfo(vault)).to.not.be.null;
  });

  it("Refund: maker recupera Token A, cierra vault y escrow, rent al maker", async () => {
    await program.methods
      .refund()
      .accountsPartial({
        maker: maker.publicKey,
        escrow,
        mintA,
        vault,
        makerAtaA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const makerA = await getAccount(
      connection,
      makerAtaA,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(makerA.amount.toString()).to.equal(depositAmount.toString());

    expect(await connection.getAccountInfo(vault)).to.be.null;
    expect(await connection.getAccountInfo(escrow)).to.be.null;

    const makerLamportsAfter = await connection.getBalance(maker.publicKey);
    expect(makerLamportsAfter).to.be.greaterThan(makerLamportsBefore);
  });
});

describe("escrow — hardening / seguridad (Fase 5)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.escrow as Program<Escrow>;
  const connection = provider.connection;
  const maker = (provider.wallet as anchor.Wallet).payer;

  const decimals = 6;
  const depositAmount = new BN(1_000_000);
  const receiveAmount = new BN(2_000_000);

  let mintA: PublicKey;
  let mintB: PublicKey;
  let makerAtaA: PublicKey;

  before(async () => {
    mintA = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    mintB = await createMint(
      connection,
      maker,
      maker.publicKey,
      null,
      decimals,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    makerAtaA = await createAssociatedTokenAccount(
      connection,
      maker,
      mintA,
      maker.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );
    await mintTo(
      connection,
      maker,
      mintA,
      makerAtaA,
      maker,
      BigInt((depositAmount.toNumber() * 5).toString()),
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );
  });

  it("MakeOffer falla con receive = 0 (InvalidAmount)", async () => {
    const seed = new BN(201);
    const [escrow] = escrowPda(program.programId, maker.publicKey, seed);
    const vault = vaultPda(program.programId, escrow);

    try {
      await program.methods
        .makeOffer(seed, new BN(0), depositAmount)
        .accountsPartial({
          maker: maker.publicKey,
          mintA,
          mintB,
          makerAtaA,
          escrow,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("debió rechazar receive = 0");
    } catch (err: unknown) {
      expect(String(err)).to.match(/InvalidAmount|custom program error|6002/i);
    }
  });

  it("MakeOffer falla con mint_a == mint_b (InvalidMint)", async () => {
    const seed = new BN(202);
    const [escrow] = escrowPda(program.programId, maker.publicKey, seed);
    const vault = vaultPda(program.programId, escrow);

    try {
      await program.methods
        .makeOffer(seed, receiveAmount, depositAmount)
        .accountsPartial({
          maker: maker.publicKey,
          mintA,
          mintB: mintA,
          makerAtaA,
          escrow,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("debió rechazar mints iguales");
    } catch (err: unknown) {
      expect(String(err)).to.match(/InvalidMint|custom program error|6001/i);
    }
  });

  it("layout on-chain Borsh: offsets packed Pubkey→u64→u8 (SBF, no EVM)", async () => {
    const seed = new BN(203);
    const [escrow, bump] = escrowPda(
      program.programId,
      maker.publicKey,
      seed
    );
    const vault = vaultPda(program.programId, escrow);

    await program.methods
      .makeOffer(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const info = await connection.getAccountInfo(escrow);
    expect(info).to.not.be.null;
    const data = info!.data;
    expect(data.length).to.equal(EXPECTED_TOTAL_SPACE);

    // Offsets absolutos (incluye discriminator Anchor de 8 bytes)
    expect(new PublicKey(data.subarray(8, 40)).equals(maker.publicKey)).to.equal(
      true
    );
    expect(new PublicKey(data.subarray(40, 72)).equals(mintA)).to.equal(true);
    expect(new PublicKey(data.subarray(72, 104)).equals(mintB)).to.equal(true);

    const receiveLe = data.readBigUInt64LE(104);
    const seedLe = data.readBigUInt64LE(112);
    expect(receiveLe.toString()).to.equal(receiveAmount.toString());
    expect(seedLe.toString()).to.equal(seed.toString());
    expect(data[120]).to.equal(bump);

    // Persistencia sin padding: último byte útil = bump
    expect(data.length - 1).to.equal(120);
  });

  it("MakeOffer consume compute units de forma razonable (< 100k)", async () => {
    const seed = new BN(204);
    const [escrow] = escrowPda(program.programId, maker.publicKey, seed);
    const vault = vaultPda(program.programId, escrow);

    const tx = await program.methods
      .makeOffer(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    tx.feePayer = maker.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const sim = await connection.simulateTransaction(tx);
    expect(sim.value.err).to.equal(null);
    const cu = sim.value.unitsConsumed;
    expect(cu, "unitsConsumed").to.be.a("number");
    // Umbral holgado; MakeOffer tipicamente ~25–60k CU tras optimizaciones.
    expect(cu!).to.be.lessThan(80_000);
    // eslint-disable-next-line no-console
    console.log("    MakeOffer simulated CU:", cu);

    await program.methods
      .makeOffer(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });
});
