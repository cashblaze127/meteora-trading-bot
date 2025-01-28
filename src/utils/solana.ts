import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import Decimal from "decimal.js";
import { fetchWithRetry } from "../utils/fetchWithRetry";
import { PairInfo, Position } from "../models/Position";
import { PairResponse } from "../models/Pair";
import fetch from "node-fetch";

export const formatTokenBalance = (
  balance: bigint | number | undefined,
  decimals: number
): number => (balance === undefined ? 0 : Number(balance) / 10 ** decimals);

export const formatDecimalTokenBalance = (
  balance: bigint | number | undefined,
  decimals: number
): Decimal => new Decimal(formatTokenBalance(balance, decimals));

export const fetchTokenDecimals = async (
  connection: Connection,
  mint: PublicKey
): Promise<number> => {
  const mintInfo = await fetchWithRetry(() => getMint(connection, mint));
  return mintInfo.decimals;
};

export function formatNumber(num: any): string {
  if (typeof num !== "number" || isNaN(num)) {
    console.error(`Invalid number passed to formatNumber: ${num}`);
    return `$0.0`;
  }

  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(1)}`;
  }
}

export function calculateTokenPercentages(position) {
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
  } else if (currentPrice < startPrice) {
    // If the price is out of the range below, everything is in SOL
    return {
      tokenX: 100,
      tokenY: 0,
    };
  } else {
    // If the price is out of range above, everything is in USDC
    return {
      tokenX: 0,
      tokenY: 100,
    };
  }
}

export async function getTokenData(mintAddresses, vsTokenAddress) {
  try {
    // Construct the URL with multiple mint addresses separated by commas
    const ids = mintAddresses.join(",");
    let url = `https://price.jup.ag/v6/price?ids=${ids}`;
    if (vsTokenAddress) {
      url = `https://price.jup.ag/v6/price?ids=${ids}&vsToken=${vsTokenAddress}`;
    }
    console.log("🚀 ~ getTokenData ~ url:", url);
    const response = await fetch(url);
    const json = await response.json();

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
      } else {
        console.warn(
          `Token with mint address ${mintAddress} not found in Jupiter API.`
        );
        return null;
      }
    });

    // Filter out any null values ​​if a token was not found
    return tokensInfo.filter((info) => info !== null);
  } catch (error) {
    console.error("Error fetching token information from Jupiter:", error);
    return null;
  }
}

export async function getLbPairData(poolKey: string) {
  try {
    const response = await fetch(`https://dlmm-api.meteora.ag/pair/${poolKey}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const pairInfo = new PairInfo(data);
    console.log("🚀 ~ getLbPairData ~ pairInfo:", pairInfo);
    return pairInfo;
  } catch (error) {
    console.error("Error fetching token information from Jupiter:", error);
    return null;
  }
}

export async function getLbPairWithPositionData(position: Position) {
  console.log("getLbPairData", position);
  try {
    const response = await fetch(
      `https://dlmm-api.meteora.ag/pair/${position.poolKey}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const pairInfo = new PairInfo(data);
    console.log("🚀 ~ getLbPairData ~ pairInfo:", pairInfo);
    position.pairInfo = pairInfo;
    return position;
  } catch (error) {
    console.error("Error fetching token information from Jupiter:", error);
    return null;
  }
}

export async function searchPairByGroup(
  searchTerm: string,
  page: number,
  limit: number
) {
  console.log("🚀 ~ searchPairByGroup ~ searchTerm:", searchTerm);
  console.log("🚀 ~ searchPairByGroup ~ page:", page);
  try {
    const response = await fetch(
      `https://dlmm-api.meteora.ag/pair/all_by_groups?page=${page}&limit=${limit}&sort_key=volume&order_by=desc&search_term=${searchTerm}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const pairInfo = new PairResponse(data);
    console.log("🚀 ~ getLbPairData ~ pairInfo:", pairInfo);
    return pairInfo;
  } catch (error) {
    console.error("Error fetching token information from Jupiter:", error);
    return null;
  }
}
