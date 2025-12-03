

import React, { useState } from 'react';
import { TEACHER_CLASSES, MOCK_BATCHES, MOCK_SUBMISSIONS, MOCK_ASSIGNMENTS } from '../../data/mockData';
import { analyzeStudentRisk } from '../../services/geminiService';
import { StudentStats, RiskAnalysis, Tab, ClassSession, User } from '../../types';
import { Users, Video, AlertTriangle, Loader2, Play, Layers, FileText, Calendar, ArrowRight, BookOpen } from 'lucide-react';

const MOCK_STUDENT_STATS: StudentStats = {
  attendance: 65,
  assignmentsCompleted: 40,
  averageGrade: 58
};

const MOCK_RECENT_GRADES = [55, 60, 45, 70];

const generateMeetLink = () => `https://meet.google.com/${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}`;

interface TeacherViewProps {
  onBatchClick?: (batchId: string, targetTab?: Tab) => void;
  currentUser?: User;
}

const TeacherView: React.FC<TeacherViewProps> = ({ onBatchClick, currentUser }) => {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [todaysClasses, setTodaysClasses] = useState<ClassSession[]>(TEACHER_CLASSES);

  const handleAnalyzeRisk = async () => {
    setAnalyzing(true);
    const result = await analyzeStudentRisk(MOCK_STUDENT_STATS, MOCK_RECENT_GRADES);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const handleStartClass = (classId: string) => {
    setTodaysClasses(prevClasses => prevClasses.map(cls => 
      cls.id === classId ? { ...cls, status: 'LIVE', url: cls.url || generateMeetLink() } : cls
    ));
  };

  // --- Data for Stats ---
  const teacherBatches = currentUser ? MOCK_BATCHES.filter(b => b.teacherId === currentUser.id) : [];
  const totalStudents = teacherBatches.reduce((acc, batch) => acc + batch.studentsCount, 0);
  const pendingReviews = MOCK_SUBMISSIONS.filter(sub => {
    const assignment = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignmentId);
    return assignment && teacherBatches.some(b => b.id === assignment.batchId) && sub.status === 'PENDING';
  }).length;


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome, {currentUser?.name.split(' ')[0] || 'Teacher'}!</h1>
        <p className="text-slate-500 mt-1">Here's your overview for today. Ready to inspire some minds?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                    <span className="text-sm font-semibold text-slate-500">Total Students</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{totalStudents}</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Layers size={20} /></div>
                    <span className="text-sm font-semibold text-slate-500">Active Classes</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{teacherBatches.length}</div>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FileText size={20} /></div>
                    <span className="text-sm font-semibold text-slate-500">Pending Reviews</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{pendingReviews}</div>
             </div>
          </div>

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
              {todaysClasses.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0)).map((cls) => (
                <div key={cls.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="text-center font-bold text-slate-700 w-16 flex-shrink-0">
                        <div className="text-sm">{cls.startTime.split(' ')[0]}</div>
                        <div className="text-xs text-slate-400">{cls.startTime.split(' ')[1]}</div>
                     </div>
                     <div className="w-px h-10 bg-slate-200"></div>
                     <div>
                        <h4 className="font-bold text-slate-800">{cls.title}</h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5">{cls.subject}
                          <span className="text-slate-300">•</span> 
                          <span className="text-xs font-semibold">{MOCK_BATCHES.find(b=>b.id === cls.batchId)?.name}</span>
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    {cls.status === 'UPCOMING' && (
                      <button 
                        onClick={() => handleStartClass(cls.id)}
                        className="w-full flex-1 text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Video size={16} />
                        Start Class
                      </button>
                    )}
                    {cls.status === 'LIVE' && (
                       <button
                         onClick={() => cls.url && window.open(cls.url, '_blank')}
                         disabled={!cls.url}
                         className="w-full flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 animate-pulse hover:animate-none shadow-lg shadow-red-500/10 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:animate-none"
                       >
                         <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>
                         {cls.url ? 'Join Live' : 'No Link'}
                       </button>
                    )}
                    {cls.status === 'COMPLETED' && (
                      <span className="w-full text-center text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200">Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* My Batches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
             <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-purple-600" /> My Batches</h3>
             </div>
             <div className="p-3 space-y-2">
                {teacherBatches.map(batch => (
                  <div key={batch.id} onClick={() => onBatchClick && onBatchClick(batch.id)} className="p-3 bg-slate-50 rounded-lg hover:bg-blue-50 border border-slate-100 hover:border-blue-200 cursor-pointer transition-all group">
                     <div className="flex justify-between items-start">
                        <div>
                           <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-700">{batch.name}</h4>
                           <p className="text-xs text-slate-500">{batch.course}</p>
                        </div>
                        <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                           <ArrowRight size={16} />
                        </div>
                     </div>
                     <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">{batch.studentsCount} Students</div>
                  </div>
                ))}
             </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-slate-800 leading-tight">At-Risk Student Detector</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              AI analyzes performance trends to identify students needing intervention.
            </p>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
              <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Sample Student: John Doe</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                   <span>Attendance:</span>
                   <span className="font-mono font-bold text-red-500">{MOCK_STUDENT_STATS.attendance}%</span>
                </div>
                <div className="flex justify-between">
                   <span>Avg Grade:</span>
                   <span className="font-mono font-bold text-amber-500">{MOCK_STUDENT_STATS.averageGrade}%</span>
                </div>
              </div>
            </div>

            {!analysis ? (
              <button 
                onClick={handleAnalyzeRisk}
                disabled={analyzing}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {analyzing ? <Loader2 className="animate-spin" size={18}/> : <Play size={16} />}
                {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-4 rounded-lg border ${
                  analysis.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="font-bold text-lg mb-1">{analysis.riskLevel} RISK</div>
                  <p className="text-sm opacity-90">{analysis.reason}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-700 text-sm mb-2">AI Recommendations:</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs p-2 bg-slate-50 border border-slate-100 rounded text-slate-600 flex gap-2 items-center">
                        <span className="text-blue-500 font-bold">{i+1}.</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => setAnalysis(null)}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs mt-2 font-semibold"
                >
                  Clear Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherView;