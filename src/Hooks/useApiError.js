// src/Hooks/useApiError.js
import { useCallback } from "react";
import Swal from "sweetalert2";
import { useApiErrorHandler } from "../Components/ApiErrorBoundary";

export const useApiError = () => {
  const { handleApiError, retryOperation } = useApiErrorHandler();

  const showErrorToast = useCallback((error) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: error.userMessage || "Terjadi kesalahan",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }, []);

  const handleApiCall = useCallback(
    async (apiCall, options = {}) => {
      const {
        showToast = true,
        maxRetries = 0,
        retryDelay = 1000,
        operationName = "operation",
      } = options;

      try {
        let result;

        if (maxRetries > 0) {
          result = await retryOperation(apiCall, maxRetries, retryDelay);
        } else {
          result = await apiCall();
        }

        return { success: true, data: result };
      } catch (error) {
        const handledError = await handleApiError(error, operationName);

        if (showToast) {
          showErrorToast(handledError.error);
        }

        return {
          success: false,
          error: handledError,
          shouldRetry:
            handledError.error.type === "network" ||
            handledError.error.type === "timeout",
        };
      }
    },
    [handleApiError, retryOperation, showErrorToast],
  );

  const firebaseTransaction = useCallback(
    async (transactionFunc, options = {}) => {
      const { showToast = true } = options;

      return handleApiCall(
        async () => {
          // Implementasi Firestore transaction
          const result = await transactionFunc();
          return result;
        },
        {
          operationName: "firebase_transaction",
          showToast,
          maxRetries: 2, // Retry untuk firebase errors
        },
      );
    },
    [handleApiCall],
  );

  return {
    handleApiCall,
    firebaseTransaction,
    showErrorToast,
    handleApiError,
    retryOperation,
  };
};
