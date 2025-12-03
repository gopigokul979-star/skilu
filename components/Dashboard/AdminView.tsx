
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Layers, ArrowRight, BookOpen, BarChart2, Clock } from 'lucide-react';
import { UserRole } from '../../types';
import { MOCK_USERS_LIST, MOCK_BATCHES } from '../../data/mockData';

const enrollmentData = [
  { name: 'Jan', students: 400 },
  { name: 'Feb', students: 420 },
  { name: 'Mar', students: 450 },
  { name: 'Apr', students: 480 },
  { name: 'May', students: 470 },
  { name: 'Jun', students: 510 },
];

interface AdminViewProps {
  onNavigate: (view: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const activeStudents = MOCK_USERS_LIST.filter(u => u.role === UserRole.STUDENT && u.status === 'ACTIVE').length;
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="text-slate-500 mt-1">Global overview of institute performance and key metrics.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Students', value: activeStudents, icon: <Users size={24} className="text-blue-600" />, change: '+12%' },
          { label: 'Total Teachers', value: MOCK_USERS_LIST.filter(u => u.role === UserRole.TEACHER).length, icon: <GraduationCap size={24} className="text-purple-600" />, change: '+2%' },
          { label: 'Active Batches', value: MOCK_BATCHES.length, icon: <Layers size={24} className="text-emerald-600" />, change: '+3', onClick: () => onNavigate('batches') },
          { label: 'Monthly Revenue', value: '$12,450', icon: <BarChart2 size={24} className="text-amber-600" />, change: '+8%' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col ${stat.onClick ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all' : ''}`}
            onClick={stat.onClick}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-lg">{stat.icon}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-auto">
              <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Full Width Enrollment Trends */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
          <h3 className="font-bold text-slate-800 mb-6">Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={enrollmentData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
              />
              <Area type="monotone" dataKey="students" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudents)" />
            </AreaChart>
          </ResponsiveContainer>
      </div>
      
      {/* Active Batches Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Active Batches</h3>
            <button onClick={() => onNavigate('batches')} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                View All Batches <ArrowRight size={14} />
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_BATCHES.slice(0, 3).map(batch => (
                <div key={batch.id} onClick={() => onNavigate('batches')} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{batch.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><BookOpen size={12}/> {batch.course}</p>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                         <ArrowRight size={16} />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Users size={12}/> {batch.studentsCount} Students</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {batch.schedule.split(' ')[0]}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
