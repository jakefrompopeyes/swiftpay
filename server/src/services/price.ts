import axios from 'axios';

export interface PriceData {
  currency: string;
  priceUSD: number;
  priceBTC?: number;
  priceETH?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
}

export class PriceService {
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly SUPPORTED_CURRENCIES = [
    'bitcoin', 'ethereum', 'matic-network', 'usd-coin', 'tether',
    'binancecoin', 'cardano', 'solana', 'polkadot', 'chainlink'
  ];

  async getCurrentPrices(): Promise<PriceData[]> {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.SUPPORTED_CURRENCIES.join(',')}&vs_currencies=usd,btc,eth&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
        {
          headers: {
            'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || ''
          }
        }
      );

      const prices: PriceData[] = [];

      for (const [coinId, data] of Object.entries(response.data)) {
        const coinData = data as any;
        prices.push({
          currency: this.mapCoinIdToCurrency(coinId),
          priceUSD: coinData.usd || 0,
          priceBTC: coinData.btc || 0,
          priceETH: coinData.eth || 0,
          marketCap: coinData.usd_market_cap || 0,
          volume24h: coinData.usd_24h_vol || 0,
          change24h: coinData.usd_24h_change || 0
        });
      }

      return prices;
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
      throw error;
    }
  }

  async updatePriceData(): Promise<void> {
    try {
      const prices = await this.getCurrentPrices();
      console.log(`✅ Updated prices for ${prices.length} currencies`);
    } catch (error) {
      console.error('Error updating price data:', error);
    }
  }

  async getPrice(currency: string): Promise<number> {
    try {
      // Map currency symbols to CoinGecko IDs
      const currencyMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'BNB': 'binancecoin',
        'ADA': 'cardano',
        'SOL': 'solana',
        'DOT': 'polkadot',
        'LINK': 'chainlink'
      };

      const coinGeckoId = currencyMap[currency.toUpperCase()];
      if (!coinGeckoId) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
        {
          headers: {
            'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || ''
          }
        }
      );

      return response.data[coinGeckoId].usd;
    } catch (error) {
      console.error(`Error getting price for ${currency}:`, error);
      return 0;
    }
  }

  async convertToFiat(cryptoAmount: number, currency: string, fiatCurrency: string = 'USD'): Promise<number> {
    try {
      const price = await this.getPrice(currency);
      return cryptoAmount * price;
    } catch (error) {
      console.error('Error converting to fiat:', error);
      return 0;
    }
  }

  async convertFromFiat(fiatAmount: number, currency: string, fiatCurrency: string = 'USD'): Promise<number> {
    try {
      const price = await this.getPrice(currency);
      if (price === 0) return 0;
      return fiatAmount / price;
    } catch (error) {
      console.error('Error converting from fiat:', error);
      return 0;
    }
  }

  startPriceUpdates(intervalMinutes: number = 5): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update immediately
    this.updatePriceData();

    // Set up recurring updates
    this.updateInterval = setInterval(() => {
      this.updatePriceData();
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Started price updates every ${intervalMinutes} minutes`);
  }

  stopPriceUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Stopped price updates');
    }
  }

  private mapCoinIdToCurrency(coinId: string): string {
    const mapping: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'matic-network': 'MATIC',
      'usd-coin': 'USDC',
      'tether': 'USDT',
      'binancecoin': 'BNB',
      'cardano': 'ADA',
      'solana': 'SOL',
      'polkadot': 'DOT',
      'chainlink': 'LINK'
    };

    return mapping[coinId] || coinId.toUpperCase();
  }
}

