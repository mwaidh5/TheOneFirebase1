import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches a render crash on the current screen so the user sees a message and
// a way out instead of a blank white app. Mount it with `key={pathname}` so
// navigating to another screen clears the error automatically.
export default class ErrorBoundary extends Component<Props, State> {
  // The project has no @types/react, so Component's members aren't visible to
  // tsc. Declare the two we use rather than pulling the types in with a hotfix.
  declare readonly props: Readonly<Props>;
  state: State = { error: null };

  private reset = () => (this as unknown as { setState: (s: State) => void }).setState({ error: null });

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h1 className="text-xl font-black font-display uppercase tracking-tight text-black">Something went wrong</h1>
          <p className="text-sm text-neutral-500 font-medium">
            This screen hit an error. Your progress is saved — try again, or head back home.
          </p>
          <p className="text-[11px] font-mono text-neutral-400 bg-neutral-50 rounded-xl px-3 py-2 break-words text-start" dir="ltr">
            {this.state.error.message}
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <button
              onClick={this.reset}
              className="px-5 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest"
            >
              Try again
            </button>
            <a href="/" className="px-5 py-3 bg-neutral-100 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest">
              Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
