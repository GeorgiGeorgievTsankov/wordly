export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      <p className="text-sm font-medium text-slate-500">Loading Wordly...</p>
    </div>
  );
}

