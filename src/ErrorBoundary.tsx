import React from "react";

type State = { hasError: boolean; message?: string; stack?: string };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any): State {
    return { hasError: true, message: String(err?.message || err), stack: String(err?.stack || "") };
  }

  componentDidCatch(err: any, info: any) {
    console.error("App crash:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: "system-ui" }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.message}</pre>
          <details>
            <summary>Stack</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.stack}</pre>
          </details>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

