import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    createMint,
    ExtensionType,
    getMintLen,
    getOrCreateAssociatedTokenAccount,
    LENGTH_SIZE,
    mintTo,
    TOKEN_2022_PROGRAM_ID,
    transfer,
    TYPE_SIZE,
} from "@solana/spl-token";
import base58 from "bs58";
import { createInitializeInstruction, pack, TokenMetadata } from "@solana/spl-token-metadata";

(async () => {
    const PRIVATE_KEY = "";
    const payer = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY));

    // Connect to the cluster
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Generate a new wallet keypair and airdrop SOL (uncomment if needed)
    // const airdropSignature = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    // await connection.confirmTransaction({
    //     signature: airdropSignature,
    //     ...(await connection.getLatestBlockhash()),
    // });

    // Create new token mint with 9 decimals
    const mint = Keypair.generate();
    const decimals = 9;
    const metadata: TokenMetadata = {
        mint: mint.publicKey,
        name: "Test Token",
        symbol: "TT",
        uri: "https://www.lib.uchicago.edu/efts/ARTFL/projects/mckee/Images/gavarni-reduced2.jpg",
        additionalMetadata: [["new-field", "new-value"]],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
            mint.publicKey,
            payer.publicKey,
            mint.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(mint.publicKey, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mint.publicKey,
            metadata: mint.publicKey,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            mintAuthority: payer.publicKey,
            updateAuthority: payer.publicKey,
        })
    );

    const sig = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);
    console.log("Signature:", sig);

    // Get the token account of the payer wallet, and if it does not exist, create it
    const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint.publicKey,
        payer.publicKey
    );

    // Mint 100,000,000 tokens to the payer's token account
    let signature = await mintTo(
        connection,
        payer,
        mint.publicKey,
        payerTokenAccount.address,
        payer.publicKey,
        100_000_000_000_000_000n, // 100,000,000 * 10^9 (for 9 decimals)
        []
    );
    console.log("Mint transaction signature:", signature);

    // Transfer the new tokens to the same wallet (just an example, can transfer to a different wallet)
    signature = await transfer(
        connection,
        payer,
        payerTokenAccount.address,
        payerTokenAccount.address,
        payer.publicKey,
        100_000_000_000_000_000n, // Transfer 100,000,000 tokens
        []
    );
    console.log("Transfer transaction signature:", signature);
})();
