import React, { useState } from 'react';
import { Assignment, Submission, UserRole, ToastNotification } from '../../types';
import { MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS, MOCK_BATCHES, MOCK_USERS_LIST } from '../../data/mockData';
import { Plus, Upload, CheckCircle, Clock, AlertCircle, FileText, Image as ImageIcon, X, Eye } from 'lucide-react';

interface AssignmentsViewProps {
  role: UserRole;
  batchId?: string;
  setActiveToast?: (toast: ToastNotification | null) => void;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ role, batchId, setActiveToast }) => {
  // Filter initial assignments if batchId is present
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  
  // Teacher State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    time: '23:59'
  });

  // Student State
  const [showUploadModal, setShowUploadModal] = useState<string | null>(null); // assignment ID
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Filter based on batchId
  const displayAssignments = batchId 
    ? assignments.filter(a => a.batchId === batchId) 
    : assignments;

  // --- Teacher Actions ---
  
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const dueDateObj = new Date(`${newAssignment.dueDate}T${newAssignment.time}`);
    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title,
      subject: newAssignment.subject,
      description: newAssignment.description,
      dueDate: dueDateObj.getTime(),
      assignedDate: Date.now(),
      teacherId: 'u2', // Mock teacher ID
      batchId: batchId || 'b1' // Use current batch or default
    };
    setAssignments([assignment, ...assignments]);

    if (setActiveToast) {
        setActiveToast({
            id: `toast_${Date.now()}`,
            title: 'Assignment Published',
            message: `'${assignment.title}' has been assigned to students.`,
            type: 'success'
        });
    }

    setShowCreateModal(false);
    setNewAssignment({ title: '', subject: '', description: '', dueDate: '', time: '23:59' });
  };

  const handleApproveSubmission = (submissionId: string) => {
    setSubmissions(prev => prev.map(s => 
      s.id === submissionId ? { ...s, status: 'APPROVED' } : s
    ));
  };

  // --- Student Actions ---

  const handleUploadSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !showUploadModal) return;

    const newSubmission: Submission = {
      id: Date.now().toString(),
      assignmentId: showUploadModal,
      studentId: 'u1', // Mock student ID
      studentName: 'Alex Johnson',
      submittedAt: Date.now(),
      fileUrl: uploadFile.name,
      fileType: uploadFile.type.startsWith('image') ? 'IMAGE' : 'DOCUMENT',
      status: 'PENDING'
    };

    setSubmissions([...submissions, newSubmission]);
    setShowUploadModal(null);
    setUploadFile(null);
  };

  // --- Render Helpers ---

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const isOverdue = (timestamp: number) => Date.now() > timestamp;
  
  // Student-specific status helper
  const getStudentAssignmentStatus = (assignment: Assignment, studentSubmissions: Submission[]) => {
    const submission = studentSubmissions.find(s => s.assignmentId === assignment.id && s.studentId === 'u1'); // Mock student ID
    const overdue = isOverdue(assignment.dueDate);

    if (submission) {
        if (submission.status === 'APPROVED') {
            return {
                key: 'APPROVED',
                text: 'Approved',
                icon: <CheckCircle size={20} />,
                colorClass: 'text-emerald-600',
                bgClass: 'bg-emerald-50 border-emerald-100',
            };
        }
        return {
            key: 'PENDING_REVIEW',
            text: 'Pending Review',
            icon: <Clock size={20} />,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50 border-blue-100',
        };
    }

    if (overdue) {
        return {
            key: 'MISSING',
            text: 'Missing',
            icon: <AlertCircle size={20} />,
            colorClass: 'text-red-600',
            bgClass: 'bg-red-50 border-red-100',
        };
    }
    
    return {
        key: 'PENDING_SUBMISSION',
        text: 'Submit Work',
        icon: null,
        colorClass: '',
        bgClass: ''
    };
  };

  // --- TEACHER VIEW ---
  
  const renderTeacherView = () => {
    const selectedAssignment = displayAssignments.find(a => a.id === selectedAssignmentId);
    const selectedSubmissions = submissions.filter(s => s.assignmentId === selectedAssignmentId);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            {!batchId && <h2 className="text-2xl font-bold text-slate-800">Assignments</h2>}
            {!batchId && <p className="text-slate-500">Manage tasks and review submissions</p>}
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Create Assignment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment List */}
          <div className="lg:col-span-1 space-y-4">
            {displayAssignments.length > 0 ? displayAssignments.map(assign => (
              <div 
                key={assign.id}
                onClick={() => setSelectedAssignmentId(assign.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAssignmentId === assign.id 
                    ? 'bg-blue-50 border-blue-500 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">{assign.subject}</span>
                  {isOverdue(assign.dueDate) && (
                     <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                       <AlertCircle size={12} /> Closed
                     </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{assign.title}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} /> Due: {formatDate(assign.dueDate)}
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                   <span>{MOCK_BATCHES.find(b => b.id === assign.batchId)?.name || 'Unknown Batch'}</span>
                   <span>{submissions.filter(s => s.assignmentId === assign.id).length} Submissions</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No assignments found for this class.
              </div>
            )}
          </div>

          {/* Details / Submissions Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
            {selectedAssignment ? (
              <div className="p-6">
                <div className="border-b border-slate-100 pb-6 mb-6">
                   <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedAssignment.title}</h3>
                   <p className="text-slate-600 text-sm mb-4">{selectedAssignment.description}</p>
                   <div className="flex gap-4 text-xs text-slate-500">
                     <span className="bg-slate-100 px-2 py-1 rounded">Subject: {selectedAssignment.subject}</span>
                     <span className="bg-slate-100 px-2 py-1 rounded">Due: {formatDate(selectedAssignment.dueDate)}</span>
                   </div>
                </div>

                <h4 className="font-bold text-slate-700 mb-4">Student Submissions</h4>
                {selectedSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSubmissions.map(sub => {
                      const student = MOCK_USERS_LIST.find(u => u.id === sub.studentId);
                      return (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                           {student ? (
                             <img src={student.avatar} alt={sub.studentName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                           ) : (
                             <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                               {sub.studentName.charAt(0)}
                             </div>
                           )}
                           
                           <div>
                             <p className="font-semibold text-sm text-slate-800">{sub.studentName}</p>
                             <div className="flex flex-col gap-1 mt-1">
                               <div className="text-xs text-slate-500">
                                 Submitted: {formatDate(sub.submittedAt)}
                               </div>
                               <a 
                                 href="#" 
                                 className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded w-fit transition-colors"
                                 onClick={(e) => e.preventDefault()}
                                >
                                 {sub.fileType === 'IMAGE' ? <ImageIcon size={14} /> : <FileText size={14} />}
                                 <span className="font-medium truncate max-w-[200px]">{sub.fileUrl}</span>
                               </a>
                             </div>
                           </div>
                        </div>
                        
                        <div>
                          {sub.status === 'PENDING' ? (
                            <button 
                              onClick={() => handleApproveSubmission(sub.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1">
                              <CheckCircle size={12} /> Approved
                            </span>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No submissions yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Select an assignment to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Create Assignment</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                     <input required className="w-full border rounded-lg p-2 text-sm" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="e.g. Chapter 4 Quiz" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
                     <input required className="w-full border rounded-lg p-2 text-sm" value={newAssignment.subject} onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})} placeholder="e.g. Biology" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                     <textarea required className="w-full border rounded-lg p-2 text-sm h-24" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} placeholder="Instructions for students..." />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
                        <input type="date" required className="w-full border rounded-lg p-2 text-sm" value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time</label>
                        <input type="time" required className="w-full border rounded-lg p-2 text-sm" value={newAssignment.time} onChange={e => setNewAssignment({...newAssignment, time: e.target.value})} />
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700">Publish Assignment</button>
                </form>
             </div>
          </div>
        )}
      </div>
    );
  };

  // --- STUDENT VIEW ---

  const renderStudentView = () => {
    const activeAssignments = displayAssignments.sort((a, b) => a.dueDate - b.dueDate);

    return (
      <div className="space-y-6">
        <div>
           {!batchId && <h2 className="text-2xl font-bold text-slate-800">My Assignments</h2>}
           {!batchId && <p className="text-slate-500">Track and submit your work</p>}
        </div>

        {activeAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAssignments.map(assign => {
              const statusInfo = getStudentAssignmentStatus(assign, submissions);

              return (
                <div key={assign.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">{assign.subject}</span>
                      {statusInfo.icon && <span className={statusInfo.colorClass}>{statusInfo.icon}</span>}
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{assign.title}</h3>
                  <p className="text-slate-600 text-sm mb-4 flex-1">{assign.description}</p>
                  
                  <div className="text-xs text-slate-500 mb-6 space-y-1">
                    <div className="flex justify-between">
                      <span>Assigned:</span>
                      <span>{formatDate(assign.assignedDate)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Due Date:</span>
                      <span className={statusInfo.key === 'MISSING' ? 'text-red-600' : ''}>{formatDate(assign.dueDate)}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                      {statusInfo.key === 'PENDING_SUBMISSION' ? (
                        <button 
                          onClick={() => setShowUploadModal(assign.id)}
                          className="w-full py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload size={16} /> {statusInfo.text}
                        </button>
                      ) : (
                        <div className={`w-full py-2 rounded-lg font-semibold text-sm text-center border ${statusInfo.bgClass} ${statusInfo.colorClass}`}>
                          {statusInfo.text}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
             No active assignments.
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Submit Assignment</h3>
                  <button onClick={() => setShowUploadModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleUploadSubmission} className="space-y-6">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                     <input 
                       type="file" 
                       onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                       accept="image/*,.pdf,.doc,.docx"
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                     {uploadFile ? (
                       <div className="text-blue-600 flex flex-col items-center">
                         <FileText size={32} className="mb-2" />
                         <span className="font-semibold text-sm break-all">{uploadFile.name}</span>
                         <span className="text-xs text-slate-400 mt-1">Click to change</span>
                       </div>
                     ) : (
                       <div className="text-slate-400 flex flex-col items-center">
                         <Upload size={32} className="mb-2" />
                         <span className="font-semibold text-sm text-slate-600">Click to Upload File</span>
                         <span className="text-xs mt-1">PDF, Docs, or Images</span>
                       </div>
                     )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!uploadFile}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Assignment
                  </button>
                </form>
             </div>
          </div>
        )}
      </div>
    );
  };

  return role === UserRole.TEACHER || role === UserRole.ADMIN ? renderTeacherView() : renderStudentView();
};

export default AssignmentsView;
