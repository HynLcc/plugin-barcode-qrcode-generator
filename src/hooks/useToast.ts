import { toast } from 'sonner';
import type { ToastType } from '../types';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const showToast = (
    type: ToastType,
    message: string,
    description?: string,
    options?: ToastOptions
  ) => {
    const toastFn = toast[type];
    const fullMessage = description ? `${message}: ${description}` : message;

    toastFn(fullMessage, {
      duration: getDuration(type),
      position: 'top-right',
      action: options?.action,
    });
  };

  const showSuccess = (message: string, description?: string, options?: ToastOptions) => {
    showToast('success', message, description, options);
  };

  const showError = (message: string, description?: string, options?: ToastOptions) => {
    showToast('error', message, description, options);
  };

  const showWarning = (message: string, description?: string, options?: ToastOptions) => {
    showToast('warning', message, description, options);
  };

  const showInfo = (message: string, description?: string, options?: ToastOptions) => {
    showToast('info', message, description, options);
  };

  const showLoading = (message: string, description?: string, _options?: ToastOptions) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    return toast.loading(fullMessage, {
      position: 'top-right',
    });
  };

  const dismiss = (id?: string | number) => {
    toast.dismiss(id);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
  };
};

/**
 * 根据类型获取默认持续时间
 */
function getDuration(type: ToastType): number {
  switch (type) {
    case 'success':
      return 3000;
    case 'error':
      return 5000;
    case 'warning':
      return 4000;
    case 'info':
    default:
      return 3000;
  }
}