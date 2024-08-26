import {
    clusterApiUrl,
    Connection,
    Keypair,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    // createMint,
    createMintToInstruction,
    ExtensionType,
    getMintLen,
    LENGTH_SIZE,
    TOKEN_2022_PROGRAM_ID,
    TYPE_SIZE,
} from "@solana/spl-token";
import { createInitializeInstruction, pack, TokenMetadata } from "@solana/spl-token-metadata";
import fs from "fs";
import bs58 from "bs58";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

(async () => {
    // const payerKeypairString = fs.readFileSync("./myKeypair.json", 'utf-8');
    // const payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(payerKeypairString)))
    // const payer = Keypair.generate();
    const PRIVATE_KEY = "";
    // const payer = Keypair.fromSecretKey(base58.decode(`${PRIVATE_KEY}`));
    const payer = Keypair.fromSecretKey(bs58.decode(`${PRIVATE_KEY}`));

    const mint = Keypair.generate();
    await fs.writeFileSync("./tokenKeypair.json", JSON.stringify(Object.values(mint.secretKey)), "utf-8");
    // const mintKeypairString = fs.readFileSync("./tokenKeypair.json", "utf-8");
    // const mint = Keypair.fromSecretKey(new Uint8Array(JSON.parse(mintKeypairString)));

    const decimals = 9;

    const metadata: TokenMetadata = {
        mint: mint.publicKey,
        name: "TOKEN_NAME",
        symbol: "SMBL",
        uri: "URI",
        additionalMetadata: [["new-field", "new-value"]],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // const airdropSignature = await connection.requestAirdrop(
    //   payer.publicKey,
    //   2 * LAMPORTS_PER_SOL
    // );
    // await connection.confirmTransaction({
    //   signature: airdropSignature,
    //   ...(await connection.getLatestBlockhash()),
    // });

    // const mintK = await createMint(connection, payer, payer.publicKey, payer.publicKey, decimals, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    const mintK = mint.publicKey;

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintK,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(mintK, payer.publicKey, mintK, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mintK, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mintK,
            metadata: mintK,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            mintAuthority: payer.publicKey,
            updateAuthority: payer.publicKey,
        })
    );
    const sig = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);
    console.log("Create Signature:", sig);

    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mintK,
        payer.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    const mintTx = new Transaction().add(
        createMintToInstruction(
            mintK,
            fromTokenAccount.address,
            payer.publicKey,
            100 * 10 ** decimals,
            [payer],
            TOKEN_2022_PROGRAM_ID
        )
    );
    const sig2 = await sendAndConfirmTransaction(connection, mintTx, [payer, mint]);
    console.log("Mint Signature:", sig2);
})();
