import { handleEbirdProxy } from "../ebirdProxyHandler";

function makeFetch(responses) {
  return jest.fn(async () => responses.shift());
}

function mockResponse({ status = 200, body = "{}", text } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text ?? body,
  };
}

describe("handleEbirdProxy", () => {
  test("rejects disallowed paths with 400", async () => {
    const res = await handleEbirdProxy({
      path: "product/spplist/US-TX-303",
      query: {},
      apiKey: "KEY",
      fetchFn: jest.fn(),
    });
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(JSON.parse(res.body).error).toMatch(/not allowed/i);
  });

  test("rejects when api key is missing with 500", async () => {
    const res = await handleEbirdProxy({
      path: "data/obs/US-TX-303/recent",
      query: {},
      apiKey: "",
      fetchFn: jest.fn(),
    });
    expect(res.status).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/api key/i);
  });

  test("calls upstream with X-eBirdApiToken and forwards JSON", async () => {
    const fetchFn = makeFetch([mockResponse({ status: 200, body: '[{"x":1}]' })]);
    const res = await handleEbirdProxy({
      path: "data/obs/US-TX-303/recent",
      query: { back: "14" },
      apiKey: "KEY",
      fetchFn,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.ebird.org/v2/data/obs/US-TX-303/recent?back=14");
    expect(init.headers["X-eBirdApiToken"]).toBe("KEY");
    expect(res.status).toBe(200);
    expect(res.body).toBe('[{"x":1}]');
    expect(res.headers["cache-control"]).toMatch(/s-maxage=300/);
  });

  test("applies 30-day cache header for historic paths", async () => {
    const fetchFn = makeFetch([mockResponse({ body: "[]" })]);
    const res = await handleEbirdProxy({
      path: "data/obs/US-TX-303/historic/2025/4/15",
      query: {},
      apiKey: "KEY",
      fetchFn,
    });
    expect(res.headers["cache-control"]).toMatch(/s-maxage=2592000/);
  });

  test("mirrors upstream non-2xx status and body", async () => {
    const fetchFn = makeFetch([mockResponse({ status: 404, text: "not found" })]);
    const res = await handleEbirdProxy({
      path: "data/obs/US-XX-999/recent",
      query: {},
      apiKey: "KEY",
      fetchFn,
    });
    expect(res.status).toBe(404);
    expect(res.body).toBe("not found");
    // no cache header on upstream errors
    expect(res.headers["cache-control"]).toBeUndefined();
  });
});
