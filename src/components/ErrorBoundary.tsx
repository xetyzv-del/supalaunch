import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected interface error.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[CivilEdge ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h1 className="font-serif text-lg font-bold text-slate-900">
              Study Workspace Interrupted
            </h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {this.state.message || 'An unexpected error occurred while rendering this workspace.'}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Resume Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }
}
