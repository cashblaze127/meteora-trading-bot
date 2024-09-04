import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
//import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import bs58 from "bs58";
import BN from "bn.js";
import DLMM, { LbPosition } from "@meteora-ag/dlmm";
import { StrategyType } from "@meteora-ag/dlmm";
import { sendJitoTransaction, createJitoTipIx } from "../utils/jito";

import { Position, PositionInfo, Token } from "../models/Position";
import Decimal from "decimal.js";
import { formatDecimalTokenBalance, getTokenData } from "../utils/solana";

const BASIS_POINT_MAX = 10000;
const RPC_URL = process.env.RPC_URL;

const connection = new Connection(RPC_URL, "confirmed");

const newBalancePosition = new Keypair();
const closePositionPair = new Keypair();

export async function initializeDlmmPool(poolKey: string) {
  try {
    const publicPoolKey = new PublicKey(poolKey);
    const dlmmPool = await DLMM.create(connection, publicPoolKey);
    console.log("🚀 ~ initializeDlmmPool ~ DLMM:", dlmmPool);
    return dlmmPool;
  } catch (error) {
    console.log("Error initializing DLMM Pool:", error);
  }
}

export async function initializeMultipleDlmmPool(poolKeys: string[]) {
  try {
    const publicPoolKeys = poolKeys.map((poolKey) => new PublicKey(poolKey));
    const dlmmPools = await DLMM.createMultiple(connection, publicPoolKeys);

    return dlmmPools;
  } catch (error) {
    console.log("Error initializing DLMM Pools:", error);
  }
}

export function getPriceFromBinId(
  binId: number,
  binStep: number,
  tokenXDecimal: number,
  tokenYDecimal: number
): Decimal {
  const binStepNum = new Decimal(binStep).div(new Decimal(BASIS_POINT_MAX));
  const base = new Decimal(1).plus(binStepNum);
  return base.pow(binId).mul(Math.pow(10, tokenXDecimal - tokenYDecimal));
}

export async function getActiveBin(dlmmPool: DLMM) {
  const activeBin = await dlmmPool.getActiveBin();
  console.log("🚀 ~ getActiveBin ~ activeBin:", activeBin);
  const activeBinPriceLamport = activeBin.price;
  console.log(
    "🚀 ~ getActiveBin ~ activeBinPriceLamport:",
    activeBinPriceLamport
  );
  const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
    Number(activeBin.price)
  );
  console.log(
    "🚀 ~ getActiveBin ~ activeBinPricePerToken:",
    activeBinPricePerToken
  );

  return activeBin;
}

