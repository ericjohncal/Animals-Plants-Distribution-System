import { renderHook, waitFor } from "@testing-library/react";
import { useEbird } from "../useEbird";

test("starts in loading state, resolves with data", async () => {
  const fetcher = jest.fn().mockResolvedValue([{ x: 1 }]);
  const { result } = renderHook(() => useEbird(fetcher, ["key"]));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual([{ x: 1 }]);
  expect(result.current.error).toBe(null);
});

test("surfaces errors", async () => {
  const fetcher = jest.fn().mockRejectedValue(new Error("boom"));
  const { result } = renderHook(() => useEbird(fetcher, ["key"]));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error.message).toBe("boom");
  expect(result.current.data).toBe(null);
});

test("skips when key is null", async () => {
  const fetcher = jest.fn();
  const { result } = renderHook(() => useEbird(fetcher, null));
  expect(result.current.loading).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
