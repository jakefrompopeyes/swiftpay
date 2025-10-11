// Cryptocurrency Logo Service
// Provides direct logo URLs from CoinGecko CDN

class CryptoLogoService {
  // Direct logo URLs from CoinGecko CDN
  private readonly LOGO_URLS: Record<string, string> = {
    'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1696501628',
    'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1696501400',
    'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png?1696504756',
    'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png?1696502193',
    'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png?1696501970',
    'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1696501970',
    'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1696501970',
    'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png?1696501970',
    'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png?1696502090',
    'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png?1696512008',
    'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png?1696502009'
  };

  // Fallback emoji icons
  private readonly FALLBACK_ICONS: Record<string, string> = {
    'ETH': '🔷',
    'BTC': '🟠',
    'SOL': '🟣', 
    'TRX': '🔴',
    'BNB': '🟡',
    'MATIC': '🟣',
    'USDC': '🔵',
    'USDT': '🟢',
    'ADA': '🔵',
    'DOT': '🔴',
    'LINK': '🔵'
  };

  /**
   * Get logo URL for a cryptocurrency
   */
  getLogoUrl(currency: string | undefined | null): string {
    // Handle null/undefined currency
    if (!currency || typeof currency !== 'string') {
      return this.getFallbackIcon('ETH');
    }
    
    const normalizedCurrency = currency.toUpperCase();
    
    // Return direct URL if available
    if (this.LOGO_URLS[normalizedCurrency]) {
      return this.LOGO_URLS[normalizedCurrency];
    }
    
    // Fallback to emoji icon
    return this.getFallbackIcon(normalizedCurrency);
  }

  /**
   * Get fallback emoji icon
   */
  private getFallbackIcon(currency: string): string {
    return this.FALLBACK_ICONS[currency] || '🔷';
  }

  /**
   * Get multiple logos at once
   */
  getMultipleLogos(currencies: (string | undefined | null)[]): Record<string, string> {
    // Filter out null/undefined currencies and convert to uppercase
    const validCurrencies = currencies
      .filter((currency): currency is string => currency != null && typeof currency === 'string')
      .map(currency => currency.toUpperCase());
    
    const result: Record<string, string> = {};
    
    validCurrencies.forEach(currency => {
      result[currency] = this.getLogoUrl(currency);
    });
    
    return result;
  }

  /**
   * Check if a currency has a logo URL (not emoji)
   */
  hasLogoUrl(currency: string | undefined | null): boolean {
    if (!currency || typeof currency !== 'string') {
      return false;
    }
    
    const normalizedCurrency = currency.toUpperCase();
    return !!this.LOGO_URLS[normalizedCurrency];
  }
}

// Export singleton instance
export const cryptoLogoService = new CryptoLogoService();
export default cryptoLogoService;