export async function createBalancePosition(
  dlmmPool: DLMM,
  activeBin: any,
  amountX: number,
  amountY: number,
  user: PublicKey
) {
  const TOTAL_RANGE_INTERVAL = 10;
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const activeBinPricePerToken = Number(
    dlmmPool.fromPricePerLamport(Number(activeBin.price))
  );
  console.log(
    "🚀 ~ createBalancePosition ~ activeBinPricePerToken:",
    activeBinPricePerToken
  );

  const totalXAmount = new BN(amountX * LAMPORTS_PER_SOL);
  const totalYAmount = new BN(amountY * LAMPORTS_PER_SOL);

  console.log("createBalancePosition ~ totalXAmount:", totalXAmount);
  console.log("createBalancePosition ~ totalYAmount:", totalYAmount);

  // Create Position
  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newBalancePosition.publicKey,
      user: user,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: StrategyType.SpotBalanced,
      },
    });

  // Extract the instructions from the original transaction
  const txInstructions = createPositionTx.instructions;

  console.log("🚀 ~ createBalancePosition ~ instructions:", txInstructions);

  // Create the tip instruction
  const tipInstruction = createJitoTipIx(user, 0);
  //console.log("🚀 ~ createBalancePosition ~ tipInstruction:", tipInstruction);

  // Add tip instruction at the end of the instructions
  txInstructions.push(tipInstruction);

  // Create a versioned transaction
  let latestBlockhash = await connection.getLatestBlockhash("confirmed");
  console.log(
    "🚀 ~ createBalancePosition ~ blockhash:",
    latestBlockhash.blockhash
  );

  const messageV0 = new TransactionMessage({
    payerKey: user,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message();

  const versionedTransaction = new VersionedTransaction(messageV0);
  // Sign the versioned transaction
  versionedTransaction.sign([newBalancePosition]);
  console.log(
    "🚀 ~ createBalancePosition ~ versionedTransaction:",
    versionedTransaction
  );

  const serializedTx = versionedTransaction.serialize();
  const encodedTx = bs58.encode(serializedTx);
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
}

export async function createOneSidePosition(
  dlmmPool: DLMM,
  activeBin: any,
  user: PublicKey
) {
  const TOTAL_RANGE_INTERVAL = 10;
  console.log("��� ~ createOneSidePosition ~ activeBin:", activeBin);
  const minBinId = activeBin.binId;
  console.log("🚀 ~ createOneSidePosition ~ minBinId:", minBinId);
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;
  console.log("🚀 ~ createOneSidePosition ~ maxBinId:", maxBinId);

  const totalXAmount = new BN(20);
  console.log("🚀 ~ createOneSidePosition ~ totalXAmount:", totalXAmount);
  const totalYAmount = new BN(0);
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
        strategyType: StrategyType.SpotOneSide,
      },
    });
    // Create Position
    createPositionTx =
      await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newBalancePosition.publicKey,
        user: user,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.SpotOneSide,
        },
      });

    console.log(
      "🚀 ~ createOneSidePosition ~ createPositionTx:",
      createPositionTx
    );
  } catch (error) {
    console.log("createPositionTx ~ error:", JSON.parse(JSON.stringify(error)));
  }

  try {
    const createOneSidePositionTxHash = await sendAndConfirmTransaction(
      connection,
      createPositionTx,
      [/*user,*/ newBalancePosition]
    );
    console.log(
      "🚀 ~ createOneSidePositionTxHash:",
      createOneSidePositionTxHash
    );
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

export async function createPoolBalancePosition(
  poolKey: string,
  amountX: number,
  amountY: number,
  user: PublicKey
) {
  try {
    const dlmmPool = await initializeDlmmPool(poolKey);
    if (dlmmPool !== undefined) {
      let activeBins = await getActiveBin(dlmmPool);
      let encodedTx = await createBalancePosition(
        dlmmPool,
        activeBins,
        amountX,
        amountY,
        user
      );
      console.log("encodedTx:", encodedTx);
      return encodedTx;
    }
  } catch (error) {
    console.log("Error - createPoolPosition:", error);
  }
}

export async function createPoolOneSidePosition(dlmmPool, user: PublicKey) {
  try {
    if (dlmmPool !== undefined) {
      let activeBins = await getActiveBin(dlmmPool);
      let txHash = await createOneSidePosition(dlmmPool, activeBins, user);
      console.log("txHash:", txHash);
    }
  } catch (error) {
    console.log("Error - createPoolPosition:", error);
  }
}

export async function getAllUserPositions(
  user: PublicKey,
  maxPositionsShown?: number
): Promise<Position[]> {
  try {
    console.log("getAllUserPositions: ", user);
    let userPositionsList: Position[] = [];
    const positionsMap = await DLMM.getAllLbPairPositionsByUser(
      connection,
      user
    );

    const positionsPublicKey = [...positionsMap.keys()];

    if (positionsPublicKey.length === 0) {
      console.log("🪐 ~ No positions found for this user.");
      return userPositionsList;
    }

    const dlmmPoolsInfo = await initializeMultipleDlmmPool(positionsPublicKey);

    let positionsAdded = 0;

    for (let index = 0; index < dlmmPoolsInfo.length; index++) {
      if (positionsAdded >= maxPositionsShown) break;

      const dlmmPool = dlmmPoolsInfo[index];
      const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
        user
      );
      console.log("dlmmPool: ", dlmmPool);
      console.log("=====dlmmPool=====: ", dlmmPool.pubkey);
      for (let index = 0; index < userPositions.length; index++) {
        if (positionsAdded >= maxPositionsShown) break;
        console.log("🚀 ~ userPositions:", userPositions);
        const positionInfo = userPositions[index];
        console.log("🚀 ~ positionInfo:", positionInfo);
        const tokenData = await getTokenData(
          [
            dlmmPool.tokenX.publicKey.toBase58(),
            dlmmPool.tokenY.publicKey.toBase58(),
          ],
          "So11111111111111111111111111111111111111112"
        );

        const tokenXData = tokenData.find(
          (token) => token.mintAddress === dlmmPool.tokenX.publicKey.toBase58()
        );
        const tokenYData = tokenData.find(
          (token) => token.mintAddress === dlmmPool.tokenY.publicKey.toBase58()
        );

        const tokenX = new Token(
          tokenXData.mintAddress,
          tokenXData.mintSymbol,
          dlmmPool.tokenX.decimal,
          tokenXData.price
        );

        const tokenY = new Token(
          tokenYData.mintAddress,
          tokenYData.mintSymbol,
          dlmmPool.tokenY.decimal,
          tokenYData.price
        );

        const userPositionData = await getUserExistingPositionData(
          positionInfo,
          dlmmPool.pubkey,
          dlmmPool.lbPair.activeId,
          dlmmPool.lbPair.binStep,
          dlmmPool.tokenX.decimal,
          dlmmPool.tokenY.decimal,
          tokenX,
          tokenY,
          dlmmPool
        );
        userPositionsList.push(userPositionData);
        positionsAdded++;
        console.log("🚀 ~ userPositionData", userPositionData);
      }
    }

    console.log("🚀🚀🚀 ~ userPositionsList", userPositionsList);
    return userPositionsList;
  } catch (error) {
    console.error("Error - getAllUserPositions:", error);
    throw new Error("Failed to fetch all user positions.");
  }
}

