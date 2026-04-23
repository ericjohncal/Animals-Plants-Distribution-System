const { isAllowedPath, cacheHeaderFor } = require("./ebirdProxyConfig");

const EBIRD_BASE = "https://api.ebird.org/v2";

function json(status, obj) {
  return {
    status,
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json; charset=utf-8" },
  };
}

async function handleEbirdProxy({ path, query, apiKey, fetchFn = fetch }) {
  if (!isAllowedPath(path)) {
    return json(400, { error: "endpoint not allowed" });
  }
  if (!apiKey) {
    return json(500, { error: "api key not configured" });
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (k === "path") continue;
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v != null)   qs.append(k, String(v));
  }
  const qsString = qs.toString();
  const url = `${EBIRD_BASE}/${path}${qsString ? `?${qsString}` : ""}`;

  let upstream;
  try {
    upstream = await fetchFn(url, {
      headers: { "X-eBirdApiToken": apiKey },
    });
  } catch (err) {
    return json(502, { error: "upstream fetch failed" });
  }
  const body = await upstream.text();

  if (!upstream.ok) {
    return {
      status: upstream.status,
      body,
      headers: { "content-type": "application/json; charset=utf-8" },
    };
  }

  return {
    status: 200,
    body,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheHeaderFor(path),
    },
  };
}

module.exports = { handleEbirdProxy };
