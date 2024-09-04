"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.getTokenBalance = getTokenBalance;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const RPC_URL = process.env.RPC_URL;
const connection = new web3_js_1.Connection(RPC_URL, "confirmed");
/*const wallet = user.publicKey;*/
function getBalance(wallet) {
    return __awaiter(this, void 0, void 0, function* () {
        let solBalance;
        try {
            solBalance = (yield connection.getBalance(wallet)) / web3_js_1.LAMPORTS_PER_SOL;
            console.log("SOL Balance: ", solBalance.toFixed(3));
        }
        catch (error) {
            console.error("🪐 ~ Error getting SOL balance:", error);
            return "0";
        }
        return solBalance.toFixed(3);
    });
}
function getTokenBalance(tokenMint, wallet) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🪐 ~ getTokenBalance ~ tokenMint: ", tokenMint);
            console.log("🪐 ~ getTokenBalance ~ wallet: ", wallet);
            const tokenAccounts = yield connection.getTokenAccountsByOwner(wallet, {
                mint: tokenMint,
            });
            if (!tokenAccounts.value || tokenAccounts.value.length === 0) {
                console.warn("🪐 ~ No token accounts found for the provided wallet and token mint.");
                return "0";
            }
            const accountInfo = tokenAccounts.value[0];
            if (!accountInfo || !accountInfo.pubkey) {
                console.warn("🪐 ~ No valid account info or pubkey found.");
                return "0";
            }
            const account = yield (0, spl_token_1.getAccount)(connection, accountInfo.pubkey);
            const mint = yield (0, spl_token_1.getMint)(connection, tokenMint);
            const balance = Number(account.amount) / Math.pow(10, mint.decimals);
            return balance.toFixed(3);
        }
        catch (error) {
            console.error("🪐 ~ Error getting token balance:", error);
            return "0";
        }
    });
}
//# sourceMappingURL=solanaService.js.map