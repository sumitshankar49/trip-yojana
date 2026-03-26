export default function ItineraryLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
          <div className="lg:col-span-3">
            <div className="h-150 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
