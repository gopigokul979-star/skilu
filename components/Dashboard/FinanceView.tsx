import React, { useState, useEffect } from 'react';
import { User, Batch, FeeStructure, PaymentRecord, Installment, UserRole, Announcement, ToastNotification, AttendanceRecord } from '../../types';
import { CreditCard, Plus, X, Users, Search, ChevronRight, Check, ListChecks, User as UserIcon, Layers, Settings, Send } from 'lucide-react';
import { FinanceReports } from './FinanceReports';

interface FinanceViewProps {
  users: User[];
  batches: Batch[];
  feeStructures: FeeStructure[];
  paymentRecords: PaymentRecord[];
  setFeeStructures: React.Dispatch<React.SetStateAction<FeeStructure[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  role: UserRole;
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  setActiveToast: (toast: ToastNotification | null) => void;
  attendanceRecords: AttendanceRecord[]; // NEW: Pass attendance records
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>; // NEW: Pass attendance setter
}

const FinanceView: React.FC<FinanceViewProps> = ({ users, batches, feeStructures, paymentRecords, setFeeStructures, setUsers, role, setAnnouncements, setActiveToast, attendanceRecords, setAttendanceRecords }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showManageStructuresModal, setShowManageStructuresModal] = useState(false);
  const [showCreateStructureModal, setShowCreateStructureModal] = useState(false);
  const [showApplyStructureModal, setShowApplyStructureModal] = useState<FeeStructure | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form State
  const [feeStructureForm, setFeeStructureForm] = useState<{ name: string; totalAmount: number; numInstallments: number; installments: Partial<Installment>[] }>({ name: '', totalAmount: 0, numInstallments: 1, installments: [{ amount: 0, dueDate: Date.now() }] });
  
  // Apply Structure State
  const [applyMethod, setApplyMethod] = useState<'BATCH' | 'STUDENTS' | 'SINGLE'>('BATCH');
  const [selectedApplyBatchId, setSelectedApplyBatchId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [singleStudentSearch, setSingleStudentSearch] = useState('');

  // Settings State
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);

  // Effect to update installments when number changes
  useEffect(() => {
    const num = feeStructureForm.numInstallments;
    if (isNaN(num) || num < 1) return;

    const newInstallments = Array.from({ length: num }, (_, i) => {
      return feeStructureForm.installments[i] || { amount: 0, dueDate: Date.now() };
    });
    setFeeStructureForm(prev => ({ ...prev, installments: newInstallments }));
  }, [feeStructureForm.numInstallments]);
  
  // Reset apply state when modal opens/changes
  useEffect(() => {
    if (showApplyStructureModal) {
      setApplyMethod('BATCH');
      setSelectedApplyBatchId('');
      setSelectedStudentIds([]);
      setSingleStudentSearch('');
    }
  }, [showApplyStructureModal]);


  const students = users.filter(u => u.role === UserRole.STUDENT);
  
  const filteredStudents = students.filter(student => {
    const batchMatch = selectedBatchId === 'ALL' || student.enrolledBatchIds?.includes(selectedBatchId);
    const searchMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return batchMatch && searchMatch;
  });

