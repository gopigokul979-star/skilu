
import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import { UserRole, ClassSession, User, Announcement, FeeStructure, PaymentRecord, ToastNotification, AttendanceRecord } from '../types';
import { Bell, Search, Menu, X, Video, ArrowRight, Clock, User as UserIcon, Calendar, Book, Upload, FileText, Shield, Save, Camera, Lock, CreditCard, Printer, Info, AlertTriangle, CheckCircle, Plus, Trash2, Layers, BookOpen, GraduationCap, Megaphone, Send, TrendingUp, Phone, MapPin, BarChart2 } from 'lucide-react'; // Added all potentially used icons
import ClassNotification from './ClassNotification';
import UserProfileModal from './UserProfileModal';
import NotificationCenter from './NotificationCenter';
import NotificationDetailModal from './NotificationDetailModal';
import ChatWidget from './ChatWidget'; // Make sure ChatWidget is imported
import { UPCOMING_CLASSES, TEACHER_CLASSES, MOCK_ATTENDANCE_RECORDS } from '../data/mockData';
import GenericNotification from './GenericNotification';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser?: User;
  onUpdateUser?: (user: User) => void;
  feeStructures: FeeStructure[];
  paymentRecords: PaymentRecord[];
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  activeToast: ToastNotification | null;
  onCloseToast: () => void;
  attendanceRecords: AttendanceRecord[]; // NEW: Pass attendance records
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>; // NEW: Pass attendance setter
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, onChangeRole, currentView, onNavigate, currentUser, onUpdateUser, feeStructures, paymentRecords, announcements, setAnnouncements, activeToast, onCloseToast, attendanceRecords, setAttendanceRecords, onLogout }) => {
  const [notificationSession, setNotificationSession] = useState<ClassSession | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [viewingNotification, setViewingNotification] = useState<Announcement | null>(null);
  
  const notifiedClassesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkSchedule = () => {
      const now = Date.now();
      let classesToCheck: ClassSession[] = [];

      if (role === UserRole.STUDENT) {
        classesToCheck = UPCOMING_CLASSES;
      } else if (role === UserRole.TEACHER) {
        classesToCheck = TEACHER_CLASSES;
      }

      // Check for classes starting within the next 5 minutes
      const upcomingSession = classesToCheck.find(s => {
        // Skip if already notified
        if (notifiedClassesRef.current.has(s.id)) return false;
        // Skip if no timestamp data
        if (!s.timestamp) return false;

        const timeDiff = s.timestamp - now;
        
        // Trigger if:
        // 1. Class is in the future (timeDiff > 0)
        // 2. Class starts in 5 minutes or less (timeDiff <= 5 mins)
        // 3. Status is UPCOMING or LIVE
        return (
          timeDiff > 0 && 
          timeDiff <= 5 * 60 * 1000 && 
          (s.status === 'UPCOMING' || s.status === 'LIVE')
        );
      });

      if (upcomingSession) {
        setNotificationSession(upcomingSession);
        notifiedClassesRef.current.add(upcomingSession.id);
      }
    };

    // Check immediately on mount/role change
    checkSchedule();

    // Check every 10 seconds
    const intervalId = setInterval(checkSchedule, 10000);

    return () => clearInterval(intervalId);
  }, [role]);

  // Calculate unread count for the badge
  const unreadCount = React.useMemo(() => {
    if (!currentUser) return 0;
    
    const myAnnouncements = announcements.filter(ann => {
      if (ann.scheduledFor && ann.scheduledFor > Date.now() && currentUser.role === UserRole.STUDENT) return false;
      if (ann.targetType === 'ALL_USERS') return true;
      if (ann.targetType === 'BATCH' && currentUser.enrolledBatchIds) {
        return ann.targetIds?.some(id => currentUser.enrolledBatchIds?.includes(id));
      }
      if (ann.targetType === 'SPECIFIC_STUDENTS') {
        return ann.targetIds?.includes(currentUser.id);
      }
      // Teachers/Admins see all batch/specific student announcements for simplicity in this mock
      if (currentUser.role !== UserRole.STUDENT) return true;
      return false;
    });

    return myAnnouncements.filter(a => !a.isRead).length;
  }, [announcements, currentUser]);


  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        role={role} 
        onChangeRole={onChangeRole} 
        currentView={currentView}
        onNavigate={(view) => {
          onNavigate(view);
          setIsMobileMenuOpen(false); // Close sidebar on mobile navigation
        }}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onLogout={onLogout}
      />
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ml-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-slate-500 hover:text-slate-700 p-1"
             >
                <Menu size={24} />
             </button>

            <div className="flex items-center gap-4 bg-slate-100 rounded-lg px-4 py-2 w-full max-w-[200px] md:max-w-md lg:w-96">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 relative">
            <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-2 rounded-full transition-colors ${isNotificationOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Notification Center Popover */}
            {isNotificationOpen && currentUser && (
                <div className="absolute top-14 -right-4 w-[calc(100vw-2rem)] sm:w-96">
                    <NotificationCenter 
                        currentUser={currentUser}
                        announcements={announcements}
                        setAnnouncements={setAnnouncements}
                        onClose={() => setIsNotificationOpen(false)}
                        onNotificationClick={(ann) => {
                          setViewingNotification(ann);
                          setIsNotificationOpen(false); // Close dropdown when opening modal
                        }}
                    />
                </div>
            )}

            <button 
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200 hover:bg-slate-50 py-1 px-2 rounded-lg transition-colors"
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-800">{currentUser?.name || 'User'}</div>
                <div className="text-xs text-slate-500 capitalize">{role.toLowerCase()} Account</div>
              </div>
              <img 
                src={currentUser?.avatar || `https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff`} 
                alt="Profile" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm"
              />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Live Class Notification Toast */}
        {notificationSession && (
          <ClassNotification 
            key={`${role}-${notificationSession.id}`} // Force re-mount on role change to restart timer
            session={notificationSession} 
            onClose={() => setNotificationSession(null)} 
          />
        )}
        
        {/* Generic Toast Notification */}
        {activeToast && (
          <GenericNotification 
            key={activeToast.id}
            notification={activeToast}
            onClose={onCloseToast}
          />
        )}


        {/* Chat Widget */}
        {currentUser && (
          <ChatWidget currentUser={currentUser} />
        )}

        {/* User Profile Modal */}
        {isProfileOpen && currentUser && (
            <UserProfileModal 
                user={currentUser} 
                onClose={() => setIsProfileOpen(false)} 
                onSave={(updatedUser) => onUpdateUser && onUpdateUser(updatedUser)}
                feeStructures={feeStructures}
                paymentRecords={paymentRecords}
            />
        )}

        {/* Notification Detail Modal */}
        {viewingNotification && (
          <NotificationDetailModal 
            announcement={viewingNotification}
            onClose={() => setViewingNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Layout;
