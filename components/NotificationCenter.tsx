
import React from 'react';
import { Bell, X, Calendar, Users, Megaphone, CheckCircle } from 'lucide-react';
import { Announcement, User, UserRole } from '../types';

interface NotificationCenterProps {
  currentUser: User;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  onClose: () => void;
  onNotificationClick: (announcement: Announcement) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ currentUser, announcements, setAnnouncements, onClose, onNotificationClick }) => {
  
  const handleMarkAllRead = () => {
    setAnnouncements(prev => prev.map(a => ({...a, isRead: true})));
  };
  
  const handleItemClick = (ann: Announcement) => {
    // Mark as read locally
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? {...a, isRead: true} : a));
    // Pass up to open modal
    onNotificationClick(ann);
  };

  // Filter logic for viewing
  const myAnnouncements = announcements.filter(ann => {
    if (ann.scheduledFor && ann.scheduledFor > Date.now() && currentUser.role === UserRole.STUDENT) return false;
    if (ann.targetType === 'ALL_USERS') return true;
    if (ann.targetType === 'BATCH' && currentUser.enrolledBatchIds) {
      return ann.targetIds?.some(id => currentUser.enrolledBatchIds?.includes(id));
    }
    if (ann.targetType === 'SPECIFIC_STUDENTS') {
      return ann.targetIds?.includes(currentUser.id);
    }
    if (currentUser.role !== UserRole.STUDENT) return true;
    return false;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const unreadCount = myAnnouncements.filter(a => !a.isRead).length;

  const getIcon = (ann: Announcement) => {
    if (ann.title.toLowerCase().includes('exam') || ann.title.toLowerCase().includes('test')) {
      return <Calendar size={18} className="text-amber-500" />;
    }
    if (ann.targetType === 'BATCH') {
      return <Users size={18} className="text-purple-500" />;
    }
    return <Megaphone size={18} className="text-blue-500" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] sm:max-h-[500px] animate-in fade-in slide-in-from-top-2">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Bell size={18} className="text-blue-600" />
          Notifications
          {unreadCount > 0 && <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 bg-slate-50/50">
        <div className="divide-y divide-slate-100">
          {myAnnouncements.length > 0 ? myAnnouncements.map(ann => (
            <div 
              key={ann.id} 
              onClick={() => handleItemClick(ann)}
              className={`p-4 transition-colors cursor-pointer relative group ${ann.isRead ? 'bg-slate-50/50 hover:bg-white' : 'bg-blue-50/50 hover:bg-white'}`}
            >
               {!ann.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></div>}
               <div className="flex items-start gap-3 ml-2">
                 <div className="mt-1">{getIcon(ann)}</div>
                 <div className="flex-1">
                    <h4 className={`font-bold text-slate-800 text-sm mb-1 ${!ann.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{ann.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{ann.content}</p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                 </div>
               </div>
            </div>
          )) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400"/>
              You're all caught up!
            </div>
          )}
        </div>
      </div>

      {myAnnouncements.length > 0 && (
        <div className="p-2 border-t border-slate-100 bg-white sticky bottom-0">
          <button 
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
