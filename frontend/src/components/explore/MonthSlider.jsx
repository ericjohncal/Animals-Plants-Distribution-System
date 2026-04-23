import React from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function MonthSlider({ value, onChange }) {
  return (
    <div className="month-slider-row">
      <input
        type="range"
        min={1}
        max={12}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="month-slider"
        aria-label="Month"
      />
      <span className="month-name">{MONTHS[value - 1]}</span>
    </div>
  );
}
