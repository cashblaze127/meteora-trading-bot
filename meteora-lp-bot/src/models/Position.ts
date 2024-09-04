import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import BN from "bn.js";
import DLMM from "@meteora-ag/dlmm";

interface ILbPair {
  parameters: any; // Ajustar según la estructura real
  vParameters: any;
  bumpSeed: any[];
  binStepSeed: any[];
  pairType: number;
  activeId: number;
  binStep: number;
  status: number;
  requireBaseFactorSeed: number;
  baseFactorSeed: any[];
  tokenXMint: PublicKey;
  tokenYMint: PublicKey;
  reserveX: PublicKey;
  reserveY: PublicKey;
  protocolFee: any;
  feeOwner: PublicKey;
  rewardInfos: any[];
  oracle: PublicKey;
  binArrayBitmap: any[];
  lastUpdatedAt: BN;
  // Añadir más propiedades según necesario
}

interface IToken {
  publicKey: PublicKey;
  reserve: PublicKey;
  amount: bigint;
  decimal: number;
}

interface IPosition {
  publicKey: PublicKey;
  lbPair: ILbPair;
  tokenX: IToken;
  tokenY: IToken;
  lbPairPositionsData: any[];
}

export class PositionDLMM implements IPosition {
  publicKey: PublicKey;
  lbPair: ILbPair;
  tokenX: IToken;
  tokenY: IToken;
  lbPairPositionsData: any[];

  constructor(data: any) {
    this.publicKey = new PublicKey(data.publicKey);
    this.lbPair = data.lbPair; // Asumiendo que lbPair viene ya adecuadamente mapeado
    this.tokenX = {
      publicKey: new PublicKey(data.tokenX.publicKey),
      reserve: new PublicKey(data.tokenX.reserve),
      amount: BigInt(data.tokenX.amount),
      decimal: data.tokenX.decimal,
    };
    this.tokenY = {
      publicKey: new PublicKey(data.tokenY.publicKey),
      reserve: new PublicKey(data.tokenY.reserve),
      amount: BigInt(data.tokenY.amount),
      decimal: data.tokenY.decimal,
    };
    this.lbPairPositionsData = data.lbPairPositionsData; // Asumiendo que viene adecuadamente mapeado
  }

  // Método estático para procesar el Map y devolver instancias de Position
  static fromMap(positionsMap: Map<string, any>): PositionDLMM[] {
    let positions: PositionDLMM[] = [];
    positionsMap.forEach((value, key) => {
      positions.push(new PositionDLMM(value));
    });
    return positions;
  }
}

export class Position {
  poolKey: string;
  startBinPricePerToken: string;
  lastBinPricePerToken: string;
  tokenX: Token;
  tokenY: Token;
  totalCurrent: PositionInfo;
  totalUnclaimedFees: PositionInfo;
  pairInfo?: PairInfo;
  dlmmPool?: DLMM;

  constructor(
    poolKey: string,
    startBinPricePerToken: string,
    lastBinPricePerToken: string,
    tokenX: Token,
    tokenY: Token,
    totalCurrent: PositionInfo,
    totalUnclaimedFees: PositionInfo,
    pairInfo?: PairInfo,
    dlmmPool?: DLMM
  ) {
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

export class PositionInfo {
  tokenXBalance: Decimal;
  tokenYBalance: Decimal;
  exchangeRate: Decimal;
  totalValueInTokenY: Decimal;

  constructor(
    tokenXBalance: Decimal,
    tokenYBalance: Decimal,
    exchangeRate: Decimal,
    totalValueInTokenY?: Decimal
  ) {
    this.tokenXBalance = tokenXBalance;
    this.tokenYBalance = tokenYBalance;
    this.exchangeRate = exchangeRate;
    if (totalValueInTokenY == undefined) {
      this.totalValueInTokenY = this.exchangeRate
        .mul(this.tokenXBalance)
        .add(this.tokenYBalance);
    } else {
      this.totalValueInTokenY = totalValueInTokenY;
    }
  }

  static zero(): PositionInfo {
    return new PositionInfo(
      new Decimal(0),
      new Decimal(0),
      new Decimal(0),
      new Decimal(0)
    );
  }
}

export class Token {
  mint: String;
  symbol: String;
  decimal: Number;
  price: Number;

  constructor(mint: String, symbol: String, decimal: Number, price: Number) {
    this.mint = mint;
    this.symbol = symbol;
    this.decimal = decimal;
    this.price = price;
  }
}

export class PairInfo {
  address: string;
  name: string;
  mintX: string;
  mintY: string;
  reserveX: string;
  reserveY: string;
  reserveXAmount: number;
  reserveYAmount: number;
  binStep: number;
  baseFeePercentage: string;
  maxFeePercentage: string;
  protocolFeePercentage: string;
  liquidity: string;
  rewardMintX: string;
  rewardMintY: string;
  fees24h: number;
  todayFees: number;
  tradeVolume24h: number;
  cumulativeTradeVolume: string;
  cumulativeFeeVolume: string;
  currentPrice: number;
  apr: number;
  apy: number;
  farmApr: number;
  farmApy: number;
  hide: boolean;

  constructor(data: any) {
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
