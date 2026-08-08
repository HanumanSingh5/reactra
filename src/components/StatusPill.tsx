export default function StatusPill({
  status,
}: {
  status: "pending" | "qualified" | "eliminated";
}) {
  const styles = {
    pending: "bg-amber/15 text-amber border-amber/30",
    qualified: "bg-success/15 text-success border-success/30",
    eliminated: "bg-danger/15 text-danger border-danger/30",
  };
  const labels = {
    pending: "Pending",
    qualified: "Qualified",
    eliminated: "Not Qualified",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${styles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
