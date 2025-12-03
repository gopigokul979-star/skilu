
import React from 'react';
import { X, User as UserIcon, Calendar, Users, Megaphone } from 'lucide-react';
import { Announcement } from '../types';
import { MOCK_BATCHES } from '../data/mockData';

interface NotificationDetailModalProps {
  announcement: Announcement;
  onClose: () => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ announcement, onClose }) => {
  
  const getTargetAudience = () => {
    switch(announcement.targetType) {
      case 'ALL_USERS':
        return 'All Institute Members';
      case 'BATCH':
        const batchNames = announcement.targetIds
          ?.map(id => MOCK_BATCHES.find(b => b.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        return `Batch: ${batchNames || 'N/A'}`;
      case 'SPECIFIC_STUDENTS':
        return `Specific Students (${announcement.targetIds?.length || 0})`;
      default:
        return 'General';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex items-start gap-4">
            <div className="bg-white text-blue-600 p-3 rounded-xl border border-slate-200 shadow-sm">
              <Megaphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{announcement.title}</h2>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1.5"><UserIcon size={12} /> {announcement.senderName}</div>
                <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(announcement.createdAt).toLocaleString()}</div>
                <div className="flex items-center gap-1.5"><Users size={12} /> For: {getTargetAudience()}</div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button 
             onClick={onClose}
             className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;