import Navbar from "@/packages/components/shared/Navbar";

export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-5 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>

          {/* Tabs Skeleton */}
          <div className="mb-6 flex gap-2">
            <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>

          {/* Notification Items Skeleton */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
