import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    createInitializeMetadataPointerInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    createTransferInstruction,
    ExtensionType,
    getMintLen,
    LENGTH_SIZE,
    TOKEN_2022_PROGRAM_ID,
    TYPE_SIZE,
} from "@solana/spl-token";
import type { TokenMetadata } from "@solana/spl-token-metadata";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

(async () => {
    const payer = Keypair.fromSecretKey(bs58.decode(`${process.env.PRIVATE_KEY}`));

    const mint = Keypair.generate();
    const decimals = 9;

    const metadata: TokenMetadata = {
        updateAuthority: payer.publicKey,
        mint: mint.publicKey,
        name: "ABC Token",
        symbol: "ABCT",
        uri: "https://ipfs.io/ipfs/QmShxjdZ8Exvy9uZ6Ym8umL68RGGxcpZRKx9362g3qJvWn",
        additionalMetadata: [["new-field", "new-value"]],
    };

    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    const connection = new Connection(clusterApiUrl("devnet"), "finalized");

    // const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    // await connection.confirmTransaction({
    //     signature: airdropSignature,
    //     ...(await connection.getLatestBlockhash()),
    // });

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
            // programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
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
})();
