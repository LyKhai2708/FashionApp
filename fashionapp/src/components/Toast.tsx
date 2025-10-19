import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    bg: 'bg-[#C4F9E2]',
    textColor: 'text-[#004434]',
    icon: (
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={10} cy={10} r={10} fill="#00B078" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.1203 6.78954C14.3865 7.05581 14.3865 7.48751 14.1203 7.75378L9.12026 12.7538C8.85399 13.02 8.42229 13.02 8.15602 12.7538L5.88329 10.4811C5.61703 10.2148 5.61703 9.78308 5.88329 9.51682C6.14956 9.25055 6.58126 9.25055 6.84753 9.51682L8.63814 11.3074L13.156 6.78954C13.4223 6.52328 13.854 6.52328 14.1203 6.78954Z"
          fill="white"
        />
      </svg>
    )
  },
  error: {
    bg: 'bg-[#FFE5E5]',
    textColor: 'text-[#C41E3A]',
    icon: (
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={10} cy={10} r={10} fill="#C41E3A" />
        <path
          d="M13 7L7 13M7 7L13 13"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    )
  },
  warning: {
    bg: 'bg-[#FFF4E5]',
    textColor: 'text-[#FF9800]',
    icon: (
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={10} cy={10} r={10} fill="#FF9800" />
        <path
          d="M10 6V11M10 14V14.5"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    )
  },
  info: {
    bg: 'bg-[#E3F2FD]',
    textColor: 'text-[#1976D2]',
    icon: (
      <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={10} cy={10} r={10} fill="#1976D2" />
        <path
          d="M10 14V10M10 6V6.5"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    )
  }
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  const config = toastConfig[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className="toast-slide-in mb-3 animate-slide-in-right">
      <div className={`rounded-lg ${config.bg} p-4 shadow-lg min-w-[300px] max-w-[500px]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="pr-3 flex-shrink-0">
              {config.icon}
            </span>
            <p className={`text-sm font-medium ${config.textColor}`}>
              {message}
            </p>
          </div>
          <button
            onClick={() => onClose(id)}
            className={`flex-shrink-0 ml-4 ${config.textColor} hover:opacity-70 transition-opacity`}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
