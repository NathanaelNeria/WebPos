// src/Components/ApiErrorBoundary.jsx
import { Component } from "react";
import { WifiOff, Server, AlertCircle } from "lucide-react";

export class ApiErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasApiError: false,
      errorType: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Determine error type
    let errorType = "unknown";

    if (error.message.includes("network") || error.message.includes("fetch")) {
      errorType = "network";
    } else if (error.message.includes("timeout")) {
      errorType = "timeout";
    } else if (error.message.includes("server")) {
      errorType = "server";
    }

    return {
      hasApiError: true,
      errorType,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("API Error:", error);

    // You can log to monitoring service
    this.logApiError(error);
  }

  logApiError = (error) => {
    // Log to your monitoring service (Sentry, LogRocket, etc.)
    const errorData = {
      type: "api_error",
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
    };

    console.log("📤 Sending error to monitoring service:", errorData);
  };

  handleRetry = () => {
    this.setState((prev) => ({
      hasApiError: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleGoOffline = () => {
    // Implement offline mode logic
    localStorage.setItem("offline_mode", "true");
    window.location.reload();
  };

  renderErrorUI = () => {
    const { errorType, errorMessage, retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Gagal Memuat Data</h3>
              <p className="text-sm text-red-600 mt-1">
                Sudah mencoba {retryCount} kali. Silakan refresh halaman atau
                hubungi admin.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition-colors"
              >
                Refresh Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (errorType) {
      case "network":
        return (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Koneksi Terputus
                </h3>
                <p className="text-sm text-yellow-600 mt-1">
                  Tidak dapat terhubung ke server. Periksa koneksi internet
                  Anda.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={this.handleRetry}
                    className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded transition-colors"
                  >
                    Coba Lagi ({retryCount + 1}/{maxRetries})
                  </button>
                  <button
                    onClick={this.handleGoOffline}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
                  >
                    Mode Offline
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "server":
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Server className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Server Error</h3>
                <p className="text-sm text-red-600 mt-1">
                  Terjadi kesalahan pada server. Silakan coba beberapa saat
                  lagi.
                </p>
                <button
                  onClick={this.handleRetry}
                  className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-800">Terjadi Kesalahan</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {errorMessage || "Gagal memuat data. Silakan coba lagi."}
                </p>
                <button
                  onClick={this.handleRetry}
                  className="mt-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  render() {
    if (this.state.hasApiError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Hook untuk handle API errors
export const useApiErrorHandler = () => {
  const handleApiError = async (error, operation = "") => {
    console.error(`API Error in ${operation}:`, error);

    // Check error type
    let errorType = "unknown";
    let userMessage = "Terjadi kesalahan";

    if (!navigator.onLine) {
      errorType = "offline";
      userMessage = "Anda sedang offline";
    } else if (error.code === "permission-denied") {
      errorType = "permission";
      userMessage = "Tidak memiliki izin";
    } else if (error.code === "unavailable") {
      errorType = "unavailable";
      userMessage = "Layanan tidak tersedia";
    }

    // Return structured error
    return {
      success: false,
      error: {
        type: errorType,
        message: error.message,
        userMessage,
        code: error.code,
        operation,
      },
      timestamp: new Date().toISOString(),
    };
  };

  const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        return { success: true, data: result, retries: i + 1 };
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  };

  return { handleApiError, retryOperation };
};
