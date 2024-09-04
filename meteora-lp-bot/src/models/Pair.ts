export class Pair {
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

class PairGroup {
  name: string;
  pairs: Pair[];

  constructor(data: any) {
    this.name = data.name;
    this.pairs = data.pairs.map((pair: any) => new Pair(pair));
  }
}

export class PairResponse {
  groups: PairGroup[];
  total: number;

  constructor(data: any) {
    this.groups = data.groups.map((group: any) => new PairGroup(group));
    this.total = data.total;
  }
}
