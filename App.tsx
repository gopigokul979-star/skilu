
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import StudentView from './components/Dashboard/StudentView';
import TeacherView from './components/Dashboard/TeacherView';
import AdminView from './components/Dashboard/AdminView';
import UserManagement from './components/Dashboard/UserManagement';
import BatchManagement from './components/Dashboard/BatchManagement';
import AssignmentsView from './components/Dashboard/AssignmentsView';
import ScheduleView from './components/Dashboard/ScheduleView';
import FinanceView from './components/Dashboard/FinanceView';
import { UserRole, User, Tab, FeeStructure, PaymentRecord, ToastNotification, Announcement, AttendanceRecord } from './types';
import { MOCK_USERS_LIST, MOCK_FEE_STRUCTURES, MOCK_PAYMENT_RECORDS, MOCK_BATCHES, MOCK_ANNOUNCEMENTS, MOCK_ATTENDANCE_RECORDS } from './data/mockData';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.STUDENT);
  const [currentView, setCurrentView] = useState('dashboard');
  const [targetBatchId, setTargetBatchId] = useState<string | null>(null);
  const [targetTabId, setTargetTabId] = useState<Tab | null>(null);
  
  // Manage current user state for profile updates
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);

  // Global Data State
  const [users, setUsers] = useState<User[]>(MOCK_USERS_LIST);
  const [batches, setBatches] = useState(MOCK_BATCHES);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(MOCK_FEE_STRUCTURES);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(MOCK_PAYMENT_RECORDS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE_RECORDS); // NEW: Global state for attendance

  // UI State
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const sentReminders = useRef<Set<string>>(new Set());

  // Handle User Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  // Handle User Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(undefined);
    setCurrentView('dashboard');
  };

  // Demo: Switch Persona (Available via sidebar for demo purposes)
  const handleDemoRoleSwitch = (newRole: UserRole) => {
    // Determine user ID based on role to simulate switching accounts
    let userId = '';
    const DEMO_TEACHER_ID = 'u2'; 
    const DEMO_STUDENT_ID = 'u1';
    const DEMO_ADMIN_ID = 'admin'; 

    if (newRole === UserRole.TEACHER) userId = DEMO_TEACHER_ID;
    else if (newRole === UserRole.STUDENT) userId = DEMO_STUDENT_ID;
    else if (newRole === UserRole.ADMIN) userId = DEMO_ADMIN_ID;
    
    const foundUser = users.find(u => u.id === userId);
    
    if (foundUser) {
        setCurrentUser(foundUser);
        setCurrentRole(newRole);
        setCurrentView('dashboard');
        // Toast notification to confirm switch
        setActiveToast({
            id: `switch_${Date.now()}`,
            title: 'Demo Persona Switched',
            message: `You are now viewing as ${newRole.toLowerCase()}: ${foundUser.name}`,
            type: 'info'
        });
    }
  };
  
  // --- Payment Reminder Logic ---
  useEffect(() => {
    const checkPaymentDues = () => {
      if (!currentUser || currentUser.role !== UserRole.STUDENT) return;
      
      const student = currentUser;
      if (!student.feeStructureId) return;

      const feeStructure = feeStructures.find(fs => fs.id === student.feeStructureId);
      if (!feeStructure) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      feeStructure.installments.forEach(inst => {
        const isPaid = paymentRecords.some(p => p.studentId === student.id && p.installmentNumber === inst.installmentNumber);
        if (isPaid) return;

        const dueDate = new Date(inst.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const timeDiff = dueDate.getTime() - today.getTime();
        if (timeDiff < 0) return; // Overdue, handle separately if needed

        const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        const reminderDays = [1, 3, 7];
        if (reminderDays.includes(daysUntilDue)) {
          const reminderKey = `${student.id}-${inst.installmentNumber}-${daysUntilDue}`;

          if (!sentReminders.current.has(reminderKey)) {
            // 1. Create Announcement for the Bell
            const newAnnouncement: Announcement = {
              id: `rem_${Date.now()}`,
              title: `Payment Reminder: Fee Due in ${daysUntilDue} ${daysUntilDue > 1 ? 'Days' : 'Day'}`,
              content: `Your fee payment of ₹${inst.amount.toLocaleString()} for installment #${inst.installmentNumber} is due on ${new Date(inst.dueDate).toLocaleDateString()}. Please pay on time to avoid issues.`,
              senderId: 'system',
              senderName: 'Finance Department',
              createdAt: Date.now(),
              targetType: 'SPECIFIC_STUDENTS',
              targetIds: [student.id],
              isRead: false
            };
            setAnnouncements(prev => [newAnnouncement, ...prev]);

            // 2. Create Toast Notification for Push
            const newToast: ToastNotification = {
              id: `toast_${Date.now()}`,
              title: 'Payment Reminder',
              message: `Your fee installment is due in ${daysUntilDue} ${daysUntilDue > 1 ? 'days' : 'day'}.`,
              type: 'warning'
            };
            setActiveToast(newToast);

            // 3. Mark as sent
            sentReminders.current.add(reminderKey);
          }
        }
      });
    };
    
    // Check every 5 seconds for demo purposes
    const intervalId = setInterval(checkPaymentDues, 5000);
    return () => clearInterval(intervalId);
  }, [currentUser, feeStructures, paymentRecords, users, setAnnouncements, setActiveToast]);


  // Handle navigation from Schedule to Batch Details
  const handleBatchClick = (batchId: string, targetTab?: Tab) => {
    setTargetBatchId(batchId);
    setTargetTabId(targetTab || null);
    // Determine view name based on role (Sidebar logic uses different IDs)
    if (currentRole === UserRole.STUDENT) {
      setCurrentView('courses');
    } else {
      setCurrentView('batches');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    // In a real app, this would be an API call
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  const renderContent = () => {
    // Shared views
    if (currentView === 'schedule') {
      return (
        <ScheduleView 
          role={currentRole} 
          currentUserId={currentUser?.id} 
          onBatchClick={handleBatchClick}
        />
      );
    }
    
    if (currentView === 'assignments') {
      return <AssignmentsView role={currentRole} setActiveToast={setActiveToast} />;
    }
    
    if (currentView === 'batches' || currentView === 'courses') {
      return <BatchManagement 
        role={currentRole} 
        currentUserId={currentUser?.id} 
        initialBatchId={targetBatchId}
        initialTabId={targetTabId}
        onClearInitialIds={() => {
            setTargetBatchId(null);
            setTargetTabId(null);
        }}
        setActiveToast={setActiveToast}
        announcements={announcements}
        setAnnouncements={setAnnouncements}
        attendanceRecords={attendanceRecords}
        setAttendanceRecords={setAttendanceRecords}
      />;
    }

    const financeView = (
      <FinanceView 
        users={users} 
        batches={batches}
        feeStructures={feeStructures}
        paymentRecords={paymentRecords}
        setFeeStructures={setFeeStructures}
        setUsers={setUsers}
        role={currentRole}
        setAnnouncements={setAnnouncements}
        setActiveToast={setActiveToast}
        attendanceRecords={attendanceRecords}
        setAttendanceRecords={setAttendanceRecords}
      />
    );

    switch (currentRole) {
      case UserRole.STUDENT:
        if (currentView === 'dashboard') return <StudentView onBatchClick={handleBatchClick} currentUser={currentUser} />;
        return <StudentView onBatchClick={handleBatchClick} currentUser={currentUser} />;
      
      case UserRole.TEACHER:
        if (currentView === 'dashboard') return <TeacherView onBatchClick={handleBatchClick} currentUser={currentUser} />;
        if (currentView === 'finance') return financeView;
        return <TeacherView onBatchClick={handleBatchClick} currentUser={currentUser} />;

      case UserRole.ADMIN:
        if (currentView === 'users') return <UserManagement />;
        if (currentView === 'dashboard') return <AdminView onNavigate={setCurrentView} />;
        if (currentView === 'finance') return financeView;
        return <AdminView onNavigate={setCurrentView} />;
      default:
        return <div>Select a role</div>;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout 
      role={currentRole} 
      onChangeRole={handleDemoRoleSwitch}
      currentView={currentView}
      onNavigate={setCurrentView}
      currentUser={currentUser}
      onUpdateUser={handleUpdateUser}
      feeStructures={feeStructures}
      paymentRecords={paymentRecords}
      announcements={announcements}
      setAnnouncements={setAnnouncements}
      activeToast={activeToast}
      onCloseToast={() => setActiveToast(null)}
      attendanceRecords={attendanceRecords}
      setAttendanceRecords={setAttendanceRecords}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
