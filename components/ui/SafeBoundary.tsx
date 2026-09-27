// Error boundary for decorative/optional UI (e.g. the WebGL globe rendered in a
// WebView on native). A failure there must never take the whole screen down.
// Error boundary para UI decorativa: se falhar, some em silencio sem derrubar a tela.

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { failed: boolean };

export class SafeBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Decorative only: nothing to report to the user.
  }

  render(): ReactNode {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
