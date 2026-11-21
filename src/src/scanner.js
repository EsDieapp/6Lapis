
const WATCHLIST = [];

function analyzeToken(token) {
  const checks = {
    liquidity: Number(token.liquidity || 0) >= 10000,
    volume: Number(token.volume24h || 0) >= 5000,
    holders: Number(token.holders || 0) >= 100,
    contractVerified: token.contractVerified === true,
    sellEnabled: token.sellEnabled === true,
    activeTrading: Number(token.trades24h || 0) >= 50
  };

  const score = Object.values(checks).filter(Boolean).length;

  let decision = "SKIP";

  if (score >= 5) decision = "WATCH_CANDIDATE";
  if (score === 6) decision = "STRONG_CANDIDATE";

  return {
    token: token.symbol || "UNKNOWN",
    address: token.address || null,
    score: `${score}/6`,
    checks,
    decision,
    tradingEnabled: false
  };
}

function scanTokens(tokens = WATCHLIST) {
  return tokens.map(analyzeToken);
}

module.exports = {
  analyzeToken,
  scanTokens
};
