
export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        name: "6LAPIS",
        status: "ONLINE",
        mode: "SIMULATION",
        trading: false,
        message: "6LAPIS Worker is running"
      });
    }

    if (url.pathname === "/health") {
      return Response.json({
        healthy: true,
        scanner: "READY",
        trading: false
      });
    }

    if (url.pathname === "/scan" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          { error: "Invalid JSON" },
          { status: 400 }
        );
      }

      if (!Array.isArray(body.tokens) || body.tokens.length > 100) {
        return Response.json(
          { error: "Invalid token list" },
          { status: 400 }
        );
      }

      return Response.json({
        system: "6LAPIS",
        mode: "SIMULATION",
        trading: false,
        results: body.tokens.map(token => ({
          token: token.symbol || "UNKNOWN",
          address: token.address || null,
          decision: "PENDING_REAL_DATA",
          tradingEnabled: false
        }))
      });
    }

    return Response.json(
      { error: "Not found" },
      { status: 404 }
    );
  }
};
