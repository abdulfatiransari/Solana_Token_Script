import { clusterApiUrl, Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { burnChecked, createBurnCheckedInstruction, createBurnInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";

// (async () => {
//     const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//     const payer = Keypair.fromSecretKey(bs58.decode(`${process.env.PRIVATE_KEY}`));

//     const mintPubkey = new PublicKey("FcmXcpej8b4ZJp2rHvzHaVkXi4PgiCVAzHc7UQn71DRy");

//     const tokenAccountPubkey = new PublicKey("FcmXcpej8b4ZJp2rHvzHaVkXi4PgiCVAzHc7UQn71DRy");
//     // const tokenAccountPubkey = new PublicKey("2XYiFjmU1pCXmC2QfEAghk6S7UADseupkNQdnRBXszD5");

//     // 1) use build-in function
//     // {
//     //     let txhash = await burnChecked(
//     //         connection, // connection
//     //         feePayer, // payer
//     //         tokenAccountPubkey, // token account
//     //         mintPubkey, // mint
//     //         alice, // owner
//     //         1e8, // amount, if your deciamls is 8, 10^8 for 1 token
//     //         9
//     //     );
//     //     console.log(`txhash: ${txhash}`);
//     // }

//     // or

//     // 2) compose by yourself
//     {
//         let tx = new Transaction().add(
//             createBurnCheckedInstruction(
//                 // tokenAccountPubkey, // token account
//                 payer.publicKey,
//                 mintPubkey, // mint
//                 payer.publicKey, // owner of token account
//                 1e8, // amount, if your deciamls is 8, 10^8 for 1 token
//                 9 // decimals
//             )
//         );
//         console.log(
//             `txhash: ${await sendAndConfirmTransaction(connection, tx, [
//                 payer,
//                 payer /* fee payer + token authority */,
//             ])}`
//         );
//     }
// })();

async function burnToken() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    const payer = Keypair.fromSecretKey(bs58.decode(`${process.env.PRIVATE_KEY}`));
    // Create a new instance of the Token class
    // const token = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID, payer);

    // Burn tokens from the burnAccount
    // const transaction = new Transaction().add(
    //     createBurnInstruction(
    //         TOKEN_PROGRAM_ID,
    //         payer.publicKey, // Mint public key
    //         payer.publicKey, // Account holding the tokens to burn
    //         payer.publicKey, // Owner of the token account
    //         [], // Any additional signers (empty array if none)
    //         1e9 // Amount of tokens to burn (in smallest unit, not decimals)
    //     )
    // );

    // Send the transaction
    // const signature = await sendAndConfirmTransaction(
    //     connection,
    //     transaction,
    //     [payer, payer], // Signers: payer and owner of the account
    //     {
    //         skipPreflight: false,
    //         preflightCommitment: "confirmed",
    //     }
    // );

    // console.log("Burn transaction signature:", signature);
}
burnToken();
