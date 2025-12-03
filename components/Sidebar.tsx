
import React from 'react';
import { UserRole } from '../types';
import { LayoutDashboard, BookOpen, Calendar, Users, Settings, LogOut, Video, Layers, FileText, ChevronLeft, ChevronRight, X, CreditCard } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onChangeRole, currentView, onNavigate, isCollapsed, onToggle, isMobileOpen, onMobileClose, onLogout }) => {
  const getNavItems = () => {
    let navItems: { id: string; icon: React.ReactNode; label: string; }[] = [];

    if (role === UserRole.STUDENT) {
      navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'courses', icon: <BookOpen size={20} />, label: 'My Courses' },
        { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule' },
      ];
    } else if (role === UserRole.TEACHER) {
      navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'batches', icon: <Layers size={20} />, label: 'My Classes' },
        { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule' },
        { id: 'students', icon: <Users size={20} />, label: 'All Students' },
        { id: 'finance', icon: <CreditCard size={20} />, label: 'Finance' },
      ];
    } else { // ADMIN
      navItems = [
        { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { id: 'batches', icon: <Layers size={20} />, label: 'Batch Management' },
        { id: 'users', icon: <Users size={20} />, label: 'Manage Users' },
        { id: 'finance', icon: <CreditCard size={20} />, label: 'Finance' },
        { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule' },
        { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
      ];
    }

    return navItems.map(item => ({
      ...item,
      active: item.id === currentView
    }));
  };

  return (
    <div className={`
      bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 
      transition-all duration-300 ease-in-out z-40
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      w-64 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
    `}>
      {/* Mobile Close Button */}
      <button 
        onClick={onMobileClose} 
        className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white p-2"
      >
        <X size={24} />
      </button>

      <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'md:justify-center md:px-2' : 'gap-3'}`}>
        <div className="flex items-center gap-3">
          {/* Skill U Custom Logo */}
          <div className="flex-shrink-0 transition-transform duration-300">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Central Node */}
              <circle cx="20" cy="20" r="7" className="fill-blue-600" />
              {/* Surrounding Nodes */}
              <circle cx="20" cy="6" r="3.5" className="fill-blue-500" />
              <circle cx="32" cy="13" r="3.5" className="fill-blue-500" />
              <circle cx="32" cy="27" r="3.5" className="fill-blue-500" />
              <circle cx="20" cy="34" r="3.5" className="fill-blue-500" />
              <circle cx="8" cy="27" r="3.5" className="fill-blue-500" />
              <circle cx="8" cy="13" r="3.5" className="fill-blue-500" />
            </svg>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:hidden' : 'w-auto opacity-100'}`}>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none whitespace-nowrap">
              Skill U
            </h1>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-1 whitespace-nowrap">
              Learning App
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {getNavItems().map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center ${isCollapsed ? 'md:justify-center md:px-0' : 'gap-3 px-4'} gap-3 px-4 py-3 rounded-lg transition-colors relative group ${
              item.active 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex-shrink-0">{item.icon}</div>
            <span className={`font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'md:w-0 md:opacity-0 md:absolute' : 'w-auto opacity-100'}`}>
                {item.label}
            </span>
            
            {/* Tooltip on hover when collapsed (Desktop only) */}
            {isCollapsed && (
              <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={onToggle}
            className="w-full hidden md:flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 py-2 rounded-lg transition-colors mb-4"
            title={isCollapsed ? "Expand" : "Minimize"}
        >
            {isCollapsed ? <ChevronRight size={20} /> : (
                <div className="flex items-center gap-2">
                    <ChevronLeft size={20} />
                    <span className="text-xs font-bold uppercase">Minimize</span>
                </div>
            )}
        </button>

        <div className={`mb-4 transition-all duration-300 ${isCollapsed ? 'md:hidden' : 'block'}`}>
          <label className="text-xs font-semibold uppercase text-slate-500 mb-2 block">Switch View (Demo)</label>
          <select 
            value={role}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.values(UserRole).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={onLogout}
          className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'justify-start gap-2'} gap-2 text-slate-400 hover:text-red-400 transition-colors px-2 w-full py-2 hover:bg-slate-800 rounded-lg`}
          title="Sign Out"
        >
          <LogOut size={18} />
          <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
