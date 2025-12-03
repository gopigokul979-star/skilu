
import React, { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { ToastNotification } from '../types';

interface GenericNotificationProps {
  notification: ToastNotification;
  onClose: () => void;
}

const GenericNotification: React.FC<GenericNotificationProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState('100%');
  const DURATION = 8000; // 8 seconds

  useEffect(() => {
    // Entrance animation
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
      // Start progress bar animation after toast is visible
      setTimeout(() => setProgressWidth('0%'), 50); 
    }, 100);
    
    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, DURATION);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification.id]); // Re-run effect if notification ID changes

  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation to finish before calling parent onClose
    setTimeout(onClose, 300); 
  };

  const getIconAndColor = () => {
    switch (notification.type) {
      case 'warning':
        return { icon: <AlertTriangle size={20} />, color: 'amber' };
      case 'success':
        return { icon: <CheckCircle size={20} />, color: 'emerald' };
      case 'error':
        return { icon: <X size={20} />, color: 'red' };
      case 'info':
      default:
        return { icon: <Info size={20} />, color: 'blue' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
    }`}>
      <div className={`bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl w-80 flex gap-4 p-4 relative overflow-hidden ring-1 ring-slate-100`}>
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 bg-${color}-50 text-${color}-600 rounded-full flex items-center justify-center`}>
            {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm">{notification.title}</h4>
          <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
        </div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={16} />
        </button>

        {/* Timeout Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
            <div 
                className={`h-full bg-${color}-500/20`}
                style={{ 
                    width: progressWidth, 
                    transition: `width ${DURATION}ms linear`
                }}
            />
        </div>
      </div>
    </div>
  );
};

export default GenericNotification;