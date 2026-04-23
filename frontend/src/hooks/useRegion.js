import { useCallback, useEffect, useState } from "react";
import { DEFAULT_REGION } from "../services/regions";

const KEY = "wildtrack.region";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_REGION;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.regionCode && parsed.label) return parsed;
    return DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}

export function useRegion() {
  const [region, setRegionState] = useState(read);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(region)); } catch {}
  }, [region]);

  const setRegion = useCallback((next) => {
    if (next && next.regionCode && next.label) setRegionState(next);
  }, []);

  return { region, setRegion };
}
