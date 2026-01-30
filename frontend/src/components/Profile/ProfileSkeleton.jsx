// app/profile/components/ProfileSkeleton.jsx
"use client";

export default function ProfileSkeleton({ isDark }) {
  const shimmer = isDark
    ? "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800"
    : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200";

  return (
    <div
      className={`min-h-screen p-4 md:p-6 lg:p-8 ${
        isDark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Nav skeleton */}
        <div className="flex justify-between">
          <div className={`h-10 w-24 rounded-xl animate-pulse ${shimmer}`} />
          <div className={`h-10 w-64 rounded-xl animate-pulse ${shimmer}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar skeleton */}
          <div
            className={`rounded-2xl p-6 ${isDark ? "bg-slate-900" : "bg-white"}`}
          >
            <div
              className={`h-28 w-full rounded-xl mb-4 animate-pulse ${shimmer}`}
            />
            <div
              className={`h-28 w-28 mx-auto rounded-2xl mb-4 animate-pulse ${shimmer}`}
            />
            <div
              className={`h-6 w-32 mx-auto rounded mb-2 animate-pulse ${shimmer}`}
            />
            <div
              className={`h-4 w-24 mx-auto rounded animate-pulse ${shimmer}`}
            />
          </div>

          {/* Main content skeleton */}
          <div
            className={`lg:col-span-2 rounded-2xl p-6 ${isDark ? "bg-slate-900" : "bg-white"}`}
          >
            <div className={`h-8 w-48 rounded mb-6 animate-pulse ${shimmer}`} />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-20 w-full rounded-xl animate-pulse ${shimmer}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
