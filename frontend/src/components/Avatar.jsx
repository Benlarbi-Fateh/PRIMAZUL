export default function Avatar({ src, alt = "User", size = "md" }) {
  const sizeMap = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-lg",
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const initials = alt
    ?.trim()
    ?.split(" ")
    ?.map((w) => w[0]?.toUpperCase())
    ?.join("")
    ?.slice(0, 2);

  return (
    <div
      className={`overflow-hidden rounded-full bg-slate-700 text-slate-200 flex items-center justify-center ${selectedSize}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-semibold">{initials || "U"}</span>
      )}
    </div>
  );
}
