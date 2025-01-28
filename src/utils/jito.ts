import axios from "axios";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export const sendJitoTransaction = async (tx: string): Promise<string> => {
  console.log("sendJitoTransaction", tx);
  try {
    const rpcEndpoint =
      "https://mainnet.block-engine.jito.wtf/api/v1/transactions?bundleOnly=true";
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "sendTransaction",
      params: [tx],
    };
    console.log("sendJitoTransaction - rpcEndpoint", rpcEndpoint);
    console.log("sendJitoTransaction - payload", payload);
    const res = await axios.post(rpcEndpoint, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const signature = res?.data?.result;
    return signature;
  } catch (error) {
    console.error(
      `SendJitoTransaction: Unable to send jito transaction: ${error}`
    );
  }
};

export function createJitoTipIx(fromPubkey: PublicKey, attempt: number) {
  let tipAmountLamports: number;

  if (attempt < 1) {
    tipAmountLamports = 4000;
  } else if (attempt < 3) {
    tipAmountLamports = 6000;
  } else {
    tipAmountLamports = 8000;
  }

  return SystemProgram.transfer({
    fromPubkey: fromPubkey,
    toPubkey: new PublicKey("ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49"), // Jito tip account
    lamports: tipAmountLamports,
  });
}
