import {
    clusterApiUrl,
    Connection,
    Keypair,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    createInitializeInstruction,
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction,
    createMintToInstruction,
    ExtensionType,
    getMetadataPointerState,
    getMint,
    getMintLen,
    getTokenMetadata,
    TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import bs58 from "bs58";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import dotenv from "dotenv";
import { pack, TokenMetadata } from "@solana/spl-token-metadata";

dotenv.config();

(async () => {
    const payer = Keypair.fromSecretKey(bs58.decode(`${process.env.PRIVATE_KEY}`));

    const mint = Keypair.generate();
    const mintK = mint.publicKey;
    await fs.writeFileSync("./tokenKeypair.json", JSON.stringify(Object.values(mint.secretKey)), "utf-8");

    const metadata: TokenMetadata = {
        // updateAuthority: payer.publicKey,
        mint: mintK,
        name: "ABC TOKEN",
        symbol: "ABCT",
        uri: "https://ipfs.io/ipfs/QmShxjdZ8Exvy9uZ6Ym8umL68RGGxcpZRKx9362g3qJvWn",
        additionalMetadata: [["new-field", "new-value"]],
    };

    const decimals = 9;

    const transferFeeConfigAuthority = mint;
    const withdrawWithheldAuthority = mint;

    // Fee basis points for transfers (100 = 1%)
    const feeBasisPoints = 100;
    const maxFee = BigInt(100);

    const mintLen = getMintLen([ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer]);
    const metadataLen = 2 + 2 + pack(metadata).length;

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const payerBalance = await connection.getBalance(payer.publicKey);
    console.log("Payer's Balance (SOL):", payerBalance / 1e9);

    // await connection.requestAirdrop(payer.publicKey, 2 * 1e9);

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    // tokens
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey, // Account that will transfer lamports to created account
        newAccountPubkey: mintK, // Address of the account to create
        space: mintLen, // Amount of bytes to allocate to the created account
        lamports: mintLamports, // Amount of lamports transferred to created account
        programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
    });

    const initializeTransferFeeConfig = createInitializeTransferFeeConfigInstruction(
        mintK, // Mint Account address
        transferFeeConfigAuthority.publicKey, // Authority to update fees
        withdrawWithheldAuthority.publicKey, // Authority to withdraw fees
        feeBasisPoints, // Basis points for transfer fee calculation
        maxFee, // Maximum fee per transfer
        TOKEN_2022_PROGRAM_ID // Token Extension Program ID
    );

    const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
        mintK,
        payer.publicKey,
        mintK,
        TOKEN_2022_PROGRAM_ID
    );

    const initializeMintInstruction = createInitializeMintInstruction(
        mintK,
        decimals,
        payer.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
    );

    const initializeInstruction = createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintK,
        metadata: metadata.mint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: payer.publicKey,
        updateAuthority: payer.publicKey,
    });

    const transaction = new Transaction().add(
        createAccountInstruction,
        initializeTransferFeeConfig,
        initializeMetadataPointerInstruction,
        initializeMintInstruction,
        initializeInstruction
    );

    // Send transaction
    const transactionSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mint] // Signers
    );

    console.log("\nCreate Mint Account:", `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`);

    // mint
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

    // Mint tokens to the associated token account
    const mintTx = new Transaction().add(
        createMintToInstruction(
            mintK,
            fromTokenAccount.address,
            payer.publicKey,
            10000000 * 10 ** decimals, // Mint amount
            [payer],
            TOKEN_2022_PROGRAM_ID
        )
    );

    // Send the minting transaction
    const mintSignature = await sendAndConfirmTransaction(connection, mintTx, [payer, mint]);

    console.log("Mint Signature:", `https://solana.fm/tx/${mintSignature}?cluster=devnet-solana`);

    console.log("mint.publicKey", mint.publicKey);

    // Retrieve mint information
    const mintInfo = await getMint(connection, mint.publicKey, "confirmed", TOKEN_2022_PROGRAM_ID);

    // Retrieve and log the metadata pointer state
    const metadataPointer = getMetadataPointerState(mintInfo);
    console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

    const metadataAddress = await getTokenMetadata(
        connection,
        mintK // Mint Account address
    );
    console.log("\nMetadata:", JSON.stringify(metadataAddress, null, 2));
})();
