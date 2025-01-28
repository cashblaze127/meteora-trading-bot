"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairInfo = exports.Token = exports.PositionInfo = exports.Position = exports.PositionDLMM = void 0;
const web3_js_1 = require("@solana/web3.js");
const decimal_js_1 = __importDefault(require("decimal.js"));
class PositionDLMM {
    constructor(data) {
        this.publicKey = new web3_js_1.PublicKey(data.publicKey);
        this.lbPair = data.lbPair; // Asumiendo que lbPair viene ya adecuadamente mapeado
        this.tokenX = {
            publicKey: new web3_js_1.PublicKey(data.tokenX.publicKey),
            reserve: new web3_js_1.PublicKey(data.tokenX.reserve),
            amount: BigInt(data.tokenX.amount),
            decimal: data.tokenX.decimal,
        };
        this.tokenY = {
            publicKey: new web3_js_1.PublicKey(data.tokenY.publicKey),
            reserve: new web3_js_1.PublicKey(data.tokenY.reserve),
            amount: BigInt(data.tokenY.amount),
            decimal: data.tokenY.decimal,
        };
        this.lbPairPositionsData = data.lbPairPositionsData; // Asumiendo que viene adecuadamente mapeado
    }
    // Método estático para procesar el Map y devolver instancias de Position
    static fromMap(positionsMap) {
        let positions = [];
        positionsMap.forEach((value, key) => {
            positions.push(new PositionDLMM(value));
        });
        return positions;
    }
}
exports.PositionDLMM = PositionDLMM;
class Position {
    constructor(poolKey, startBinPricePerToken, lastBinPricePerToken, tokenX, tokenY, totalCurrent, totalUnclaimedFees, pairInfo, dlmmPool) {
        this.poolKey = poolKey;
        this.startBinPricePerToken = startBinPricePerToken;
        this.lastBinPricePerToken = lastBinPricePerToken;
        this.tokenX = tokenX;
        this.tokenY = tokenY;
        this.totalCurrent = totalCurrent;
        this.totalUnclaimedFees = totalUnclaimedFees;
        this.pairInfo = pairInfo;
        this.dlmmPool = dlmmPool;
    }
}
exports.Position = Position;
class PositionInfo {
    constructor(tokenXBalance, tokenYBalance, exchangeRate, totalValueInTokenY) {
        this.tokenXBalance = tokenXBalance;
        this.tokenYBalance = tokenYBalance;
        this.exchangeRate = exchangeRate;
        if (totalValueInTokenY == undefined) {
            this.totalValueInTokenY = this.exchangeRate
                .mul(this.tokenXBalance)
                .add(this.tokenYBalance);
        }
        else {
            this.totalValueInTokenY = totalValueInTokenY;
        }
    }
    static zero() {
        return new PositionInfo(new decimal_js_1.default(0), new decimal_js_1.default(0), new decimal_js_1.default(0), new decimal_js_1.default(0));
    }
}
exports.PositionInfo = PositionInfo;
class Token {
    constructor(mint, symbol, decimal, price) {
        this.mint = mint;
        this.symbol = symbol;
        this.decimal = decimal;
        this.price = price;
    }
}
exports.Token = Token;
class PairInfo {
    constructor(data) {
        this.address = data.address;
        this.name = data.name;
        this.mintX = data.mint_x;
        this.mintY = data.mint_y;
        this.reserveX = data.reserve_x;
        this.reserveY = data.reserve_y;
        this.reserveXAmount = data.reserve_x_amount;
        this.reserveYAmount = data.reserve_y_amount;
        this.binStep = data.bin_step;
        this.baseFeePercentage = data.base_fee_percentage;
        this.maxFeePercentage = data.max_fee_percentage;
        this.protocolFeePercentage = data.protocol_fee_percentage;
        this.liquidity = data.liquidity;
        this.rewardMintX = data.reward_mint_x;
        this.rewardMintY = data.reward_mint_y;
        this.fees24h = data.fees_24h;
        this.todayFees = data.today_fees;
        this.tradeVolume24h = data.trade_volume_24h;
        this.cumulativeTradeVolume = data.cumulative_trade_volume;
        this.cumulativeFeeVolume = data.cumulative_fee_volume;
        this.currentPrice = data.current_price;
        this.apr = data.apr;
        this.apy = data.apy;
        this.farmApr = data.farm_apr;
        this.farmApy = data.farm_apy;
        this.hide = data.hide;
    }
}
exports.PairInfo = PairInfo;
//# sourceMappingURL=Position.js.map