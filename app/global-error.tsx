"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-pe-primary-600 text-white rounded-lg hover:bg-pe-primary-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

