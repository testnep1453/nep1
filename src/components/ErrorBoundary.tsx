import { Component, ErrorInfo, ReactNode } from 'react';
import { logManualError } from '../services/errorLogger';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary yakaladı:', error, info.componentStack);
    logManualError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center p-4">
          <div className="bg-[#0A1128] border border-[#FF4500]/30 rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-[#FF4500] mb-2 uppercase tracking-wider">
              Sistem Hatası
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {this.props.fallbackMessage || 'Bir hata oluştu. Lütfen sayfayı yeniden yükleyin.'}
            </p>
            {this.state.error && (
              <p className="text-gray-600 text-xs font-mono mb-6 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-[#FF4500]/20 hover:bg-[#FF4500] text-[#FF4500] hover:text-black border border-[#FF4500] px-6 py-3 font-bold transition-all uppercase tracking-widest rounded"
            >
              Yeniden Yükle
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



