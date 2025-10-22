// src/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; msg?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";
    return { hasError: true, msg: String(msg) };
  }

  componentDidCatch(error: any, info: any) {
    console.error("💥 React error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>😬 Something crashed while rendering.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.msg}</pre>
          <p>Open DevTools → Console for the exact file/line.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
