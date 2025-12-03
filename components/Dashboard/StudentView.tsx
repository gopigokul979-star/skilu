
import React, { useState } from 'react';
import { UPCOMING_CLASSES, MOCK_BATCHES, MOCK_ANNOUNCEMENTS, MOCK_ASSIGNMENTS, MOCK_TESTS, MOCK_SUBMISSIONS, MOCK_VIDEOS } from '../../data/mockData';
import AITutor from '../AITutor';
import { Clock, BookOpen, CheckCircle, AlertCircle, PlayCircle, FileText, X, Megaphone, Calendar, ArrowRight, GraduationCap, Users, Video, Sparkles, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole, Tab } from '../../types';

const data = [
  { name: 'Mon', hours: 4 },
  { name: 'Tue', hours: 6 },
  { name: 'Wed', hours: 3 },
  { name: 'Thu', hours: 5 },
  { name: 'Fri', hours: 4 },
];

interface StudentViewProps {
  onBatchClick?: (batchId: string, targetTab?: Tab) => void;
  currentUser?: User;
}

const StudentView: React.FC<StudentViewProps> = ({ onBatchClick, currentUser }) => {
  const [showWelcome, setShowWelcome] = useState(true);

  // Filter Data for Current Student
  const enrolledBatches = MOCK_BATCHES.filter(b => currentUser?.enrolledBatchIds?.includes(b.id));
  
  const studentAnnouncements = MOCK_ANNOUNCEMENTS.filter(ann => {
    // 1. Scheduled check
    if (ann.scheduledFor && ann.scheduledFor > Date.now()) return false;
    // 2. Target check
    if (ann.targetType === 'ALL_USERS') return true;
    if (ann.targetType === 'BATCH' && ann.targetIds) {
      return ann.targetIds.some(bid => currentUser?.enrolledBatchIds?.includes(bid));
    }
    if (ann.targetType === 'SPECIFIC_STUDENTS' && currentUser) {
      return ann.targetIds?.includes(currentUser.id);
    }
    return false;
  }).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3); // Top 3

  const pendingAssignments = MOCK_ASSIGNMENTS.filter(a => 
    currentUser?.enrolledBatchIds?.includes(a.batchId) &&
    // Check if not submitted
    !MOCK_SUBMISSIONS.some(s => s.assignmentId === a.id && s.studentId === currentUser?.id)
  ).sort((a, b) => a.dueDate - b.dueDate).slice(0, 3);

  const upcomingTests = MOCK_TESTS.filter(t => 
    currentUser?.enrolledBatchIds?.includes(t.batchId) && t.date > Date.now()
  ).sort((a, b) => a.date - b.date).slice(0, 2);

  const recentRecordedClasses = MOCK_VIDEOS.filter(v => 
    v.status === 'RECORDED' && currentUser?.enrolledBatchIds?.includes(v.batchId)
  ).sort((a,b) => b.date - a.date).slice(0, 2); // Show top 2 most recent recordings


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Welcome & My Courses Section */}
      <div className="space-y-4">
        {/* Welcome Banner */}
        {showWelcome && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors z-20"
              >
                <X size={20} />
              </button>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Hello, {currentUser?.name.split(' ')[0] || 'Student'}! 👋</h1>
                    <p className="text-slate-300 max-w-lg text-sm md:text-base">
                        You have <span className="text-white font-bold">{pendingAssignments.length} assignments</span> due soon and <span className="text-white font-bold">{UPCOMING_CLASSES.length} classes</span> scheduled for today.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">92%</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-300">Attendance</div>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">A</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-300">Avg Grade</div>
                        </div>
                    </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                <BookOpen size={200} />
              </div>
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>
        )}

        {/* Enrolled Batches / Courses Grid */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-600"/>
                    My Courses
                </h3>
            </div>
            
            {enrolledBatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrolledBatches.map((batch, index) => {
                        const gradientClass = index % 3 === 0 
                            ? 'from-blue-500 to-blue-600' 
                            : index % 3 === 1 
                            ? 'from-purple-500 to-purple-600' 
                            : 'from-emerald-500 to-emerald-600';
                        
                        return (
                            <div 
                                key={batch.id} 
                                onClick={() => onBatchClick && onBatchClick(batch.id)}
                                className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                            >
                                <div className={`h-2 w-full bg-gradient-to-r ${gradientClass}`}></div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{batch.name}</h4>
                                        <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-1">{batch.course}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} />
                                            <span>{batch.teacher}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            <span>{batch.schedule.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                    You are not enrolled in any courses yet.
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule & Announcements */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600"/>
                  Today's Schedule
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {UPCOMING_CLASSES.length > 0 ? UPCOMING_CLASSES.map((session, idx) => (
                <div 
                  key={session.id} 
                  onClick={() => session.batchId && onBatchClick?.(session.batchId, 'videos')}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-sm font-bold text-slate-700">{session.startTime.split(' ')[0]}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{session.startTime.split(' ')[1]}</span>
                        {idx !== UPCOMING_CLASSES.length - 1 && <div className="w-px h-full bg-slate-200 my-1 group-hover:bg-blue-200"></div>}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors mb-1">{session.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                          <BookOpen size={12} /> {session.subject} 
                          {session.batchId && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500">Batch {MOCK_BATCHES.find(b=>b.id===session.batchId)?.name}</span>}
                      </p>
                    </div>
                  </div>
                  {session.status === 'LIVE' ? (
                    <button 
                      onClick={() => session.url && window.open(session.url, '_blank')}
                      disabled={!session.url}
                      className="flex items-center justify-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-red-200 shadow-lg animate-pulse w-full sm:w-auto hover:bg-red-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed disabled:animate-none"
                    >
                      <PlayCircle size={14} /> {session.url ? 'JOIN LIVE' : 'No Link'}
                    </button>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-center sm:text-left border border-slate-200">
                      {session.status}
                    </span>
                  )}
                </div>
              )) : (
                  <div className="p-8 text-center text-slate-400 text-sm">No classes scheduled for today.</div>
              )}
            </div>
          </div>
          
          {/* Recent Recorded Classes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Video size={18} className="text-purple-600" />
                    Recent Recorded Classes
                </h3>
             </div>
             <div className="divide-y divide-slate-100">
                {recentRecordedClasses.length > 0 ? recentRecordedClasses.map(video => (
                    <div key={video.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">{video.title}</h4>
                            <span className="text-xs text-slate-400">{new Date(video.date).toLocaleDateString()}</span>
                        </div>
                        {video.summary && (
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 flex items-start gap-2">
                                <Sparkles size={14} className="flex-shrink-0 text-blue-500 mt-0.5"/>
                                <span className="font-medium text-slate-700">AI Summary:</span> {video.summary}
                            </p>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Clock size={12} /> {video.duration}
                                {video.batchId && <span className="ml-2 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500">Batch {MOCK_BATCHES.find(b=>b.id===video.batchId)?.name}</span>}
                            </div>
                            <a 
                                href={video.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                Watch Recording <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                )) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        <Video size={32} className="mx-auto mb-2 opacity-50"/>
                        No recent recorded classes.
                    </div>
                )}
             </div>
             {recentRecordedClasses.length > 0 && (
                 <button 
                    onClick={() => onBatchClick && onBatchClick(currentUser?.enrolledBatchIds?.[0] || '', 'videos')} // Navigate to videos tab of first enrolled batch
                    className="w-full py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors uppercase tracking-wider border-t border-slate-50"
                 >
                     View All Videos
                 </button>
             )}
          </div>


          {/* Announcements Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Megaphone size={18} className="text-orange-500" />
                    Latest Announcements
                </h3>
             </div>
             <div className="divide-y divide-slate-100">
                {studentAnnouncements.length > 0 ? studentAnnouncements.map(ann => (
                    <div key={ann.id} className="p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                ann.targetType === 'ALL_USERS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                                {ann.targetType === 'ALL_USERS' ? 'Institute' : 'Batch'}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{ann.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{ann.content}</p>
                    </div>
                )) : (
                    <div className="p-8 text-center text-slate-400 text-sm">No new announcements.</div>
                )}
             </div>
             <button className="w-full py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors uppercase tracking-wider border-t border-slate-50">
                 View All Notifications
             </button>
          </div>

          {/* Study Activity Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center gap-2">
                 <Clock size={18} className="text-slate-400"/> Study Activity
             </h3>
             <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                   <YAxis hide />
                   <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
                    cursor={{fill: '#f8fafc'}}
                   />
                   <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Right Column: Tasks & Widgets */}
        <div className="col-span-1 space-y-6">
          
          {/* Due Soon Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 text-sm">Due Soon</h3>
                 <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingAssignments.length + upcomingTests.length} Items</span>
             </div>
             <div className="p-2 space-y-1">
                 {upcomingTests.map(test => (
                     <div 
                        key={test.id} 
                        className="p-3 bg-white border border-slate-100 rounded-lg hover:border-amber-200 transition-colors shadow-sm group cursor-pointer"
                        onClick={() => onBatchClick && onBatchClick(test.batchId, 'tests')}
                      >
                         <div className="flex items-center gap-2 mb-1">
                             <GraduationCap size={14} className="text-amber-500" />
                             <span className="text-xs font-bold text-amber-600 uppercase">Test</span>
                         </div>
                         <h4 className="font-semibold text-slate-800 text-sm">{test.title}</h4>
                         <div className="flex justify-between items-end mt-2">
                             <div className="text-xs text-slate-500">
                                {new Date(test.date).toLocaleDateString()} • {test.durationMinutes} mins
                             </div>
                             <div className="text-xs font-bold text-slate-300 group-hover:text-amber-500 transition-colors">Prepare</div>
                         </div>
                     </div>
                 ))}
                 
                 {pendingAssignments.map(assign => (
                     <div 
                        key={assign.id} 
                        className="p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-200 transition-colors shadow-sm group cursor-pointer" 
                        onClick={() => onBatchClick && onBatchClick(assign.batchId, 'assignments')}
                      >
                         <div className="flex items-center gap-2 mb-1">
                             <FileText size={14} className="text-blue-500" />
                             <span className="text-xs font-bold text-blue-600 uppercase">Assignment</span>
                         </div>
                         <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{assign.title}</h4>
                         <div className="flex justify-between items-end mt-2">
                             <div className="text-xs text-slate-500">
                                Due: {new Date(assign.dueDate).toLocaleDateString()}
                             </div>
                             <div className="text-xs font-bold text-slate-300 group-hover:text-blue-600 transition-colors">Submit</div>
                         </div>
                     </div>
                 ))}

                 {pendingAssignments.length === 0 && upcomingTests.length === 0 && (
                     <div className="p-6 text-center text-slate-400 text-sm">
                         <CheckCircle size={24} className="mx-auto mb-2 text-emerald-400" />
                         All caught up!
                     </div>
                 )}
             </div>
          </div>

          {/* AI Tutor Widget */}
          <AITutor />

        </div>
      </div>
    </div>
  );
};

export default StudentView;