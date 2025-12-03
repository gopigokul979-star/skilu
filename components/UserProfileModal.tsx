import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Phone, MapPin, Calendar, Book, Upload, FileText, Shield, Save, Camera, Lock, CreditCard, Printer } from 'lucide-react';
import { User, UserRole, FeeStructure, PaymentRecord } from '../types';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  feeStructures: FeeStructure[];
  paymentRecords: PaymentRecord[];
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onSave, feeStructures, paymentRecords }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'payments'>('personal');
  const [viewingReceipt, setViewingReceipt] = useState<PaymentRecord | null>(null);

  // Determine if profile is editable (not locked)
  const isEditable = !user.profileLocked;

  const handleChange = (field: keyof User, value: any) => {
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (docType: 'academic' | 'aadhar' | 'addressProof', file: File | null) => {
    if (!isEditable || !file) return;
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: file.name // In a real app, this would be the file URL/Blob
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // When saving, lock the profile so it can't be edited again without Admin action
    const updatedUser = { ...formData, profileLocked: true };
    onSave(updatedUser);
    onClose();
  };
  
  const renderPaymentsTab = () => {
    if (!user || !user.feeStructureId) return <div className="p-8 text-center text-slate-400">No fee structure assigned.</div>;
    
    const feeStructure = feeStructures.find(fs => fs.id === user.feeStructureId);
    if (!feeStructure) return <div className="p-8 text-center text-slate-400">Fee structure not found.</div>;

    const studentPayments = paymentRecords.filter(p => p.studentId === user.id && p.feeStructureId === feeStructure.id);
    const totalPaid = studentPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const balance = feeStructure.totalAmount - totalPaid;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-500 mb-2">Total Fee Amount</h4>
            <div className="text-3xl font-bold text-slate-800">₹{feeStructure.totalAmount.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">Amount Paid</h4>
            <div className="text-3xl font-bold text-emerald-800">₹{totalPaid.toLocaleString()}</div>
          </div>
          <div className={`bg-white p-5 rounded-xl border shadow-sm ${balance > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
            <h4 className={`text-sm font-semibold mb-2 ${balance > 0 ? 'text-red-700' : 'text-slate-500'}`}>Balance Due</h4>
            <div className={`text-3xl font-bold ${balance > 0 ? 'text-red-800' : 'text-slate-800'}`}>₹{balance.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Installment Details</h3>
            <div className="space-y-3">
                {feeStructure.installments.map(inst => {
                    const payment = studentPayments.find(p => p.installmentNumber === inst.installmentNumber);
                    const isOverdue = !payment && Date.now() > inst.dueDate;
                    
                    let statusPill;
                    if (payment) {
                        statusPill = <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">PAID</span>;
                    } else if (isOverdue) {
                        statusPill = <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">OVERDUE</span>;
                    } else {
                        statusPill = <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">DUE</span>;
                    }

                    return (
                        <div key={inst.installmentNumber} className="p-4 border border-slate-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="font-bold text-slate-800">Installment {inst.installmentNumber}</h4>
                                <p className="text-sm text-slate-500">Due Date: {new Date(inst.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div className="font-bold text-lg text-slate-800">₹{inst.amount.toLocaleString()}</div>
                            <div className="flex items-center gap-4">
                                {statusPill}
                                {payment ? (
                                    <button onClick={() => setViewingReceipt(payment)} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                                        <Printer size={16}/> View Receipt
                                    </button>
                                ) : (
                                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800">Pay Now</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    );
  };


  return (
    <>
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header / Cover Image */}
        <div className="relative h-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800">
             <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10">
                <X size={20} />
             </button>
             
             {/* Profile Lock Banner */}
             {!isEditable && (
                <div className="absolute top-4 left-4 bg-amber-400/90 text-amber-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm backdrop-blur-sm">
                   <Lock size={12} />
                   Profile Locked
                </div>
             )}

             <div className="absolute -bottom-14 left-8">
               <div className="relative group">
                 <img 
                   src={formData.avatar} 
                   alt={formData.name} 
                   className="w-28 h-28 rounded-full border-[5px] border-white shadow-lg bg-white object-cover"
                 />
                 {isEditable && (
                    <button className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-full border-2 border-white hover:bg-blue-600 transition-colors shadow-sm">
                        <Camera size={14} />
                    </button>
                 )}
               </div>
             </div>
        </div>
        
        {/* Info Section */}
        <div className="mt-16 px-8 flex justify-between items-start">
             <div>
                <h1 className="text-2xl font-bold text-slate-900">{formData.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        formData.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-700' : 
                        formData.role === UserRole.STUDENT ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                        {formData.role}
                    </span>
                    <span className="text-slate-500">{formData.email}</span>
                </div>
             </div>
             
             {!isEditable && (
                 <div className="text-xs text-slate-400 text-right max-w-[200px] leading-tight">
                     Editing is disabled. Please contact an administrator to update your details.
                 </div>
             )}
        </div>

        {/* Tabs (Student Only) */}
        {user.role === UserRole.STUDENT && (
        <div className="px-8 mt-8 border-b border-slate-200 flex gap-8">
            <button 
                onClick={() => setActiveTab('personal')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'personal' ? 'text-blue-700 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                <UserIcon size={16} />
                Personal Details
            </button>
            <button 
                onClick={() => setActiveTab('academic')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'academic' ? 'text-blue-700 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                <Book size={16} />
                Academic & Documents
            </button>
            <button 
                onClick={() => setActiveTab('payments')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'payments' ? 'text-blue-700 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
            >
                <CreditCard size={16} />
                Payments
            </button>
        </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-w-3xl mx-auto">
            
            {/* Personal Details Tab */}
            {(user.role !== UserRole.STUDENT || activeTab === 'personal') && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <UserIcon size={14} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <Mail size={14} /> Email Address
                    </label>
                    <input 
                      type="email" 
                      value={formData.email}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <Phone size={14} /> Mobile Number
                    </label>
                    <input 
                      type="tel" 
                      value={formData.mobile || ''}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      disabled={!isEditable}
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {user.role === UserRole.STUDENT && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Calendar size={14} /> Date of Birth
                      </label>
                      <input 
                        type="date" 
                        value={formData.dob || ''}
                        onChange={(e) => handleChange('dob', e.target.value)}
                        disabled={!isEditable}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  )}

                  {user.role === UserRole.STUDENT && (
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <MapPin size={14} /> Permanent Address
                      </label>
                      <div className="flex gap-4">
                         <div className="flex-1 space-y-2">
                             <input 
                                type="text" 
                                value={formData.place || ''}
                                onChange={(e) => handleChange('place', e.target.value)}
                                disabled={!isEditable}
                                placeholder="City / Place"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                            />
                         </div>
                         <div className="flex-[2] space-y-2">
                            <input 
                                type="text" 
                                value={formData.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                disabled={!isEditable}
                                placeholder="Street Address"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                            />
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Academic & Documents Tab (Student Only) */}
            {user.role === UserRole.STUDENT && activeTab === 'academic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <Book size={14} /> Highest Qualification
                    </label>
                    <input 
                        type="text" 
                        value={formData.qualification || ''}
                        onChange={(e) => handleChange('qualification', e.target.value)}
                        disabled={!isEditable}
                        placeholder="e.g. Grade 12 / High School Diploma"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Verification Documents</h3>
                    <div className="grid grid-cols-1 gap-4">
                        
                        {/* Helper for Documents */}
                        {[
                            { id: 'academic', label: 'Academic Certificate', icon: <FileText size={20} />, color: 'blue' },
                            { id: 'aadhar', label: 'Aadhaar / ID Card', icon: <Shield size={20} />, color: 'emerald' },
                            { id: 'addressProof', label: 'Address Proof', icon: <MapPin size={20} />, color: 'purple' },
                        ].map((doc: any) => (
                            <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 bg-${doc.color}-100 text-${doc.color}-600 rounded-lg`}>{doc.icon}</div>
                                    <div>
                                    <div className="text-sm font-semibold text-slate-800">{doc.label}</div>
                                    <div className="text-xs text-slate-500">
                                        {formData.documents?.[doc.id as keyof typeof formData.documents] || 'No file uploaded'}
                                    </div>
                                    </div>
                                </div>
                                {isEditable ? (
                                    <label className="cursor-pointer text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
                                    Upload
                                    <input type="file" className="hidden" onChange={(e) => handleDocumentChange(doc.id, e.target.files?.[0] || null)} />
                                    </label>
                                ) : (
                                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">Locked</span>
                                )}
                            </div>
                        ))}

                    </div>
                    </div>
                </div>
              </div>
            )}
            
            {/* Payments Tab (Student Only) */}
            {user.role === UserRole.STUDENT && activeTab === 'payments' && renderPaymentsTab()}

            {/* Footer Actions */}
            {isEditable && (
                <div className="pt-2 flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Save Profile
                    </button>
                </div>
            )}
          </form>
        </div>
      </div>
    </div>
    
    {/* Receipt Modal */}
    {viewingReceipt && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95">
                <div id="receipt-content" className="p-8">
                    <h2 className="text-2xl font-bold text-center mb-2">Payment Receipt</h2>
                    <p className="text-center text-sm text-slate-500 mb-8">Skill U Learning App</p>
                    <div className="flex justify-between text-sm mb-6">
                        <div><span className="font-bold">Receipt ID:</span> {viewingReceipt.id}</div>
                        <div><span className="font-bold">Date:</span> {new Date(viewingReceipt.paymentDate).toLocaleDateString()}</div>
                    </div>
                    <div className="border rounded-lg p-4 mb-6">
                        <h3 className="font-bold mb-2">Billed To:</h3>
                        <p>{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-right py-2">Amount</th></tr></thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-4">Fee for Installment #{viewingReceipt.installmentNumber}</td>
                                <td className="text-right py-4">₹{viewingReceipt.amountPaid.toLocaleString()}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="text-right py-4 font-bold">Total Paid:</td>
                                <td className="text-right py-4 font-bold text-lg">₹{viewingReceipt.amountPaid.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <p className="text-xs text-center text-slate-400 mt-8">Thank you for your payment!</p>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={() => setViewingReceipt(null)} className="px-4 py-2 border rounded-lg text-sm font-semibold">Close</button>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2"><Printer size={16}/> Download PDF</button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default UserProfileModal;