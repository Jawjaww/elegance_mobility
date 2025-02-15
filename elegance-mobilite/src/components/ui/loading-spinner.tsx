export function LoadingSpinner() {
  return (
    <div className="min-h-[500px] flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-neutral-400">Chargement...</span>
        </div>
      </div>
    </div>
  );
}