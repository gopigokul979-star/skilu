
import React, { useEffect, useState } from 'react';
import { X, Video, ArrowRight, Clock } from 'lucide-react';
import { ClassSession } from '../types';

interface ClassNotificationProps {
  session: ClassSession;
  onClose: () => void;
}

const ClassNotification: React.FC<ClassNotificationProps> = ({ session, onClose }) => {
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
  }, [session.id]); // Re-run effect if session ID changes

  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation to finish before unmounting
    setTimeout(onClose, 300); 
  };

  const handleJoin = () => {
    if (session.url) {
      window.open(session.url, '_blank');
    }
    handleClose();
  };

  const getTimeMessage = () => {
    // Priority check: If status is explicitly LIVE, show Live Now
    if (session.status === 'LIVE') {
      return { text: 'Live Now', isUrgent: true };
    }

    if (!session.timestamp) return { text: session.startTime, isUrgent: false };

    const now = Date.now();
    const diff = session.timestamp - now;
    const minutes = Math.ceil(diff / 60000);

    if (minutes <= 0) {
      return { text: 'Live Now', isUrgent: true };
    }
    
    const minText = minutes === 1 ? 'min' : 'mins';
    return { text: `Starts in ${minutes} ${minText}`, isUrgent: minutes <= 5 };
  };

  const timeInfo = getTimeMessage();

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
    }`}>
      <div className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl w-80 flex flex-col relative overflow-hidden ring-1 ring-slate-100">
        
        {/* Main Content */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start pl-1">
            <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider px-2 py-1 rounded-full ${
              timeInfo.isUrgent ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                   timeInfo.isUrgent ? 'bg-red-400' : 'bg-blue-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                   timeInfo.isUrgent ? 'bg-red-500' : 'bg-blue-500'
                }`}></span>
              </span>
              <span>{timeInfo.isUrgent ? 'Live Class Starting' : 'Upcoming Class'}</span>
            </div>
            <button 
              onClick={handleClose} 
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors -mt-1 -mr-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="pl-1">
            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{session.title}</h4>
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                <span>{timeInfo.text}</span>
              </div>
              <span className="text-slate-300">•</span>
              <span>{session.startTime}</span>
              <span className="text-slate-300">•</span>
              <span>{session.subject}</span>
            </div>
          </div>

          <button 
            onClick={handleJoin}
            disabled={!session.url}
            className="mt-1 bg-slate-900 hover:bg-blue-600 text-white text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md group disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <Video size={16} className="group-hover:animate-pulse" />
            <span className="font-semibold">{session.url ? "Join Class Now" : "No Link"}</span>
            <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Timeout Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
            <div 
                className="h-full bg-red-500/20"
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

export default ClassNotification;