export async function getListOfPositions(dlmmPool, user: PublicKey) {
  try {
    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(user);
    const binData = userPositions[0].positionData.positionBinData;

    console.log(
      "🚀 ~ getListOfPositions ~ position:",
      JSON.parse(JSON.stringify(userPositions))
    );
    return userPositions;
  } catch (error) {
    console.log("Error - createPoolPosition:", error);
  }
}

async function getUserExistingPositionData(
  positionInfo: LbPosition,
  lbPair: PublicKey,
  activeId: number,
  binStep: number,
  tokenXDecimals: number,
  tokenYDecimals: number,
  tokenX: Token,
  tokenY: Token,
  dlmmPool: DLMM
): Promise<Position> {
  if (positionInfo) {
    const currentPrice = getPriceFromBinId(
      activeId,
      binStep,
      tokenXDecimals,
      tokenYDecimals
    );

    const positionBinData = positionInfo.positionData.positionBinData;
    const startBin = positionBinData[0];
    const lastBin = positionBinData.slice(-1)[0];

    const tokenXBalance = formatDecimalTokenBalance(
      Number(positionInfo?.positionData.totalXAmount || 0),
      tokenXDecimals
    );
    const tokenYBalance = formatDecimalTokenBalance(
      Number(positionInfo?.positionData.totalYAmount || 0),
      tokenYDecimals
    );
    const totalCurrent = new PositionInfo(
      tokenXBalance,
      tokenYBalance,
      currentPrice
    );

    const unclaimedFeesX = formatDecimalTokenBalance(
      Number(positionInfo?.positionData.feeX || 0),
      tokenXDecimals
    );
    const unclaimedFeesY = formatDecimalTokenBalance(
      Number(positionInfo?.positionData.feeY || 0),
      tokenYDecimals
    );
    const totalUnclaimedFees = new PositionInfo(
      unclaimedFeesX,
      unclaimedFeesY,
      currentPrice
    );

    return new Position(
      lbPair.toBase58(),
      startBin.pricePerToken,
      lastBin.pricePerToken,
      tokenX,
      tokenY,
      totalCurrent,
      totalUnclaimedFees,
      undefined,
      dlmmPool
    );
  }

  return new Position(
    "",
    undefined,
    undefined,
    undefined,
    undefined,
    PositionInfo.zero(),
    PositionInfo.zero()
  );
}

