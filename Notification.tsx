
import React, { useEffect } from 'react';
import { XIcon } from './Icons';
import { playNotificationSound, playClickSound } from '../audio';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    playNotificationSound();
    const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    playClickSound();
    onClose();
  }

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-slide-down-fade">
      <div className="relative rounded-full p-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600" style={{ backgroundSize: '200% 200%', animation: 'animated-gradient-border 4s ease infinite' }}>
        <div className="flex items-center justify-between gap-4 bg-slate-900 text-white rounded-full px-6 py-2">
          <p className="text-sm font-bold text-glow-gradient">{message}</p>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close notification"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
