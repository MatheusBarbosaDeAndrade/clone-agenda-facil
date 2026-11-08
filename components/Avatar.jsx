import { initials } from "lib/format.js";

const PALETTE = [
  "#1b2a4a",
  "#2d3f66",
  "#3b82f6",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#be123c",
  "#0369a1",
];

function colorFor(name) {
  let hash = 0;
  for (const char of String(name || ""))
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name, src, size = 40, square = false }) {
  return (
    <span
      className={`avatar ${square ? "avatar-square" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: src ? "#e5e7eb" : colorFor(name),
      }}
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" width={size} height={size} loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
