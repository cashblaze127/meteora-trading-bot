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
exports.fetchTokenDecimals = exports.formatDecimalTokenBalance = exports.formatTokenBalance = void 0;
exports.formatNumber = formatNumber;
exports.calculateTokenPercentages = calculateTokenPercentages;
exports.getTokenData = getTokenData;
exports.getLbPairData = getLbPairData;
exports.getLbPairWithPositionData = getLbPairWithPositionData;
exports.searchPairByGroup = searchPairByGroup;
const spl_token_1 = require("@solana/spl-token");
const decimal_js_1 = __importDefault(require("decimal.js"));
const fetchWithRetry_1 = require("../utils/fetchWithRetry");
const Position_1 = require("../models/Position");
const Pair_1 = require("../models/Pair");
const node_fetch_1 = __importDefault(require("node-fetch"));
const formatTokenBalance = (balance, decimals) => (balance === undefined ? 0 : Number(balance) / 10 ** decimals);
exports.formatTokenBalance = formatTokenBalance;
const formatDecimalTokenBalance = (balance, decimals) => new decimal_js_1.default((0, exports.formatTokenBalance)(balance, decimals));
exports.formatDecimalTokenBalance = formatDecimalTokenBalance;
const fetchTokenDecimals = (connection, mint) => __awaiter(void 0, void 0, void 0, function* () {
    const mintInfo = yield (0, fetchWithRetry_1.fetchWithRetry)(() => (0, spl_token_1.getMint)(connection, mint));
    return mintInfo.decimals;
});
exports.fetchTokenDecimals = fetchTokenDecimals;
function formatNumber(num) {
    if (typeof num !== "number" || isNaN(num)) {
        console.error(`Invalid number passed to formatNumber: ${num}`);
        return `$0.0`;
    }
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
    }
    else if (num >= 1000) {
        return `$${(num / 1000).toFixed(1)}K`;
    }
    else {
        return `$${num.toFixed(1)}`;
    }
}
function calculateTokenPercentages(position) {
    const currentPrice = position.totalCurrent.exchangeRate;
    const startPrice = parseFloat(position.startBinPricePerToken);
    const endPrice = parseFloat(position.lastBinPricePerToken);
    if (currentPrice >= startPrice && currentPrice <= endPrice) {
        // Calculate the current price position within the range
        const rangeSize = endPrice - startPrice;
        const positionInRange = currentPrice - startPrice;
        // We calculate the percentage of each token
        const percentageTokenX = (1 - positionInRange / rangeSize) * 100;
        const percentageTokenY = (positionInRange / rangeSize) * 100;
        return {
            tokenX: percentageTokenX.toFixed(2),
            tokenY: percentageTokenY.toFixed(2),
        };
    }
    else if (currentPrice < startPrice) {
        // If the price is out of the range below, everything is in SOL
        return {
            tokenX: 100,
            tokenY: 0,
        };
    }
    else {
        // If the price is out of range above, everything is in USDC
        return {
            tokenX: 0,
            tokenY: 100,
        };
    }
}
function getTokenData(mintAddresses, vsTokenAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Construct the URL with multiple mint addresses separated by commas
            const ids = mintAddresses.join(",");
            let url = `https://price.jup.ag/v6/price?ids=${ids}`;
            if (vsTokenAddress) {
                url = `https://price.jup.ag/v6/price?ids=${ids}&vsToken=${vsTokenAddress}`;
            }
            console.log("🚀 ~ getTokenData ~ url:", url);
            const response = yield (0, node_fetch_1.default)(url);
            const json = yield response.json();
            // Extract token information from JSON response
            const tokensInfo = mintAddresses.map((mintAddress) => {
                const tokenData = json.data[mintAddress];
                if (tokenData) {
                    return {
                        mintAddress: tokenData.id,
                        mintSymbol: tokenData.mintSymbol,
                        vsToken: tokenData.vsToken,
                        vsTokenSymbol: tokenData.vsTokenSymbol,
                        price: tokenData.price,
                    };
                }
                else {
                    console.warn(`Token with mint address ${mintAddress} not found in Jupiter API.`);
                    return null;
                }
            });
            // Filter out any null values ​​if a token was not found
            return tokensInfo.filter((info) => info !== null);
        }
        catch (error) {
            console.error("Error fetching token information from Jupiter:", error);
            return null;
        }
    });
}
function getLbPairData(poolKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(`https://dlmm-api.meteora.ag/pair/${poolKey}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
            const pairInfo = new Position_1.PairInfo(data);
            console.log("🚀 ~ getLbPairData ~ pairInfo:", pairInfo);
            return pairInfo;
        }
        catch (error) {
            console.error("Error fetching token information from Jupiter:", error);
            return null;
        }
    });
}
function getLbPairWithPositionData(position) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("getLbPairData", position);
        try {
            const response = yield (0, node_fetch_1.default)(`https://dlmm-api.meteora.ag/pair/${position.poolKey}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
            const pairInfo = new Position_1.PairInfo(data);
            console.log("🚀 ~ getLbPairData ~ pairInfo:", pairInfo);
            position.pairInfo = pairInfo;
            return position;
        }
        catch (error) {
            console.error("Error fetching token information from Jupiter:", error);
            return null;
        }
    });
}
function searchPairByGroup(searchTerm, page, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🚀 ~ searchPairByGroup ~ searchTerm:", searchTerm);
        console.log("🚀 ~ searchPairByGroup ~ page:", page);
        try {
            const response = yield (0, node_fetch_1.default)(`https://dlmm-api.meteora.ag/pair/all_by_groups?page=${page}&limit=${limit}&sort_key=volume&order_by=desc&search_term=${searchTerm}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
            const pairInfo = new Pair_1.PairResponse(data);
            console.log("🚀 ~ getLbPairData ~ pairInfo:", pairInfo);
            return pairInfo;
        }
        catch (error) {
            console.error("Error fetching token information from Jupiter:", error);
            return null;
        }
    });
}
//# sourceMappingURL=solana.js.map