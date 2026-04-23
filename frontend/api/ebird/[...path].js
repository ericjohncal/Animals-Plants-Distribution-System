const { handleEbirdProxy } = require("../../src/services/ebirdProxyHandler");

module.exports = async (req, res) => {
  const rawPath = req.query.path;
  const path = Array.isArray(rawPath) ? rawPath.join("/") : (rawPath || "");

  const { status, body, headers } = await handleEbirdProxy({
    path,
    query: req.query,
    apiKey: process.env.EBIRD_API_KEY,
    fetchFn: fetch,
  });

  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, v);
  }
  res.status(status).send(body);
};
