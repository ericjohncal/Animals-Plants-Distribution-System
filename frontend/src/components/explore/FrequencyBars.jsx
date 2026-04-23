import React, { useMemo } from "react";

export function FrequencyBars({ month, rows, onSelect }) {
  const max = useMemo(
    () => Math.max(1, ...rows.map((r) => r.monthCounts[month - 1])),
    [rows, month]
  );
  return (
    <ul className="freq-bars">
      {rows.map((r) => {
        const count = r.monthCounts[month - 1];
        const pct = Math.round((count / max) * 100);
        return (
          <li key={r.speciesCode} data-species={r.speciesCode} data-count={count}>
            <button
              type="button"
              className="freq-row"
              onClick={() => onSelect(r)}
            >
              <span className="freq-name">{r.comName}</span>
              <span className="freq-bar" style={{ width: `${pct}%` }} />
              <span className="freq-count">{count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