export async function addLiquidityToExistingPositionBalanced(
  dlmmPool,
  user: PublicKey
) {
  let activeBin = await getActiveBin(dlmmPool);

  const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const activeBinPricePerToken = Number(
    dlmmPool.fromPricePerLamport(Number(activeBin.price))
  );
  console.log(
    "🚀 ~ createBalancePosition ~ activeBinPricePerToken:",
    activeBinPricePerToken
  );

  const solAmount = 0.15;

  const totalXAmount = new BN(solAmount * LAMPORTS_PER_SOL);
  const totalYAmount = new BN(
    solAmount * activeBinPricePerToken * LAMPORTS_PER_SOL
  );

  console.log("createBalancePosition ~ totalXAmount:", totalXAmount);
  console.log("createBalancePosition ~ totalYAmount:", totalYAmount);

  // Create Position
  const addLiquidityTx = await dlmmPool.addLiquidityByStrategy({
    positionPubKey: newBalancePosition.publicKey,
    user: user,
    totalXAmount,
    totalYAmount,
    strategy: {
      maxBinId,
      minBinId,
      strategyType: StrategyType.SpotBalanced,
    },
  });

  console.log("🚀 ~ createBalancePosition ~ addLiquidityTx:", addLiquidityTx);
  try {
    const addLiquidityTxHash = await sendAndConfirmTransaction(
      connection,
      addLiquidityTx,
      [
        /*user*/
      ]
    );
    console.log("🚀 ~ addLiquidityTxHash:", addLiquidityTxHash);
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}

export async function closePosition(dlmmPool: DLMM, user: PublicKey) {
  let removeLiquidityTx;
  try {
    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(user);
    const userPosition = userPositions[0];
    const binIdsToRemove = userPosition.positionData.positionBinData.map(
      (bin) => bin.binId
    );
    removeLiquidityTx = await dlmmPool.removeLiquidity({
      position: userPosition.publicKey,
      user: user,
      binIds: binIdsToRemove,
      // liquiditiesBpsToRemove: new Array(binIdsToRemove.length).fill(new BN(100 * 100)), // 100% (range from 0 to 100)
      bps: new BN(100 * 100),
      shouldClaimAndClose: true, // should claim swap fee and close position together
    });
    console.log("🚀 ~ closePosition ~ userPositions:", userPositions);
  } catch (error) {
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
      const tipInstruction = createJitoTipIx(user, 0);
      //console.log("🚀 ~ createBalancePosition ~ tipInstruction:", tipInstruction);

      // Add tip instruction at the end of the instructions
      txInstructions.push(tipInstruction);

      // Create a versioned transaction
      let latestBlockhash = await connection.getLatestBlockhash("confirmed");
      console.log(
        "🚀 ~ createBalancePosition ~ blockhash:",
        latestBlockhash.blockhash
      );

      const messageV0 = new TransactionMessage({
        payerKey: user,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: txInstructions,
      }).compileToV0Message();

      const versionedTransaction = new VersionedTransaction(messageV0);
      //versionedTransaction.sign([user]);
      console.log(
        "🚀 ~ createBalancePosition ~ versionedTransaction:",
        versionedTransaction
      );

      //const serializedTx = bs58.encode(createPositionTx.serialize());
      const serializedTx = versionedTransaction.serialize();
      const encodedTx = bs58.encode(serializedTx);
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
  } catch (error) {
    console.error("Error confirming transaction:", error);
  }
}

export async function swap(dlmmPool, user: PublicKey) {
  const swapAmount = new BN(100);
  const swapYtoX = true;
  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

  const swapQuote = await dlmmPool.swapQuote(
    swapAmount,
    swapYtoX,
    new BN(10),
    binArrays
  );

  console.log("🚀 ~ swapQuote:", swapQuote);

  // Swap
  const swapTx = await dlmmPool.swap({
    inToken: dlmmPool.tokenX.publicKey,
    binArraysPubkey: swapQuote.binArraysPubkey,
    inAmount: swapAmount,
    lbPair: dlmmPool.pubkey,
    user: user,
    minOutAmount: swapQuote.minOutAmount,
    outToken: dlmmPool.tokenY.publicKey,
  });

  try {
    const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
      /*user,*/
    ]);
    console.log("🚀 ~ swapTxHash:", swapTxHash);
  } catch (error) {
    console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  }
}
