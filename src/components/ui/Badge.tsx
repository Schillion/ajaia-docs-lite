export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "owned" | "shared";
}) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-600",
    owned: "bg-indigo-50 text-indigo-700",
    shared: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses}`}>
      {children}
    </span>
  );
}
