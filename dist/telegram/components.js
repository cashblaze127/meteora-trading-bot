"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolsInfoMessage = poolsInfoMessage;
exports.poolsCompletePositionInfoMessage = poolsCompletePositionInfoMessage;
exports.poolsCompleteInfoMessage = poolsCompleteInfoMessage;
exports.pairListMessage = pairListMessage;
exports.pairListDetailMessage = pairListDetailMessage;
exports.addLiquidityMessage = addLiquidityMessage;
const solana_1 = require("../utils/solana");
function poolsInfoMessage(positions) {
    let poolInfoMessage = "";
    for (var position of positions) {
        const tokenXSymbol = position.tokenX.symbol;
        const tokenYSymbol = position.tokenY.symbol;
        const tokenPercentages = (0, solana_1.calculateTokenPercentages)(position);
        const isOutRange = tokenPercentages.tokenX === 100 || tokenPercentages.tokenY === 100;
        const urlPositionDetail = `https://t.me/meteora_lp_test_bot?start=position_${position.poolKey}`;
        poolInfoMessage += `
${isOutRange ? "🔴" : "🟢"} <a href="${urlPositionDetail}"><b>${tokenXSymbol}-${tokenYSymbol}</b></a> - Current price (${position.totalCurrent.exchangeRate.toFixed(8)}) - <a href="https://app.meteora.ag/dlmm/${position.poolKey}">🪐</a>
<code>${position.poolKey}</code>

• <b>Range:</b> ${parseFloat(position.startBinPricePerToken).toFixed(8)} - ${parseFloat(position.lastBinPricePerToken).toFixed(8)} ${isOutRange ? "⚠️ Out of range" : ""}
• <b>${tokenXSymbol}:</b> ${tokenPercentages.tokenX}%
• <b>${tokenYSymbol}:</b> ${tokenPercentages.tokenY}%

• <b>Liquidity:</b> $${position.totalCurrent.totalValueInTokenY.toFixed(2)}
• <b>Fees Claimed:</b> $${position.totalUnclaimedFees.totalValueInTokenY.toFixed(2)}
• <b>Current Balance:</b> ${position.totalCurrent.tokenXBalance.toFixed(4)} ${tokenXSymbol} - ${position.totalCurrent.tokenYBalance.toFixed(4)} ${tokenYSymbol}
• <b>Unclaimed Swap Fee:</b> ${position.totalUnclaimedFees.tokenXBalance.toFixed(6)} ${tokenXSymbol} - ${position.totalUnclaimedFees.tokenYBalance.toFixed(6)} ${tokenYSymbol}
    `;
    }
    return poolInfoMessage;
}
function poolsCompletePositionInfoMessage(position) {
    let poolInfoMessage = "";
    const tokenXSymbol = position.tokenX.symbol;
    const tokenYSymbol = position.tokenY.symbol;
    const tokenPercentages = (0, solana_1.calculateTokenPercentages)(position);
    const isOutRange = tokenPercentages.tokenX === 100 || tokenPercentages.tokenY === 100;
    const urlPositionDetail = `https://t.me/meteora_lp_test_bot?start=position_${position.poolKey}`;
    poolInfoMessage += `
  ${isOutRange ? "🔴" : "🟢"} <a href="${urlPositionDetail}"><b>${tokenXSymbol}-${tokenYSymbol}</b></a> - Current price (${position.totalCurrent.exchangeRate.toFixed(8)}) - <a href="https://app.meteora.ag/dlmm/${position.poolKey}">🪐</a>
  <code>${position.poolKey}</code>
  
  • <b>Bin Step:</b> ${position.pairInfo.binStep}
  • <b>Base Fee:</b> ${position.pairInfo.baseFeePercentage}%
  • <b>Max Fee:</b> ${position.pairInfo.maxFeePercentage}%
  
  • <b>Pool liquidity:</b> ${(0, solana_1.formatNumber)(parseFloat(position.pairInfo.liquidity))}
  • <b>Daily Yield:</b> ${position.pairInfo.apr.toFixed(2)}%
  • <b>24h volume:</b> ${(0, solana_1.formatNumber)(position.pairInfo.tradeVolume24h)}
  • <b>24h fees:</b> ${(0, solana_1.formatNumber)(position.pairInfo.fees24h)}

  • <b>Range:</b> ${parseFloat(position.startBinPricePerToken).toFixed(8)} - ${parseFloat(position.lastBinPricePerToken).toFixed(8)} ${isOutRange ? "⚠️ Out of range" : ""}
  • <b>${tokenXSymbol}:</b> ${tokenPercentages.tokenX}%
  • <b>${tokenYSymbol}:</b> ${tokenPercentages.tokenY}%
  
  • <b>Liquidity:</b> $${position.totalCurrent.totalValueInTokenY.toFixed(2)}
  • <b>Fees Claimed:</b> $${position.totalUnclaimedFees.totalValueInTokenY.toFixed(2)}
  • <b>Current Balance:</b> ${position.totalCurrent.tokenXBalance.toFixed(4)} ${tokenXSymbol} - ${position.totalCurrent.tokenYBalance.toFixed(4)} ${tokenYSymbol}
  • <b>Unclaimed Swap Fee:</b> ${position.totalUnclaimedFees.tokenXBalance.toFixed(6)} ${tokenXSymbol} - ${position.totalUnclaimedFees.tokenYBalance.toFixed(6)} ${tokenYSymbol}
      `;
    return poolInfoMessage;
}
function poolsCompleteInfoMessage(pairInfo) {
    let poolInfoMessage = "";
    const urlPositionDetail = `https://t.me/meteora_lp_test_bot?start=pair_${pairInfo.address}`;
    poolInfoMessage += `

<a href="${urlPositionDetail}"><b>${pairInfo.name}</b></a> - Current price (${pairInfo.currentPrice.toFixed(9)}) - <a href="https://app.meteora.ag/dlmm/${pairInfo.address}">🪐</a>
<code>${pairInfo.address}</code>

• <b>Bin Step:</b> ${pairInfo.binStep}
• <b>Base Fee:</b> ${pairInfo.baseFeePercentage}%
• <b>Max Fee:</b> ${pairInfo.maxFeePercentage}%

• <b>Pool liquidity:</b> ${(0, solana_1.formatNumber)(parseFloat(pairInfo.liquidity))}
• <b>Daily Yield:</b> ${pairInfo.apr.toFixed(2)}%
• <b>24h volume:</b> ${(0, solana_1.formatNumber)(pairInfo.tradeVolume24h)}
• <b>24h fees:</b> ${(0, solana_1.formatNumber)(pairInfo.fees24h)}

🫂 Share link: <code>${urlPositionDetail}</code>
      `;
    return poolInfoMessage;
}
function pairListMessage(pairResponse) {
    let pairInfoMessage = "";
    for (var group of pairResponse.groups) {
        const pairName = group.name;
        const isOnlyOnePool = group.pairs.length === 1;
        const binStep = group.pairs.length > 0 ? group.pairs[0].binStep : "N/A";
        const fee = group.pairs.length > 0 ? group.pairs[0].baseFeePercentage : "N/A";
        // Sumar los campos tvl, volume24, y fee24h de todos los pares en el grupo
        const totalTvl = group.pairs.reduce((sum, pair) => {
            const liquidity = parseFloat(pair.liquidity);
            return sum + (isNaN(liquidity) ? 0 : liquidity);
        }, 0);
        const totalVolume24h = group.pairs.reduce((sum, pair) => {
            const volume = pair.tradeVolume24h;
            return sum + (isNaN(volume) ? 0 : volume);
        }, 0);
        const totalFee24h = group.pairs.reduce((sum, pair) => {
            const fee = pair.fees24h;
            return sum + (isNaN(fee) ? 0 : fee);
        }, 0);
        const numPools = group.pairs.length;
        const urlPairListDetail = `https://t.me/meteora_lp_test_bot?start=pairListDetail_${pairName}`;
        const urlPairDetail = `https://t.me/meteora_lp_test_bot?start=pair_`;
        if (!isOnlyOnePool) {
            pairInfoMessage += `

<a href="${urlPairListDetail}"><b>${pairName}</b></a> - <b>${numPools} pools</b>

• <b>TVL:</b> ${(0, solana_1.formatNumber)(totalTvl)}
• <b>24H Volume:</b> ${(0, solana_1.formatNumber)(totalVolume24h)}
• <b>24H Fee:</b> ${totalFee24h.toFixed(2)}%
    `;
        }
        else {
            pairInfoMessage += `

<a href="${urlPairDetail}${group.pairs[0].address}"><b>${pairName}</b></a>

• <b>Bin Step:</b> ${binStep}
• <b>Fee:</b> ${fee}%
• <b>TVL:</b> ${(0, solana_1.formatNumber)(totalTvl)}
• <b>24H Volume:</b> ${(0, solana_1.formatNumber)(totalVolume24h)}
• <b>24H Fee:</b> ${totalFee24h.toFixed(2)}%
    `;
        }
    }
    return pairInfoMessage;
}
function pairListDetailMessage(pairs) {
    let pairInfoMessage = "";
    for (var pair of pairs) {
        const pairName = pair.name;
        const binStep = pair.binStep;
        const fee = pair.baseFeePercentage;
        const totalTvl = parseFloat(pair.liquidity);
        const totalVolume24h = pair.tradeVolume24h;
        const totalFee24h = pair.fees24h;
        const urlPairDetail = `https://t.me/meteora_lp_test_bot?start=pair_`;
        pairInfoMessage += `

<a href="${urlPairDetail}${pair.address}"><b>${pairName}</b></a> - <a href="https://app.meteora.ag/dlmm/${pair.address}">🪐</a>
<code>${pair.address}</code>

• <b>Bin Step:</b> ${binStep}
• <b>Fee:</b> ${fee}%
• <b>TVL:</b> ${(0, solana_1.formatNumber)(totalTvl)}
• <b>24H Volume:</b> ${(0, solana_1.formatNumber)(totalVolume24h)}
• <b>24H Fee:</b> ${totalFee24h.toFixed(4)}%
    `;
    }
    return pairInfoMessage;
}
function addLiquidityMessage(pairInfo, tokenX, tokenY, balanceTokenX, balanceTokenY, selectedBalanceX, selectedBalanceY) {
    let liquidityMessage = "";
    let insufficientAmountMessage = "";
    if (balanceTokenX === "0")
        insufficientAmountMessage = `\nInsufficient balance for <b>${tokenX}</b> ⚠️`;
    if (balanceTokenY === "0")
        insufficientAmountMessage = `\nInsufficient balance on <b>${tokenY}</b> ⚠️`;
    liquidityMessage += `
• <b>Spot</b> provides a uniform distribution that is versatile and risk adjusted, suitable for any type of market and conditions. This is similar to setting a CLMM price range.

• <b>Curve</b> is ideal for a concentrated approach that aims to maximise capital efficiency. This is great for stables or pairs where the price does not change very often.

• <b>Bid-Ask</b> is an inverse Curve distribution, typically deployed single sided for a DCA in or out strategy. It can be used to capture volatility especially when prices vastly move out of the typical range.

<b>Account balance:</b> (<code>${balanceTokenX}</code> ${tokenX} - <code>${balanceTokenY}</code> ${tokenY} )

<b>Selected balance:</b>

<b>${tokenX}:</b> <code>${selectedBalanceX}</code>
<b>${tokenY}:</b> <code>${selectedBalanceY}</code>

${insufficientAmountMessage}
  `;
    return liquidityMessage;
}
//# sourceMappingURL=components.js.map