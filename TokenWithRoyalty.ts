import {
    clusterApiUrl,
    Connection,
    Keypair,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    createInitializeMintInstruction,
    createMintToInstruction,
    getOrCreateAssociatedTokenAccount,
    createInitializeTransferFeeConfigInstruction,
    ExtensionType,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    AuthorityType,
    createSetAuthorityInstruction,
    createInitializeMetadataPointerInstruction,
} from "@solana/spl-token";
import {
    createInitializeInstruction,
    createUpdateAuthorityInstruction,
    createUpdateFieldInstruction,
    pack,
    TokenMetadata,
} from "@solana/spl-token-metadata";
import fs from "fs";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

(async () => {
    // 1. Set up the connection and keypair
    const payer = Keypair.fromSecretKey(bs58.decode(`${process.env.PRIVATE_KEY}`));
    const mint = Keypair.generate();

    // Save mint keypair for future use
    await fs.writeFileSync("./tokenKeypair.json", JSON.stringify(Object.values(mint.secretKey)), "utf-8");

    const decimals = 9;
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const payerBalance = await connection.getBalance(payer.publicKey);
    console.log("Payer's Balance (SOL):", payerBalance / 1e9);

    const mintK = mint.publicKey;

    // Metadata for the token
    const metadata: TokenMetadata = {
        // updateAuthority: payer.publicKey,
        mint: mintK,
        name: "ABC TOKEN",
        symbol: "ABCT",
        uri: "https://ipfs.io/ipfs/QmShxjdZ8Exvy9uZ6Ym8umL68RGGxcpZRKx9362g3qJvWn",
        additionalMetadata: [["new-field", "new-value"]],
    };

    // Transfer Fee Configurations
    const transferFeeConfigAuthority = payer;
    const withdrawWithheldAuthority = payer;
    const feeBasisPoints = 100; // 1%
    const maxFee = BigInt(100);

    const mintLen = getMintLen([ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer]);
    console.log("🚀 ~ mintLen:", mintLen);
    const metadataLen = 2 + 2 + pack(metadata).length;

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    // 2. Create the Mint Account
    const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintK,
        space: mintLen,
        lamports: mintLamports,
        programId: TOKEN_2022_PROGRAM_ID,
    });

    // const initializeMintInstruction = createInitializeMintInstruction(
    //     mintK,
    //     decimals,
    //     payer.publicKey,
    //     payer.publicKey,
    //     TOKEN_2022_PROGRAM_ID
    // );

    // 3. Set Up Transfer Fee Configuration
    const initializeTransferFeeConfig = createInitializeTransferFeeConfigInstruction(
        mintK,
        transferFeeConfigAuthority.publicKey,
        withdrawWithheldAuthority.publicKey,
        feeBasisPoints,
        maxFee,
        TOKEN_2022_PROGRAM_ID
    );

    // Create the transaction for mint creation
    const transaction = new Transaction().add(
        createMintAccountInstruction,
        initializeTransferFeeConfig,
        createInitializeMetadataPointerInstruction(mintK, payer.publicKey, mintK, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mintK, decimals, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),

        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mintK,
            metadata: metadata.mint,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            mintAuthority: payer.publicKey,
            updateAuthority: payer.publicKey,
        })
    );

    // Send transaction for creating mint account
    const transactionSignature = await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
    console.log("\nMint Account Created:", `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`);

    // 4. Mint tokens into the associated token account
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

    const mintToTx = new Transaction().add(
        createMintToInstruction(
            mintK,
            fromTokenAccount.address,
            payer.publicKey,
            10000000 * 10 ** decimals,
            [payer],
            TOKEN_2022_PROGRAM_ID
        )
    );

    const mintSignature = await sendAndConfirmTransaction(connection, mintToTx, [payer, mint]);
    console.log("Mint Signature:", `https://solana.fm/tx/${mintSignature}?cluster=devnet-solana`);
})();
