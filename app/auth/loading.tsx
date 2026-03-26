export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] dark:bg-zinc-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-600 dark:text-zinc-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
