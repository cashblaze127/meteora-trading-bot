import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const RPC_URL = process.env.RPC_URL;

const connection = new Connection(RPC_URL, "confirmed");
/*const wallet = user.publicKey;*/

export async function getBalance(wallet: PublicKey): Promise<string> {
  let solBalance;
  try {
    solBalance = (await connection.getBalance(wallet)) / LAMPORTS_PER_SOL;
    console.log("SOL Balance: ", solBalance.toFixed(3));
  } catch (error) {
    console.error("🪐 ~ Error getting SOL balance:", error);
    return "0";
  }
  return solBalance.toFixed(3);
}

export async function getTokenBalance(
  tokenMint: PublicKey,
  wallet: PublicKey
): Promise<string> {
  try {
    console.log("🪐 ~ getTokenBalance ~ tokenMint: ", tokenMint);
    console.log("🪐 ~ getTokenBalance ~ wallet: ", wallet);
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
      mint: tokenMint,
    });

    if (!tokenAccounts.value || tokenAccounts.value.length === 0) {
      console.warn(
        "🪐 ~ No token accounts found for the provided wallet and token mint."
      );
      return "0";
    }

    const accountInfo = tokenAccounts.value[0];

    if (!accountInfo || !accountInfo.pubkey) {
      console.warn("🪐 ~ No valid account info or pubkey found.");
      return "0";
    }

    const account = await getAccount(connection, accountInfo.pubkey);
    const mint = await getMint(connection, tokenMint);

    const balance = Number(account.amount) / Math.pow(10, mint.decimals);
    return balance.toFixed(3);
  } catch (error) {
    console.error("🪐 ~ Error getting token balance:", error);
    return "0";
  }
}
