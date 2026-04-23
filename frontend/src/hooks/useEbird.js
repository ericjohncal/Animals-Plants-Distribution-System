import { useEffect, useRef, useState } from "react";

export function useEbird(fetcher, key) {
  const [state, setState] = useState({ loading: !!key, data: null, error: null });
  const fetcherRef = useRef(fetcher);
  const keyRef = useRef(key);
  fetcherRef.current = fetcher;
  keyRef.current = key;

  const serialized = JSON.stringify(key);
  useEffect(() => {
    const currentKey = keyRef.current;
    if (!currentKey) { setState({ loading: false, data: null, error: null }); return; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(fetcherRef.current())
      .then((data) => { if (!cancelled) setState({ loading: false, data, error: null }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, data: null, error }); });
    return () => { cancelled = true; };
  }, [serialized]);

  return state;
}
