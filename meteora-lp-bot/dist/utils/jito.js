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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendJitoTransaction = void 0;
exports.createJitoTipIx = createJitoTipIx;
const axios_1 = __importDefault(require("axios"));
const web3_js_1 = require("@solana/web3.js");
const sendJitoTransaction = (tx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("sendJitoTransaction", tx);
    try {
        const rpcEndpoint = "https://mainnet.block-engine.jito.wtf/api/v1/transactions?bundleOnly=true";
        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "sendTransaction",
            params: [tx],
        };
        console.log("sendJitoTransaction - rpcEndpoint", rpcEndpoint);
        console.log("sendJitoTransaction - payload", payload);
        const res = yield axios_1.default.post(rpcEndpoint, payload, {
            headers: { "Content-Type": "application/json" },
        });
        const signature = (_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.result;
        return signature;
    }
    catch (error) {
        console.error(`SendJitoTransaction: Unable to send jito transaction: ${error}`);
    }
});
exports.sendJitoTransaction = sendJitoTransaction;
function createJitoTipIx(fromPubkey, attempt) {
    let tipAmountLamports;
    if (attempt < 1) {
        tipAmountLamports = 4000;
    }
    else if (attempt < 3) {
        tipAmountLamports = 6000;
    }
    else {
        tipAmountLamports = 8000;
    }
    return web3_js_1.SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: new web3_js_1.PublicKey("ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49"), // Jito tip account
        lamports: tipAmountLamports,
    });
}
//# sourceMappingURL=jito.js.map