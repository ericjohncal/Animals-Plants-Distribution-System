import { useEffect, useRef, useState } from "react";

export function useEbird(fetcher, key) {
  const [state, setState] = useState({ loading: !!key, data: null, error: null });
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const serialized = JSON.stringify(key);
  useEffect(() => {
    if (!key) { setState({ loading: false, data: null, error: null }); return; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(fetcher())
      .then((data) => { if (!cancelled) setState({ loading: false, data, error: null }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, data: null, error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return state;
}
