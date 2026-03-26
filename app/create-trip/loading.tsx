export default function CreateTripLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 animate-pulse">
          <div className="space-y-6">
            <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
