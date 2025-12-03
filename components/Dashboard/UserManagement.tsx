
import React, { useState } from 'react';
import { Users, GraduationCap, Plus, Trash2, X, Search, Filter, ArrowLeft, Mail, Calendar, BookOpen, CheckSquare, FileText, Unlock, Lock, UserPlus, UserCheck, UserX } from 'lucide-react';
import { User, UserRole } from '../../types';
import { MOCK_USERS_LIST, MOCK_BATCHES, MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS } from '../../data/mockData';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS_LIST);
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ALUMNI' | 'DISCONTINUED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.STUDENT });
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const roleMatch = filterRole === 'ALL' ? true : user.role === filterRole;
    const statusMatch = filterStatus === 'ALL' ? true : user.status === filterStatus;
    const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && statusMatch && searchMatch;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: `https://ui-avatars.com/api/?name=${newUser.name}&background=random`,
      profileLocked: false,
      status: 'ACTIVE',
      joinDate: Date.now(),
    };
    setUsers([...users, user]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: UserRole.STUDENT });
  };

  const handleDeleteUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
      if (viewingUser?.id === id) setViewingUser(null);
    }
  };

  const handleUnlockProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Unlock this profile for editing? The user will be able to change their details.')) {
        setUsers(users.map(u => u.id === id ? { ...u, profileLocked: false } : u));
        // If viewing detailed, update that too
        if (viewingUser?.id === id) {
            setViewingUser(prev => prev ? { ...prev, profileLocked: false } : null);
        }
    }
  };
  
  // Calculate Stats
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const stats = {
      total: users.length,
      active: users.filter(u => u.role === UserRole.STUDENT && u.status === 'ACTIVE').length,
      new: users.filter(u => u.joinDate && u.joinDate > oneMonthAgo).length,
      alumni: users.filter(u => u.status === 'ALUMNI').length,
      discontinued: users.filter(u => u.status === 'DISCONTINUED').length
  };

  const renderUserDetail = () => {
    if (!viewingUser) return null;

    // Calculate Stats for the User
    const enrolledBatches = MOCK_BATCHES.filter(b => viewingUser.enrolledBatchIds?.includes(b.id));
    const teacherBatches = MOCK_BATCHES.filter(b => b.teacherId === viewingUser.id);
    
    // Mock Aggregate Stats
    const totalAssignments = MOCK_ASSIGNMENTS.filter(a => viewingUser.enrolledBatchIds?.includes(a.batchId)).length;
    const submittedAssignments = MOCK_SUBMISSIONS.filter(s => s.studentId === viewingUser.id).length;
    const avgAttendance = 88; // Aggregate mock
    const avgGrade = 76; // Aggregate mock

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setViewingUser(null)} 
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800">User Profile</h2>
                </div>
                
                {/* Unlock Button for Profile Detail View */}
                {viewingUser.profileLocked && (
                    <button 
                        onClick={(e) => handleUnlockProfile(viewingUser.id, e)}
                        className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-semibold border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                        <Unlock size={16} />
                        Unlock Editing
                    </button>
                )}
            </div>

            {/* Profile Card */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <img src={viewingUser.avatar} alt={viewingUser.name} className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-200" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-slate-800">{viewingUser.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            viewingUser.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {viewingUser.role}
                        </span>
                        {viewingUser.profileLocked && <Lock size={14} className="text-amber-500" title="Profile Locked" />}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 text-slate-500 text-sm mt-2">
                            <div className="flex items-center gap-2">
                            <Mail size={16} /> {viewingUser.email}
                            </div>
                            <div className="flex items-center gap-2">
                            <Calendar size={16} /> Joined {viewingUser.joinDate ? new Date(viewingUser.joinDate).toLocaleDateString() : 'N/A'}
                            </div>
                    </div>
                </div>
                {viewingUser.role === UserRole.STUDENT && (
                        <div className="text-right hidden md:block">
                        <div className="text-3xl font-bold text-slate-800">{enrolledBatches.length}</div>
                        <div className="text-sm text-slate-500">Active Courses</div>
                        </div>
                )}
                 {viewingUser.role === UserRole.TEACHER && (
                        <div className="text-right hidden md:block">
                        <div className="text-3xl font-bold text-slate-800">{teacherBatches.length}</div>
                        <div className="text-sm text-slate-500">Classes Taught</div>
                        </div>
                )}
            </div>

            {/* Stats Row (Students Only) */}
            {viewingUser.role === UserRole.STUDENT && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <CheckSquare size={20} className="text-emerald-600" />
                            <span className="text-xs font-bold uppercase">Avg Attendance</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{avgAttendance}%</div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgAttendance}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <FileText size={20} className="text-blue-600" />
                            <span className="text-xs font-bold uppercase">Assignments</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{submittedAssignments}/{totalAssignments}</div>
                        <div className="text-xs text-slate-400 mt-1">Submission Rate</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <GraduationCap size={20} className="text-purple-600" />
                            <span className="text-xs font-bold uppercase">Overall Grade</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{avgGrade}%</div>
                        <div className="text-xs text-slate-400 mt-1">Across all courses</div>
                    </div>
                </div>
            )}

            {/* Related Classes / Batches */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">
                        {viewingUser.role === UserRole.TEACHER ? 'Teaching Schedule' : 'Enrolled Courses'}
                    </h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {(viewingUser.role === UserRole.TEACHER ? teacherBatches : enrolledBatches).map(batch => (
                        <div key={batch.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{batch.name}</h4>
                                    <p className="text-sm text-slate-500">{batch.course}</p>
                                </div>
                            </div>
                            <div className="text-sm text-slate-600 flex items-center gap-2">
                                    <Calendar size={14} />
                                    {batch.schedule}
                            </div>
                        </div>
                    ))}
                    {(viewingUser.role === UserRole.TEACHER ? teacherBatches : enrolledBatches).length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No classes associated with this user.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  if (viewingUser) {
    return renderUserDetail();
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <p className="text-slate-500">Manage all student, teacher, and alumni accounts</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
            {label: "Total Users", value: stats.total, icon: <Users size={20}/>, color: "text-slate-600"},
            {label: "Active Students", value: stats.active, icon: <UserCheck size={20}/>, color: "text-emerald-600"},
            {label: "New This Month", value: stats.new, icon: <UserPlus size={20}/>, color: "text-blue-600"},
            {label: "Alumni", value: stats.alumni, icon: <GraduationCap size={20}/>, color: "text-purple-600"},
            {label: "Discontinued", value: stats.discontinued, icon: <UserX size={20}/>, color: "text-red-600"},
        ].map(s => (
            <div key={s.label} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4`}>
                <div className={`p-3 rounded-lg bg-slate-50 ${s.color}`}>{s.icon}</div>
                <div>
                    <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                    <div className="text-xs font-semibold text-slate-500">{s.label}</div>
                </div>
            </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
             <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)} className="bg-slate-100 border-slate-200 text-slate-500 text-xs font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="ALL">All Roles</option>
                <option value={UserRole.TEACHER}>Teachers</option>
                <option value={UserRole.STUDENT}>Students</option>
             </select>
             <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-slate-100 border-slate-200 text-slate-500 text-xs font-semibold rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ALUMNI">Alumni</option>
                <option value="DISCONTINUED">Discontinued</option>
             </select>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setViewingUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-slate-200" />
                        <span className="font-semibold text-slate-800">{user.name}</span>
                        {user.profileLocked && <Lock size={12} className="text-amber-500" title="Profile Locked" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.TEACHER 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === UserRole.STUDENT
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        user.status === 'ALUMNI' ? 'bg-slate-100 text-slate-600' :
                        user.status === 'DISCONTINUED' ? 'bg-red-100 text-red-800' : ''
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                          {/* Admin Unlock Action */}
                          {user.profileLocked && (
                              <button 
                                onClick={(e) => handleUnlockProfile(user.id, e)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Unlock Profile"
                            >
                                <Unlock size={16} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDeleteUser(user.id, e)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete User"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No users found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New User</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. jane@edunexus.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewUser({...newUser, role: UserRole.STUDENT})}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      newUser.role === UserRole.STUDENT 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Users size={16} />
                    Student
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewUser({...newUser, role: UserRole.TEACHER})}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      newUser.role === UserRole.TEACHER 
                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <GraduationCap size={16} />
                    Teacher
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;