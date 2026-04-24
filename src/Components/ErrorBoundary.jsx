// src/Components/ErrorBoundary.jsx
import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Error Display Component
function ErrorDisplay({ error, errorInfo, onRetry, onGoHome }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-50 mb-6 shadow-lg">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Oops! Terjadi Error
          </h1>
          <p className="text-gray-600 mb-2">
            Maaf, terjadi kesalahan yang tidak terduga
          </p>
        </div>

        {/* Error Details (Collapsible) */}
        <div className="mb-8">
          <details className="bg-white rounded-lg shadow border overflow-hidden">
            <summary className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer font-medium text-gray-700">
              Detail Error
            </summary>
            <div className="p-4 text-left">
              <div className="mb-3">
                <span className="font-medium text-gray-700">Error:</span>
                <p className="mt-1 text-sm text-red-600 font-mono p-3 bg-red-50 rounded">
                  {error?.toString()}
                </p>
              </div>

              {errorInfo?.componentStack && (
                <div>
                  <span className="font-medium text-gray-700">
                    Stack Trace:
                  </span>
                  <pre className="mt-1 text-xs text-gray-600 p-3 bg-gray-50 rounded overflow-x-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <RefreshCw size={18} />
            <span>Coba Lagi</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-medium rounded-xl transition-all duration-300 shadow hover:shadow-md"
          >
            <Home size={18} />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>

        {/* Debug Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Jika masalah berlanjut, hubungi tim teknis dengan screenshot ini
          </p>
          <div className="mt-2 text-xs text-gray-400 space-y-1">
            <p>URL: {window.location.href}</p>
            <p>Browser: {navigator.userAgent}</p>
            <p>Waktu: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Boundary Class Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("🔴 ErrorBoundary caught an error:", error);
    console.error("🔴 Error info:", errorInfo);

    // Save error info for display
    this.setState({
      errorInfo,
      error,
    });

    // Log to console with more details
    console.group("🛑 Application Error Details");
    console.error("Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.groupEnd();

    // You could send this to a logging service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optional: force a hard refresh for critical errors
    if (this.state.error?.message?.includes("ChunkLoadError")) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = (error, context = "") => {
    console.error(`Error in ${context}:`, error);

    // You can add custom error handling logic here
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      navigate("/login");
    } else if (error.response?.status === 403) {
      // Forbidden - show access denied
      navigate("/unauthorized");
    }

    // Return error for further handling
    return error;
  };

  return { handleError };
};

// Simple Error Fallback Component (for Suspense boundaries)
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Terjadi Kesalahan</h3>
          <p className="text-sm text-red-600 mt-1">
            {error?.message || "Unknown error"}
          </p>
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition-colors"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Error Boundary with Fallback prop
export class ErrorBoundaryWithFallback extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleRetry,
        });
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