  const handleFeeStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStructure: FeeStructure = {
      id: `fs_${Date.now()}`,
      name: feeStructureForm.name,
      totalAmount: feeStructureForm.totalAmount,
      installments: feeStructureForm.installments.map((inst, i) => ({
        installmentNumber: i + 1,
        amount: Number(inst.amount) || 0,
        dueDate: new Date(inst.dueDate as any).getTime(),
      })) as Installment[],
    };
    setFeeStructures(prev => [...prev, newStructure]);
    setShowCreateStructureModal(false);
    setFeeStructureForm({ name: '', totalAmount: 0, numInstallments: 1, installments: [{ amount: 0, dueDate: Date.now() }] });
  };
  
  const handleInstallmentChange = (index: number, field: 'amount' | 'dueDate', value: string | number) => {
    const updatedInstallments = [...feeStructureForm.installments];
    const installment = { ...updatedInstallments[index] };
    (installment as any)[field] = value;
    updatedInstallments[index] = installment;
    setFeeStructureForm(prev => ({...prev, installments: updatedInstallments}));
  };
  
  const handleApplyStructure = () => {
    if (!showApplyStructureModal) return;

    let studentIdsToUpdate: string[] = [];

    if (applyMethod === 'BATCH' && selectedApplyBatchId) {
        const batchStudents = users.filter(u => u.enrolledBatchIds?.includes(selectedApplyBatchId));
        studentIdsToUpdate = batchStudents.map(s => s.id);
    } else if (applyMethod === 'STUDENTS') {
        studentIdsToUpdate = selectedStudentIds;
    } else if (applyMethod === 'SINGLE' && selectedStudentIds.length > 0) {
        studentIdsToUpdate = selectedStudentIds;
    }

    if (studentIdsToUpdate.length === 0) {
        alert("No students selected!");
        return;
    }

    setUsers(prevUsers => 
        prevUsers.map(user => 
            studentIdsToUpdate.includes(user.id) 
            ? { ...user, feeStructureId: showApplyStructureModal.id } 
            : user
        )
    );

    setActiveToast({
        id: `toast_apply_fs_${Date.now()}`,
        title: 'Fee Structure Applied',
        message: `Applied '${showApplyStructureModal.name}' to ${studentIdsToUpdate.length} student(s).`,
        type: 'success'
    });
    setShowApplyStructureModal(null);
  };
  
  const handleSendReminder = (student: User, balance: number) => {
    // 1. Create Announcement for the Bell
    const newAnnouncement: Announcement = {
      id: `rem_manual_${Date.now()}`,
      title: `Manual Payment Reminder`,
      content: `This is a reminder that you have an outstanding balance of ₹${balance.toLocaleString()}. Please complete your payment at your earliest convenience.`,
      senderId: 'system',
      senderName: 'Finance Department',
      createdAt: Date.now(),
      targetType: 'SPECIFIC_STUDENTS',
      targetIds: [student.id],
      isRead: false
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);

    // 2. Create Toast Notification for the student (if they are logged in)
    // In a real app, this would be sent via a push service, but for demo we show it if they are the current user.
    // We will show an admin confirmation toast instead.
    
    // 3. Create a confirmation Toast for the admin/teacher
    const adminToast: ToastNotification = {
        id: `toast_admin_${Date.now()}`,
        title: 'Reminder Sent!',
        message: `A payment reminder has been sent to ${student.name}.`,
        type: 'success'
    };
    setActiveToast(adminToast);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Finance &amp; Fee Management</h2>
            <p className="text-slate-500">Oversee student payments, manage structures, and view reports.</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setShowSettingsModal(true)} title="Settings" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-lg transition-colors"><Settings size={20} /></button>
            <button onClick={() => setShowManageStructuresModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"><Plus size={16} /> Manage Structures</button>
        </div>
      </div>
      
      {role === UserRole.ADMIN && (
          <FinanceReports 
            users={users} 
            batches={batches}
            feeStructures={feeStructures}
            paymentRecords={paymentRecords}
            attendanceRecords={attendanceRecords} // NEW: Pass attendance records
          />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">Batch:</span>
                <select 
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-700 text-sm font-semibold rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="ALL">All Batches</option>
                    {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[calc(100vh-20rem)] overflow-y-auto">
            {filteredStudents.map(student => {
                const feeStructure = feeStructures.find(fs => fs.id === student.feeStructureId);
                const studentPayments = paymentRecords.filter(p => p.studentId === student.id);
                const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
                const balance = feeStructure ? feeStructure.totalAmount - totalPaid : 0;
                
                return (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <h4 className="font-bold text-slate-800">{student.name}</h4>
                                <p className="text-xs text-slate-500">{feeStructure?.name || 'No Plan Assigned'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 text-sm">
                            <div className="hidden sm:block"><span className="text-xs text-slate-500">Paid: </span><span className="font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</span></div>
                            <div><span className="text-xs text-slate-500">Balance: </span><span className="font-bold text-red-600">₹{balance.toLocaleString()}</span></div>
                            {balance > 0 && <button onClick={() => handleSendReminder(student, balance)} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-200"><Send size={12} /> Send Reminder</button>}
                        </div>
                    </div>
                );
            })}
             {filteredStudents.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-50"/>
                    No students found.
                </div>
             )}
        </div>
      </div>

      {showManageStructuresModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Fee Structures</h3>
                    <button onClick={() => setShowManageStructuresModal(false)}><X size={20}/></button>
                  </div>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {feeStructures.map(fs => (
                      <div key={fs.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800">{fs.name}</h4>
                          <p className="text-sm text-slate-500">₹{fs.totalAmount.toLocaleString()} ({fs.installments.length} installments)</p>
                        </div>
                        <button onClick={() => { setShowApplyStructureModal(fs); setShowManageStructuresModal(false); }} className="px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Apply</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {setShowCreateStructureModal(true); setShowManageStructuresModal(false); }} className="w-full mt-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
                    + Create New Structure
                  </button>
              </div>
          </div>
      )}
      {showCreateStructureModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Create Fee Structure</h3><button onClick={() => setShowCreateStructureModal(false)}><X size={20}/></button></div>
                    <form onSubmit={handleFeeStructureSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <input required value={feeStructureForm.name} onChange={e => setFeeStructureForm({...feeStructureForm, name: e.target.value})} className="w-full p-2 border rounded" placeholder="Structure Name (e.g., Standard 6-Month Plan)"/>
                        <div className="grid grid-cols-2 gap-4">
                            <input required type="number" value={feeStructureForm.totalAmount || ''} onChange={e => setFeeStructureForm({...feeStructureForm, totalAmount: Number(e.target.value)})} className="w-full p-2 border rounded" placeholder="Total Amount"/>
                            <input required type="number" min="1" value={feeStructureForm.numInstallments || ''} onChange={e => setFeeStructureForm({...feeStructureForm, numInstallments: Number(e.target.value)})} className="w-full p-2 border rounded" placeholder="No. of Installments"/>
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            {feeStructureForm.installments.map((inst, i) => (
                                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                                    <span className="text-sm font-semibold text-slate-500">Installment {i+1}</span>
                                    <input type="number" value={(inst.amount as number) || ''} onChange={e => handleInstallmentChange(i, 'amount', Number(e.target.value))} placeholder="Amount" className="p-2 border rounded text-sm"/>
                                    <input type="date" value={inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : ''} onChange={e => handleInstallmentChange(i, 'dueDate', e.target.value)} className="p-2 border rounded text-sm"/>
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-bold">Save Structure</button>
                    </form>
                </div>
            </div>
      )}
      {showApplyStructureModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Apply '{showApplyStructureModal.name}'</h3>
                    <button onClick={() => setShowApplyStructureModal(null)}><X size={20}/></button>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-4">
                    <button onClick={() => setApplyMethod('BATCH')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-md ${applyMethod === 'BATCH' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><Layers size={14}/>To Batch</button>
                    <button onClick={() => setApplyMethod('STUDENTS')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-md ${applyMethod === 'STUDENTS' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><ListChecks size={14}/>To Select Students</button>
                    <button onClick={() => setApplyMethod('SINGLE')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-md ${applyMethod === 'SINGLE' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><UserIcon size={14}/>To Single Student</button>
                  </div>

                  <div className="space-y-4 min-h-[250px]">
                      {applyMethod === 'BATCH' && (
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">Select Batch</label>
                            <select value={selectedApplyBatchId} onChange={e => setSelectedApplyBatchId(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                                <option value="">-- Choose a batch --</option>
                                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                      )}
                      {applyMethod === 'STUDENTS' && (
                          <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">1. Select Batch</label>
                                <select value={selectedApplyBatchId} onChange={e => {setSelectedApplyBatchId(e.target.value); setSelectedStudentIds([]);}} className="w-full p-2 border rounded-lg bg-white">
                                    <option value="">-- Choose a batch --</option>
                                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                              </div>
                              {selectedApplyBatchId && (
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold">2. Select Students</label>
                                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                                    {users.filter(u => u.enrolledBatchIds?.includes(selectedApplyBatchId)).map(s => (
                                      <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer">
                                        <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={(e) => {
                                          if (e.target.checked) setSelectedStudentIds(prev => [...prev, s.id]);
                                          else setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                        }} className="form-checkbox rounded text-blue-600"/>
                                        <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                                        <span className="font-semibold text-sm">{s.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                      )}
                       {applyMethod === 'SINGLE' && (
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">Search Student</label>
                            <input type="text" value={singleStudentSearch} onChange={e => setSingleStudentSearch(e.target.value)} placeholder="Type name to search..." className="w-full p-2 border rounded-lg"/>
                            <div className="max-h-48 overflow-y-auto border rounded-lg">
                              {students.filter(s => s.name.toLowerCase().includes(singleStudentSearch.toLowerCase())).map(s => (
                                <button key={s.id} onClick={() => setSelectedStudentIds([s.id])} className={`w-full text-left flex items-center gap-3 p-2 hover:bg-slate-50 ${selectedStudentIds[0] === s.id ? 'bg-blue-50' : ''}`}>
                                  <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full"/>
                                  <span className="font-semibold text-sm">{s.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                      )}
                  </div>

                  <button onClick={handleApplyStructure} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                    Apply Structure
                  </button>
              </div>
          </div>
      )}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Reminder Settings</h3>
                  <button onClick={() => setShowSettingsModal(false)}><X size={20}/></button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <h4 className="font-semibold text-sm">Automatic Reminders</h4>
                      <p className="text-xs text-slate-500">Send notifications 1, 3, & 7 days before due date.</p>
                    </div>
                    <button onClick={() => setAutoRemindersEnabled(!autoRemindersEnabled)} className={`w-12 h-6 rounded-full p-1 transition-colors ${autoRemindersEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform ${autoRemindersEnabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;