import { Component, type ReactNode } from 'react';

// Catches errors in the page below it (for example a PDF library that fails to load
// when offline) and shows a message, instead of the whole app going blank.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">This page could not be loaded.</p>
          <p className="mt-1">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
