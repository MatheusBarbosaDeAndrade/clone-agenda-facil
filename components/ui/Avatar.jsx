export default function Avatar({ name, url, size = "md" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border border-gray-200`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-[#1B2A4E] text-white font-semibold flex items-center justify-center border border-gray-200`}
    >
      {initials}
    </div>
  );
}
