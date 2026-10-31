export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <span className="text-xs font-medium text-surface-500">Preparing client workspace...</span>
    </div>
  );
}
