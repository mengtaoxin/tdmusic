import { Component, type ErrorInfo, type ReactNode } from 'react';

import { handleChunkLoadFailure, isChunkLoadError } from '@/lib/spaUpdateNotice';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    if (isChunkLoadError(error)) return { hasError: true };
    throw error;
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    if (isChunkLoadError(error)) {
      handleChunkLoadFailure();
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
