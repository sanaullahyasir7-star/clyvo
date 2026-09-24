"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="center-page">
      <div>
        <h1>Something went wrong.</h1>
        <p>
          Your saved browser data is still available. Try opening this page
          again.
        </p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
