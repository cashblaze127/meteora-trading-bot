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
exports.initializeDlmmPool = initializeDlmmPool;
exports.initializeMultipleDlmmPool = initializeMultipleDlmmPool;
exports.getPriceFromBinId = getPriceFromBinId;
exports.getActiveBin = getActiveBin;
exports.createBalancePosition = createBalancePosition;
exports.createOneSidePosition = createOneSidePosition;
exports.createPoolBalancePosition = createPoolBalancePosition;
exports.createPoolOneSidePosition = createPoolOneSidePosition;
exports.getAllUserPositions = getAllUserPositions;
exports.getListOfPositions = getListOfPositions;
exports.addLiquidityToExistingPositionBalanced = addLiquidityToExistingPositionBalanced;
exports.closePosition = closePosition;
exports.swap = swap;
const web3_js_1 = require("@solana/web3.js");
//import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const bs58_1 = __importDefault(require("bs58"));
const bn_js_1 = __importDefault(require("bn.js"));
const dlmm_1 = __importDefault(require("@meteora-ag/dlmm"));
const dlmm_2 = require("@meteora-ag/dlmm");
const jito_1 = require("../utils/jito");
const Position_1 = require("../models/Position");
const decimal_js_1 = __importDefault(require("decimal.js"));
const solana_1 = require("../utils/solana");
const BASIS_POINT_MAX = 10000;
const RPC_URL = process.env.SOL_RPC_URL;
const connection = new web3_js_1.Connection(RPC_URL, "confirmed");
const newBalancePosition = new web3_js_1.Keypair();
const closePositionPair = new web3_js_1.Keypair();
function initializeDlmmPool(poolKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const publicPoolKey = new web3_js_1.PublicKey(poolKey);
            const dlmmPool = yield dlmm_1.default.create(connection, publicPoolKey);
            console.log("🚀 ~ initializeDlmmPool ~ DLMM:", dlmmPool);
            return dlmmPool;
        }
        catch (error) {
            console.log("Error initializing DLMM Pool:", error);
        }
    });
}
function initializeMultipleDlmmPool(poolKeys) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const publicPoolKeys = poolKeys.map((poolKey) => new web3_js_1.PublicKey(poolKey));
            const dlmmPools = yield dlmm_1.default.createMultiple(connection, publicPoolKeys);
            return dlmmPools;
        }
        catch (error) {
            console.log("Error initializing DLMM Pools:", error);
        }
    });
}
function getPriceFromBinId(binId, binStep, tokenXDecimal, tokenYDecimal) {
    const binStepNum = new decimal_js_1.default(binStep).div(new decimal_js_1.default(BASIS_POINT_MAX));
    const base = new decimal_js_1.default(1).plus(binStepNum);
    return base.pow(binId).mul(Math.pow(10, tokenXDecimal - tokenYDecimal));
}
function getActiveBin(dlmmPool) {
    return __awaiter(this, void 0, void 0, function* () {
        const activeBin = yield dlmmPool.getActiveBin();
        console.log("🚀 ~ getActiveBin ~ activeBin:", activeBin);
        const activeBinPriceLamport = activeBin.price;
        console.log("🚀 ~ getActiveBin ~ activeBinPriceLamport:", activeBinPriceLamport);
        const activeBinPricePerToken = dlmmPool.fromPricePerLamport(Number(activeBin.price));
        console.log("🚀 ~ getActiveBin ~ activeBinPricePerToken:", activeBinPricePerToken);
        return activeBin;
    });
}
function createBalancePosition(dlmmPool, activeBin, amountX, amountY, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const TOTAL_RANGE_INTERVAL = 10;
        const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
        const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
        const activeBinPricePerToken = Number(dlmmPool.fromPricePerLamport(Number(activeBin.price)));
        console.log("🚀 ~ createBalancePosition ~ activeBinPricePerToken:", activeBinPricePerToken);
        const totalXAmount = new bn_js_1.default(amountX * web3_js_1.LAMPORTS_PER_SOL);
        const totalYAmount = new bn_js_1.default(amountY * web3_js_1.LAMPORTS_PER_SOL);
        console.log("createBalancePosition ~ totalXAmount:", totalXAmount);
        console.log("createBalancePosition ~ totalYAmount:", totalYAmount);
        // Create Position
        const createPositionTx = yield dlmmPool.initializePositionAndAddLiquidityByStrategy({
            positionPubKey: newBalancePosition.publicKey,
            user: user,
            totalXAmount,
            totalYAmount,
            strategy: {
                maxBinId,
                minBinId,
                strategyType: dlmm_2.StrategyType.SpotBalanced,
            },
        });
        // Extract the instructions from the original transaction
        const txInstructions = createPositionTx.instructions;
        console.log("🚀 ~ createBalancePosition ~ instructions:", txInstructions);
        // Create the tip instruction
        const tipInstruction = (0, jito_1.createJitoTipIx)(user, 0);
        //console.log("🚀 ~ createBalancePosition ~ tipInstruction:", tipInstruction);
        // Add tip instruction at the end of the instructions
        txInstructions.push(tipInstruction);
        // Create a versioned transaction
        let latestBlockhash = yield connection.getLatestBlockhash("confirmed");
        console.log("🚀 ~ createBalancePosition ~ blockhash:", latestBlockhash.blockhash);
        const messageV0 = new web3_js_1.TransactionMessage({
            payerKey: user,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: txInstructions,
        }).compileToV0Message();
        const versionedTransaction = new web3_js_1.VersionedTransaction(messageV0);
        // Sign the versioned transaction
        versionedTransaction.sign([newBalancePosition]);
        console.log("🚀 ~ createBalancePosition ~ versionedTransaction:", versionedTransaction);
        const serializedTx = versionedTransaction.serialize();
        const encodedTx = bs58_1.default.encode(serializedTx);
        console.log("🚀 ~ createBalancePosition ~ serializedTx:", serializedTx);
        console.log("🚀 ~ createBalancePosition ~ base64String:", encodedTx);
        return encodedTx;
        /*try {
          const signature = await sendJitoTransaction(encodedTx);
          console.log("🚀 ~ createBalancePosition ~ signature:", signature);
      
          return signature;
        } catch (error) {
          console.log("Error sending transaction:", error);
        }*/
    });
}
function createOneSidePosition(dlmmPool, activeBin, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const TOTAL_RANGE_INTERVAL = 10;
        console.log("��� ~ createOneSidePosition ~ activeBin:", activeBin);
        const minBinId = activeBin.binId;
        console.log("🚀 ~ createOneSidePosition ~ minBinId:", minBinId);
        const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;
        console.log("🚀 ~ createOneSidePosition ~ maxBinId:", maxBinId);
        const totalXAmount = new bn_js_1.default(20);
        console.log("🚀 ~ createOneSidePosition ~ totalXAmount:", totalXAmount);
        const totalYAmount = new bn_js_1.default(0);
        console.log("🚀 ~ createOneSidePosition ~ totalYAmount:", totalYAmount);
        let createPositionTx;
        try {
            console.log("🚀 ~ createOneSidePosition ~ dlmmPool:", dlmmPool);
            console.log("��� ~ createOneSidePosition ~ param:", {
                positionPubKey: newBalancePosition.publicKey,
                user: user,
                totalXAmount,
                totalYAmount,
                strategy: {
                    maxBinId,
                    minBinId,
                    strategyType: dlmm_2.StrategyType.SpotOneSide,
                },
            });
            // Create Position
            createPositionTx =
                yield dlmmPool.initializePositionAndAddLiquidityByStrategy({
                    positionPubKey: newBalancePosition.publicKey,
                    user: user,
                    totalXAmount,
                    totalYAmount,
                    strategy: {
                        maxBinId,
                        minBinId,
                        strategyType: dlmm_2.StrategyType.SpotOneSide,
                    },
                });
            console.log("🚀 ~ createOneSidePosition ~ createPositionTx:", createPositionTx);
        }
        catch (error) {
            console.log("createPositionTx ~ error:", JSON.parse(JSON.stringify(error)));
        }
        try {
            const createOneSidePositionTxHash = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, createPositionTx, [/*user,*/ newBalancePosition]);
            console.log("🚀 ~ createOneSidePositionTxHash:", createOneSidePositionTxHash);
        }
        catch (error) {
            console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
        }
    });
}
function createPoolBalancePosition(poolKey, amountX, amountY, user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dlmmPool = yield initializeDlmmPool(poolKey);
            if (dlmmPool !== undefined) {
                let activeBins = yield getActiveBin(dlmmPool);
                let encodedTx = yield createBalancePosition(dlmmPool, activeBins, amountX, amountY, user);
                console.log("encodedTx:", encodedTx);
                return encodedTx;
            }
        }
        catch (error) {
            console.log("Error - createPoolPosition:", error);
        }
    });
}
function createPoolOneSidePosition(dlmmPool, user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (dlmmPool !== undefined) {
                let activeBins = yield getActiveBin(dlmmPool);
                let txHash = yield createOneSidePosition(dlmmPool, activeBins, user);
                console.log("txHash:", txHash);
            }
        }
        catch (error) {
            console.log("Error - createPoolPosition:", error);
        }
    });
}
function getAllUserPositions(user, maxPositionsShown) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("getAllUserPositions: ", user);
            let userPositionsList = [];
            const positionsMap = yield dlmm_1.default.getAllLbPairPositionsByUser(connection, user);
            const positionsPublicKey = [...positionsMap.keys()];
            if (positionsPublicKey.length === 0) {
                console.log("🪐 ~ No positions found for this user.");
                return userPositionsList;
            }
            const dlmmPoolsInfo = yield initializeMultipleDlmmPool(positionsPublicKey);
            let positionsAdded = 0;
            for (let index = 0; index < dlmmPoolsInfo.length; index++) {
                if (positionsAdded >= maxPositionsShown)
                    break;
                const dlmmPool = dlmmPoolsInfo[index];
                const { userPositions } = yield dlmmPool.getPositionsByUserAndLbPair(user);
                console.log("dlmmPool: ", dlmmPool);
                console.log("=====dlmmPool=====: ", dlmmPool.pubkey);
                for (let index = 0; index < userPositions.length; index++) {
                    if (positionsAdded >= maxPositionsShown)
                        break;
                    console.log("🚀 ~ userPositions:", userPositions);
                    const positionInfo = userPositions[index];
                    console.log("🚀 ~ positionInfo:", positionInfo);
                    const tokenData = yield (0, solana_1.getTokenData)([
                        dlmmPool.tokenX.publicKey.toBase58(),
                        dlmmPool.tokenY.publicKey.toBase58(),
                    ], "So11111111111111111111111111111111111111112");
                    const tokenXData = tokenData.find((token) => token.mintAddress === dlmmPool.tokenX.publicKey.toBase58());
                    const tokenYData = tokenData.find((token) => token.mintAddress === dlmmPool.tokenY.publicKey.toBase58());
                    const tokenX = new Position_1.Token(tokenXData.mintAddress, tokenXData.mintSymbol, dlmmPool.tokenX.decimal, tokenXData.price);
                    const tokenY = new Position_1.Token(tokenYData.mintAddress, tokenYData.mintSymbol, dlmmPool.tokenY.decimal, tokenYData.price);
                    const userPositionData = yield getUserExistingPositionData(positionInfo, dlmmPool.pubkey, dlmmPool.lbPair.activeId, dlmmPool.lbPair.binStep, dlmmPool.tokenX.decimal, dlmmPool.tokenY.decimal, tokenX, tokenY, dlmmPool);
                    userPositionsList.push(userPositionData);
                    positionsAdded++;
                    console.log("🚀 ~ userPositionData", userPositionData);
                }
            }
            console.log("🚀🚀🚀 ~ userPositionsList", userPositionsList);
            return userPositionsList;
        }
        catch (error) {
            console.error("Error - getAllUserPositions:", error);
            throw new Error("Failed to fetch all user positions.");
        }
    });
}
function getListOfPositions(dlmmPool, user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userPositions } = yield dlmmPool.getPositionsByUserAndLbPair(user);
            const binData = userPositions[0].positionData.positionBinData;
            console.log("🚀 ~ getListOfPositions ~ position:", JSON.parse(JSON.stringify(userPositions)));
            return userPositions;
        }
        catch (error) {
            console.log("Error - createPoolPosition:", error);
        }
    });
}
function getUserExistingPositionData(positionInfo, lbPair, activeId, binStep, tokenXDecimals, tokenYDecimals, tokenX, tokenY, dlmmPool) {
    return __awaiter(this, void 0, void 0, function* () {
        if (positionInfo) {
            const currentPrice = getPriceFromBinId(activeId, binStep, tokenXDecimals, tokenYDecimals);
            const positionBinData = positionInfo.positionData.positionBinData;
            const startBin = positionBinData[0];
            const lastBin = positionBinData.slice(-1)[0];
            const tokenXBalance = (0, solana_1.formatDecimalTokenBalance)(Number((positionInfo === null || positionInfo === void 0 ? void 0 : positionInfo.positionData.totalXAmount) || 0), tokenXDecimals);
            const tokenYBalance = (0, solana_1.formatDecimalTokenBalance)(Number((positionInfo === null || positionInfo === void 0 ? void 0 : positionInfo.positionData.totalYAmount) || 0), tokenYDecimals);
            const totalCurrent = new Position_1.PositionInfo(tokenXBalance, tokenYBalance, currentPrice);
            const unclaimedFeesX = (0, solana_1.formatDecimalTokenBalance)(Number((positionInfo === null || positionInfo === void 0 ? void 0 : positionInfo.positionData.feeX) || 0), tokenXDecimals);
            const unclaimedFeesY = (0, solana_1.formatDecimalTokenBalance)(Number((positionInfo === null || positionInfo === void 0 ? void 0 : positionInfo.positionData.feeY) || 0), tokenYDecimals);
            const totalUnclaimedFees = new Position_1.PositionInfo(unclaimedFeesX, unclaimedFeesY, currentPrice);
            return new Position_1.Position(lbPair.toBase58(), startBin.pricePerToken, lastBin.pricePerToken, tokenX, tokenY, totalCurrent, totalUnclaimedFees, undefined, dlmmPool);
        }
        return new Position_1.Position("", undefined, undefined, undefined, undefined, Position_1.PositionInfo.zero(), Position_1.PositionInfo.zero());
    });
}
function addLiquidityToExistingPositionBalanced(dlmmPool, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let activeBin = yield getActiveBin(dlmmPool);
        const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
        const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
        const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
        const activeBinPricePerToken = Number(dlmmPool.fromPricePerLamport(Number(activeBin.price)));
        console.log("🚀 ~ createBalancePosition ~ activeBinPricePerToken:", activeBinPricePerToken);
        const solAmount = 0.15;
        const totalXAmount = new bn_js_1.default(solAmount * web3_js_1.LAMPORTS_PER_SOL);
        const totalYAmount = new bn_js_1.default(solAmount * activeBinPricePerToken * web3_js_1.LAMPORTS_PER_SOL);
        console.log("createBalancePosition ~ totalXAmount:", totalXAmount);
        console.log("createBalancePosition ~ totalYAmount:", totalYAmount);
        // Create Position
        const addLiquidityTx = yield dlmmPool.addLiquidityByStrategy({
            positionPubKey: newBalancePosition.publicKey,
            user: user,
            totalXAmount,
            totalYAmount,
            strategy: {
                maxBinId,
                minBinId,
                strategyType: dlmm_2.StrategyType.SpotBalanced,
            },
        });
        console.log("🚀 ~ createBalancePosition ~ addLiquidityTx:", addLiquidityTx);
        try {
            const addLiquidityTxHash = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, addLiquidityTx, [
            /*user*/
            ]);
            console.log("🚀 ~ addLiquidityTxHash:", addLiquidityTxHash);
        }
        catch (error) {
            console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
        }
    });
}
function closePosition(dlmmPool, user) {
    return __awaiter(this, void 0, void 0, function* () {
        let removeLiquidityTx;
        try {
            const { userPositions } = yield dlmmPool.getPositionsByUserAndLbPair(user);
            const userPosition = userPositions[0];
            const binIdsToRemove = userPosition.positionData.positionBinData.map((bin) => bin.binId);
            removeLiquidityTx = yield dlmmPool.removeLiquidity({
                position: userPosition.publicKey,
                user: user,
                binIds: binIdsToRemove,
                // liquiditiesBpsToRemove: new Array(binIdsToRemove.length).fill(new BN(100 * 100)), // 100% (range from 0 to 100)
                bps: new bn_js_1.default(100 * 100),
                shouldClaimAndClose: true, // should claim swap fee and close position together
            });
            console.log("🚀 ~ closePosition ~ userPositions:", userPositions);
        }
        catch (error) {
            console.log("Error - createPoolPosition:", error);
        }
        try {
            for (let tx of Array.isArray(removeLiquidityTx)
                ? removeLiquidityTx
                : [removeLiquidityTx]) {
                // Extract the instructions from the original transaction
                const txInstructions = tx.instructions;
                console.log("🚀 ~ createBalancePosition ~ instructions:", txInstructions);
                // Create the tip instruction
                const tipInstruction = (0, jito_1.createJitoTipIx)(user, 0);
                //console.log("🚀 ~ createBalancePosition ~ tipInstruction:", tipInstruction);
                // Add tip instruction at the end of the instructions
                txInstructions.push(tipInstruction);
                // Create a versioned transaction
                let latestBlockhash = yield connection.getLatestBlockhash("confirmed");
                console.log("🚀 ~ createBalancePosition ~ blockhash:", latestBlockhash.blockhash);
                const messageV0 = new web3_js_1.TransactionMessage({
                    payerKey: user,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: txInstructions,
                }).compileToV0Message();
                const versionedTransaction = new web3_js_1.VersionedTransaction(messageV0);
                //versionedTransaction.sign([user]);
                console.log("🚀 ~ createBalancePosition ~ versionedTransaction:", versionedTransaction);
                //const serializedTx = bs58.encode(createPositionTx.serialize());
                const serializedTx = versionedTransaction.serialize();
                const encodedTx = bs58_1.default.encode(serializedTx);
                console.log("🚀 ~ createBalancePosition ~ serializedTx:", serializedTx);
                console.log("🚀 ~ createBalancePosition ~ base64String:", encodedTx);
                return encodedTx;
                /*try {
                  const txHash = await sendJitoTransaction(encodedTx);
                  console.log("🚀 ~ createBalancePosition ~ txHash:", txHash);
          
                  return `https://solscan.io/tx/${txHash}`;
                  //return await createAndConfirmPosition(createPositionTx);
                } catch (error) {
                  console.log("Error sending transaction:", error);
                }*/
            }
        }
        catch (error) {
            console.error("Error confirming transaction:", error);
        }
    });
}
function swap(dlmmPool, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const swapAmount = new bn_js_1.default(100);
        const swapYtoX = true;
        const binArrays = yield dlmmPool.getBinArrayForSwap(swapYtoX);
        const swapQuote = yield dlmmPool.swapQuote(swapAmount, swapYtoX, new bn_js_1.default(10), binArrays);
        console.log("🚀 ~ swapQuote:", swapQuote);
        // Swap
        const swapTx = yield dlmmPool.swap({
            inToken: dlmmPool.tokenX.publicKey,
            binArraysPubkey: swapQuote.binArraysPubkey,
            inAmount: swapAmount,
            lbPair: dlmmPool.pubkey,
            user: user,
            minOutAmount: swapQuote.minOutAmount,
            outToken: dlmmPool.tokenY.publicKey,
        });
        try {
            const swapTxHash = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, swapTx, [
            /*user,*/
            ]);
            console.log("🚀 ~ swapTxHash:", swapTxHash);
        }
        catch (error) {
            console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
        }
    });
}
//# sourceMappingURL=dlmmService.js.map