
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, Clock, BookOpen, X, Search, ArrowLeft, Users, FileText, Video, GraduationCap, CheckSquare, Megaphone, Send, Calendar, AlertTriangle, TrendingUp, Pencil, User as UserIcon, Mail, Phone, MapPin, Book, Shield, Printer, ArrowRight, Link as LinkIcon, PlayCircle, ExternalLink } from 'lucide-react';
import { Batch, UserRole, User, Test, StudyMaterial, Announcement, VideoClass, Tab, Question, OnlineTestSubmission, OfflineMark, StudentAnswer, ToastNotification, AttendanceRecord } from '../../types';
import { MOCK_BATCHES, MOCK_USERS_LIST, MOCK_ASSIGNMENTS, MOCK_MATERIALS, MOCK_TESTS, MOCK_VIDEOS, MOCK_SUBMISSIONS, MOCK_ANNOUNCEMENTS, MOCK_ONLINE_SUBMISSIONS, MOCK_OFFLINE_MARKS, MOCK_ATTENDANCE_RECORDS } from '../../data/mockData';
import AssignmentsView from './AssignmentsView';
import StudyMaterialsView from './StudyMaterialsView';
import TestsView from './TestsView';
import VideoClassesView from './VideoClassesView';
import NotificationDetailModal from '../NotificationDetailModal'; // Import the modal

// --- Tab Types & Constants ---
const TABS: { id: Tab; label: string; icon: React.ReactNode, roles: UserRole[] }[] = [
  { id: 'overview', label: 'Overview', icon: <Layers size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
  { id: 'students', label: 'Students', icon: <Users size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER] },
  { id: 'attendance', label: 'Attendance', icon: <CheckSquare size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
  { id: 'materials', label: 'Study Materials', icon: <BookOpen size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
  { id: 'assignments', label: 'Assignments', icon: <FileText size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
  { id: 'tests', label: 'Tests', icon: <GraduationCap size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
  { id: 'videos', label: 'Video Classes', icon: <Video size={16} />, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
];

const WEEK_DAYS_ORDERED = [
    { short: 'Mon', long: 'MON' }, { short: 'Tue', long: 'TUE' }, { short: 'Wed', long: 'WED' },
    { short: 'Thu', long: 'THU' }, { short: 'Fri', long: 'FRI' }, { short: 'Sat', long: 'SAT' },
    { short: 'Sun', long: 'SUN' }
];

interface BatchManagementProps {
  role?: UserRole;
  currentUserId?: string;
  initialBatchId?: string | null;
  initialTabId?: Tab | null;
  onClearInitialIds?: () => void;
  setActiveToast?: (toast: ToastNotification | null) => void;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const BatchManagement: React.FC<BatchManagementProps> = ({ role = UserRole.ADMIN, currentUserId, initialBatchId, initialTabId, onClearInitialIds, setActiveToast, announcements, setAnnouncements, attendanceRecords, setAttendanceRecords }) => {
  const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS_LIST);
  
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [viewingStudent, setViewingStudent] = useState<User | null>(null); // State for viewing individual student detail
  
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  
  const [batchForm, setBatchForm] = useState<Partial<Batch>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Schedule Editing State
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Attendance State
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Announcement State
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ 
    title: '', 
    content: '', 
    targetType: 'BATCH' as 'BATCH' | 'SPECIFIC_STUDENTS',
    targetStudentIds: [] as string[],
    scheduleDate: '',
    scheduleTime: '',
  });
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const studentsInCurrentBatch = selectedBatch ? users.filter(u => u.enrolledBatchIds?.includes(selectedBatch.id) && u.role === UserRole.STUDENT) : [];

  // --- Effects ---
  useEffect(() => {
    if (initialBatchId) {
        const batch = batches.find(b => b.id === initialBatchId);
        if (batch) {
            setSelectedBatch(batch);
            setActiveTab(initialTabId || 'overview');
            if (onClearInitialIds) onClearInitialIds();
        }
    }
  }, [initialBatchId, initialTabId, batches, onClearInitialIds]);
  
  useEffect(() => {
    if (showEditBatchModal && selectedBatch) {
        setBatchForm(selectedBatch);
        const scheduleString = selectedBatch.schedule || "";
        const parts = scheduleString.split(' ');
        const timeIndex = parts.findIndex(p => p.includes(':'));
        if (timeIndex !== -1) {
            let time = parts[timeIndex];
            if (parts[timeIndex+1] && (['AM', 'PM'].includes(parts[timeIndex+1].toUpperCase()))) {
                time += ' ' + parts[timeIndex+1];
            }
            setScheduleTime(time);
            const daysPart = parts.slice(0, timeIndex).join(' ');
            setScheduleDays(daysPart.replace(/,/g, '').split(' ').filter(Boolean).map(d => d.toUpperCase()));
        }
    }
  }, [showEditBatchModal, selectedBatch]);

  useEffect(() => {
    // Reset viewing states when batch changes
    setViewingStudent(null);
  }, [selectedBatch]);
  
  // Reset announcement form when modal closes
  useEffect(() => {
    if (!showAddAnnouncementModal) {
      setAnnouncementForm({
        title: '',
        content: '',
        targetType: 'BATCH',
        targetStudentIds: [],
        scheduleDate: '',
        scheduleTime: '',
      });
    }
  }, [showAddAnnouncementModal]);


  // --- Data Filtering & Derivations ---
  const getFilteredBatches = () => {
    let userBatches = batches;
    if (role === UserRole.TEACHER) userBatches = batches.filter(b => b.teacherId === currentUserId);
    else if (role === UserRole.STUDENT) {
      const student = users.find(u => u.id === currentUserId);
      userBatches = batches.filter(b => student?.enrolledBatchIds?.includes(b.id));
    }
    return userBatches.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.course.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  const filteredBatches = getFilteredBatches();
  
  const calculateBatchProgress = (batch: Batch) => {
    const start = new Date(batch.startDate).getTime();
    const end = new Date(batch.endDate).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };
  
  // --- Handlers ---
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditBatchModal && selectedBatch) {
        const orderedSelectedDays = WEEK_DAYS_ORDERED
            .filter(d => scheduleDays.includes(d.long))
            .map(d => d.short)
            .join(', ');
        const newScheduleString = `${orderedSelectedDays} ${scheduleTime}`;
        const updatedBatch = {
            ...selectedBatch,
            ...(batchForm as Batch),
            schedule: newScheduleString,
            teacher: users.find(u => u.id === batchForm.teacherId)?.name || 'Unassigned'
        };
        setBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
        setSelectedBatch(updatedBatch);
        setShowEditBatchModal(false);
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !currentUserId) return;

    let scheduledFor: number | undefined = undefined;
    if (announcementForm.scheduleDate && announcementForm.scheduleTime) {
      scheduledFor = new Date(`${announcementForm.scheduleDate}T${announcementForm.scheduleTime}`).getTime();
    }

    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      title: announcementForm.title,
      content: announcementForm.content,
      senderId: currentUserId,
      senderName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      createdAt: Date.now(),
      scheduledFor: scheduledFor,
      targetType: announcementForm.targetType,
      targetIds: announcementForm.targetType === 'BATCH' ? [selectedBatch.id] : announcementForm.targetStudentIds,
      batchId: selectedBatch.id,
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    setShowAddAnnouncementModal(false);
    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Announcement Created',
      message: `'${newAnn.title}' has been scheduled/published.`,
      type: 'success'
    });
  };

  const openEditModal = (batch: Batch) => {
    setShowEditBatchModal(true);
  };

  // --- Attendance Handlers ---
  const handleMarkAttendance = (studentId: string, date: string, status: 'PRESENT' | 'ABSENT') => {
    if (!selectedBatch) return;

    setAttendanceRecords(prevRecords => {
      const existingRecordIndex = prevRecords.findIndex(
        r => r.studentId === studentId && r.batchId === selectedBatch.id && r.date === date
      );

      if (existingRecordIndex > -1) {
        // Update existing record
        const updatedRecords = [...prevRecords];
        updatedRecords[existingRecordIndex] = { ...updatedRecords[existingRecordIndex], status };
        return updatedRecords;
      } else {
        // Add new record
        return [
          ...prevRecords,
          { studentId, batchId: selectedBatch.id, date, status }
        ];
      }
    });

    if (setActiveToast) {
        setActiveToast({
            id: `toast_attendance_${Date.now()}`,
            title: 'Attendance Updated',
            message: `Attendance for ${users.find(u => u.id === studentId)?.name} on ${date} marked as ${status}.`,
            type: 'success'
        });
    }
  };

  const generatePastClassDates = (batch: Batch, numDays: number): string[] => {
    const today = new Date();
    const classDays = batch.schedule.split(' ')[0].split(',').map(d => d.trim().toUpperCase());
    const pastDates: string[] = [];

    for (let i = 0; i <= numDays; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayOfWeek = WEEK_DAYS_ORDERED[d.getDay()].long; // 0=Sunday, 1=Monday
        // Only include dates where a class would normally occur
        if (classDays.includes(dayOfWeek)) {
            pastDates.push(d.toISOString().split('T')[0]);
        }
    }
    // Sort in ascending order
    return pastDates.sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
  };

  // --- Render Functions ---
  const renderOverviewTab = () => {
    if (!selectedBatch) return null;
    const progress = calculateBatchProgress(selectedBatch);
    const isStudent = role === UserRole.STUDENT;

    // Content Counts
    const materialsCount = MOCK_MATERIALS.filter(m => m.batchId === selectedBatch.id).length;
    const assignmentsCount = MOCK_ASSIGNMENTS.filter(a => a.batchId === selectedBatch.id).length;
    const testsCount = MOCK_TESTS.filter(t => t.batchId === selectedBatch.id).length;
    const videoClassesCount = MOCK_VIDEOS.filter(v => v.batchId === selectedBatch.id).length;
    const batchAnnouncements = announcements.filter(ann => ann.batchId === selectedBatch.id && (!ann.scheduledFor || ann.scheduledFor <= Date.now())).sort((a,b) => b.createdAt - a.createdAt).slice(0, 2);

    // Live Class Detection
    const now = Date.now();
    const upcomingOrLiveClass = MOCK_VIDEOS.find(video => {
        const classStart = video.date;
        let durationMs = 60 * 60 * 1000; // Default to 1 hour
        if (video.duration.includes(':')) {
            const parts = video.duration.split(':').map(Number);
            durationMs = (parts[0] * 60 + parts[1]) * 1000;
        }
        const classEnd = classStart + durationMs;

        // Class is upcoming (within next 30 mins) or live now
        return video.batchId === selectedBatch.id && now < classEnd && now >= classStart - (30 * 60 * 1000);
    });

    // Helper for live class message
    const getLiveClassMessage = (cls: VideoClass) => {
        const classStart = cls.date;
        const diffMs = classStart - now;
        const minutes = Math.ceil(diffMs / (60 * 1000));
        
        if (minutes <= 0) return 'Live Now!';
        if (minutes <= 30) return `Starts in ${minutes} mins`;
        return `Upcoming: ${new Date(classStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Details Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-3">
                            <BookOpen size={22} className="text-blue-600"/> Course Details
                        </h3>
                        <p className="text-lg font-semibold text-slate-700 mb-2">{selectedBatch.course}</p>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Calendar size={16}/>
                            <span>{new Date(selectedBatch.startDate).toLocaleDateString()} - {new Date(selectedBatch.endDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 text-sm mb-2">Schedule:</h4>
                        <div className="flex items-center gap-2 text-slate-800 font-medium">
                            <Clock size={16}/>
                            <span>{selectedBatch.schedule}</span>
                        </div>
                    </div>
                </div>

                {/* Live Class / Progress Card */}
                {upcomingOrLiveClass ? (
                    <div className="bg-gradient-to-br from-red-500 to-amber-500 text-white p-6 rounded-xl border border-red-400 shadow-lg relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <Video size={150} className="mx-auto my-auto" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 relative z-10 flex items-center gap-3">
                            <PlayCircle size={28}/> {getLiveClassMessage(upcomingOrLiveClass)}
                        </h3>
                        <p className="text-lg font-semibold relative z-10">{upcomingOrLiveClass.title}</p>
                        <p className="text-sm text-red-100 relative z-10">{upcomingOrLiveClass.duration}</p>
                        <a 
                            href={upcomingOrLiveClass.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-4 bg-white text-red-600 font-bold py-3 px-6 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors relative z-10 shadow-md"
                        >
                            Join Class Now <ExternalLink size={16}/>
                        </a>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-3">
                                <TrendingUp size={22} className="text-purple-600"/> Batch Progress
                            </h3>
                            <p className="text-4xl font-bold text-purple-800">{progress}%</p>
                            <p className="text-sm text-slate-500 mt-1">Overall course completion</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mt-4">
                            <div className="bg-purple-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Summary & Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Summary */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Layers size={22} className="text-emerald-600"/> Content Summary
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Study Materials', count: materialsCount, icon: <BookOpen size={18} className="text-blue-500"/>, tab: 'materials' },
                            { label: 'Assignments', count: assignmentsCount, icon: <FileText size={18} className="text-orange-500"/>, tab: 'assignments' },
                            { label: 'Tests & Quizzes', count: testsCount, icon: <GraduationCap size={18} className="text-purple-500"/>, tab: 'tests' },
                            { label: 'Video Classes', count: videoClassesCount, icon: <Video size={18} className="text-red-500"/>, tab: 'videos' },
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setActiveTab(item.tab as Tab)}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon}
                                    <span className="font-medium text-slate-700">{item.label}</span>
                                </div>
                                <span className="text-lg font-bold text-slate-800">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Announcements */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Megaphone size={22} className="text-orange-500"/> Recent Announcements
                    </h3>
                    <div className="space-y-4">
                        {batchAnnouncements.length > 0 ? batchAnnouncements.map(ann => (
                            <div key={ann.id} onClick={() => setViewingAnnouncement(ann)} className="group cursor-pointer">
                                <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{ann.title}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{ann.content}</p>
                                <span className="text-[10px] text-slate-400 mt-2 block">
                                    {new Date(ann.createdAt).toLocaleDateString()} by {ann.senderName}
                                </span>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                No recent announcements for this batch.
                            </div>
                        )}
                    </div>
                    {batchAnnouncements.length > 0 && (
                        <button 
                            onClick={() => setActiveTab('announcements')}
                            className="w-full mt-6 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors border-t border-slate-100 pt-4"
                        >
                            View All Announcements <ArrowRight size={14} className="inline-block ml-1"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderStudentDetail = () => {
    if (!viewingStudent || !selectedBatch) return null;

    // Mock Aggregate Stats for demo
    const totalAssignments = MOCK_ASSIGNMENTS.filter(a => viewingStudent.enrolledBatchIds?.includes(a.batchId)).length;
    const submittedAssignments = MOCK_SUBMISSIONS.filter(s => s.studentId === viewingStudent.id).length;
    const avgAttendance = 88; // Aggregate mock
    const avgGrade = 76; // Aggregate mock

    // Get attendance records for this student in this batch
    const studentAttendanceRecords = attendanceRecords.filter(
        r => r.studentId === viewingStudent.id && r.batchId === selectedBatch.id
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const classDatesForBatch = generatePastClassDates(selectedBatch, 365); // Past year for more realistic total
    const totalPossibleClasses = classDatesForBatch.length;
    const classesAttended = studentAttendanceRecords.filter(r => r.status === 'PRESENT').length;
    const actualAttendancePercentage = totalPossibleClasses > 0 ? (classesAttended / totalPossibleClasses * 100).toFixed(0) : 0;


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setViewingStudent(null)} 
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800">Student Profile</h2>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <img src={viewingStudent.avatar} alt={viewingStudent.name} className="w-24 h-24 rounded-full border-4 border-slate-50 bg-slate-200" />
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-slate-800">{viewingStudent.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            viewingStudent.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {viewingStudent.role}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 text-slate-500 text-sm mt-2">
                            <div className="flex items-center gap-2">
                            <Mail size={16} /> {viewingStudent.email}
                            </div>
                            <div className="flex items-center gap-2">
                            <Phone size={16} /> {viewingStudent.mobile || 'N/A'}
                            </div>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-3xl font-bold text-slate-800">{viewingStudent.enrolledBatchIds?.length || 0}</div>
                    <div className="text-sm text-slate-500">Enrolled Courses</div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <CheckSquare size={20} className="text-emerald-600" />
                        <span className="text-xs font-bold uppercase">Attendance in {selectedBatch.name}</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">{actualAttendancePercentage}%</div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${actualAttendancePercentage}%` }}></div>
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

            {/* Enrolled Courses */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Enrolled Courses</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {viewingStudent.enrolledBatchIds?.length > 0 ? (
                        viewingStudent.enrolledBatchIds.map(batchId => {
                            const batch = batches.find(b => b.id === batchId);
                            if (!batch) return null;
                            return (
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
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400">
                            This student is not enrolled in any batches.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };
  
  const renderStudentsTab = () => {
    if (!selectedBatch) return null;
    const studentsInBatch = users.filter(u => u.enrolledBatchIds?.includes(selectedBatch.id));

    if (viewingStudent) {
        return renderStudentDetail();
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {studentsInBatch.length > 0 ? studentsInBatch.map(student => (
                        <div 
                          key={student.id} 
                          className="p-4 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors"
                          onClick={() => setViewingStudent(student)}
                        >
                            <div className="flex items-center gap-4"><img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" /><h4>{student.name}</h4></div>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1.5">
                                View Profile <ArrowRight size={14} />
                            </button>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-400 text-sm">No students in this batch.</div>
                    )}
                </div>
            </div>
        </div>
    );
  };
  
  const renderAnnouncementsTab = () => {
    if (!selectedBatch || !currentUserId) return null;

    const canManageAnnouncements = role === UserRole.ADMIN || role === UserRole.TEACHER;

    const filteredAnnouncements = announcements.filter(ann => {
      // Always show announcements specifically for this batch
      if (ann.batchId === selectedBatch.id) return true;

      // For students, also show general announcements if they are in this batch
      if (role === UserRole.STUDENT) {
        if (ann.targetType === 'ALL_USERS' && !ann.batchId) return true; // Global announcements
        if (ann.targetType === 'SPECIFIC_STUDENTS' && ann.targetIds?.includes(currentUserId)) return true;
      }
      return false;
    }).sort((a,b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Megaphone size={22} className="text-orange-500"/> Announcements
          </h2>
          {canManageAnnouncements && (
            <button
              onClick={() => setShowAddAnnouncementModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} /> Create Announcement
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredAnnouncements.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredAnnouncements.map(ann => {
                const isScheduled = ann.scheduledFor && ann.scheduledFor > Date.now();
                return (
                  <div key={ann.id} 
                    onClick={() => setViewingAnnouncement(ann)}
                    className="p-4 flex items-start justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                        <Megaphone size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{ann.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ann.content}</p>
                        <div className="text-[10px] text-slate-400 mt-2">
                          {isScheduled ? (
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                              Scheduled for {new Date(ann.scheduledFor).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>Published: {new Date(ann.createdAt).toLocaleDateString()} by {ann.senderName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManageAnnouncements && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Announcement"><Pencil size={16} /></button> */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(window.confirm('Are you sure you want to delete this announcement?')) setAnnouncements(prev => prev.filter(a => a.id !== ann.id)); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete Announcement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Megaphone size={32} className="mx-auto mb-2 opacity-50" />
              No announcements for this batch yet.
            </div>
          )}
        </div>

        {/* Create Announcement Modal */}
        {showAddAnnouncementModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Create New Announcement</h3>
                <button onClick={() => setShowAddAnnouncementModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={announcementForm.title}
                    onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Important Exam Update"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Content</label>
                  <textarea
                    required
                    value={announcementForm.content}
                    onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={4}
                    placeholder="Details about the announcement..."
                  ></textarea>
                </div>

                {/* Targeting Options */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setAnnouncementForm(prev => ({ ...prev, targetType: 'BATCH', targetStudentIds: [] }))}
                      className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        announcementForm.targetType === 'BATCH'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      All Students in this Batch
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnouncementForm(prev => ({ ...prev, targetType: 'SPECIFIC_STUDENTS' }))}
                      className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        announcementForm.targetType === 'SPECIFIC_STUDENTS'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Specific Students
                    </button>
                  </div>
                </div>

                {announcementForm.targetType === 'SPECIFIC_STUDENTS' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Select Students</label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {studentsInCurrentBatch.length > 0 ? (
                        studentsInCurrentBatch.map(s => (
                          <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer">
                            <input
                              type="checkbox"
                              checked={announcementForm.targetStudentIds.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) setAnnouncementForm(prev => ({ ...prev, targetStudentIds: [...prev.targetStudentIds, s.id] }));
                                else setAnnouncementForm(prev => ({ ...prev, targetStudentIds: prev.targetStudentIds.filter(id => id !== s.id) }));
                              }}
                              className="form-checkbox rounded text-blue-600"
                            />
                            <img src={s.avatar} alt={s.name} className="w-8 h-8 rounded-full" />
                            <span className="font-semibold text-sm">{s.name}</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-center text-sm text-slate-400 py-4">No students in this batch.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Schedule Option */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Schedule Date (Optional)</label>
                    <input
                      type="date"
                      value={announcementForm.scheduleDate}
                      onChange={e => setAnnouncementForm({ ...announcementForm, scheduleDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Schedule Time (Optional)</label>
                    <input
                      type="time"
                      value={announcementForm.scheduleTime}
                      onChange={e => setAnnouncementForm({ ...announcementForm, scheduleTime: e.target.value })}
                      disabled={!announcementForm.scheduleDate}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Publish Announcement
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notification Detail Modal */}
        {viewingAnnouncement && (
          <NotificationDetailModal 
            announcement={viewingAnnouncement}
            onClose={() => setViewingAnnouncement(null)}
          />
        )}
      </div>
    );
  };
  
  const renderAttendanceTab = () => {
    if (!selectedBatch || !currentUserId) return null;

    const studentsInBatch = users.filter(u => u.enrolledBatchIds?.includes(selectedBatch.id));
    const pastClassDates = generatePastClassDates(selectedBatch, 30); // Generate dates for last 30 days

    // Teacher/Admin View
    if (role === UserRole.ADMIN || role === UserRole.TEACHER) {
      const today = new Date().toISOString().split('T')[0];
      const studentsAttendanceForDate = studentsInBatch.map(student => {
        const record = attendanceRecords.find(
          r => r.studentId === student.id && r.batchId === selectedBatch.id && r.date === selectedAttendanceDate
        );
        return { student, status: record ? record.status : 'ABSENT' }; // Default to Absent if no record
      });

      const presentCount = studentsAttendanceForDate.filter(s => s.status === 'PRESENT').length;
      const totalStudents = studentsInBatch.length;
      const attendancePercentage = totalStudents > 0 ? (presentCount / totalStudents * 100).toFixed(0) : 0;

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CheckSquare size={20} className="text-emerald-600"/> Mark Attendance
            </h3>
            <div className="flex items-center gap-3">
              <label htmlFor="attendanceDate" className="text-sm font-medium text-slate-700">Date:</label>
              <select
                id="attendanceDate"
                value={selectedAttendanceDate}
                onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {pastClassDates.map(date => (
                    <option key={date} value={date}>
                        {new Date(date).toLocaleDateString()} {date === today ? '(Today)' : ''}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="font-bold text-slate-800">Students ({attendancePercentage}% Present)</h4>
            </div>
            <div className="divide-y divide-slate-100">
              {studentsAttendanceForDate.length > 0 ? studentsAttendanceForDate.map(({ student, status }) => (
                <div key={student.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                    <h4>{student.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkAttendance(student.id, selectedAttendanceDate, 'PRESENT')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        status === 'PRESENT' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(student.id, selectedAttendanceDate, 'ABSENT')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        status === 'ABSENT' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 text-sm">No students in this batch.</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Student View
    if (role === UserRole.STUDENT) {
      const studentAttendance = attendanceRecords.filter(
        r => r.studentId === currentUserId && r.batchId === selectedBatch.id
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Latest first

      const totalClasses = pastClassDates.length; // Count all potential class dates for the batch
      const classesAttended = studentAttendance.filter(r => r.status === 'PRESENT').length;
      const studentAttendancePercentage = totalClasses > 0 ? (classesAttended / totalClasses * 100).toFixed(0) : 0;

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><CheckSquare size={20} className="text-emerald-600"/><span>Classes Attended</span></div>
                <div className="text-3xl font-bold text-slate-800">{classesAttended} / {totalClasses}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><TrendingUp size={20} className="text-blue-600"/><span>Attendance Rate</span></div>
                <div className="text-3xl font-bold text-blue-800">{studentAttendancePercentage}%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h4 className="font-bold text-slate-800">My Attendance History</h4>
            </div>
            <div className="divide-y divide-slate-100">
              {studentAttendance.length > 0 ? studentAttendance.map(record => (
                <div key={record.date} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-slate-400"/>
                    <h4 className="font-semibold text-slate-800">{new Date(record.date).toLocaleDateString()}</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {record.status}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400 text-sm">No attendance records found for you in this batch.</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };
  
  const renderContent = () => {
    if (!selectedBatch) return null;
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'students': return renderStudentsTab(); // Now includes student detail view
      case 'attendance': return renderAttendanceTab();
      case 'announcements': return renderAnnouncementsTab();
      case 'materials': return <StudyMaterialsView role={role} batchId={selectedBatch.id} setActiveToast={setActiveToast} />;
      case 'assignments': return <AssignmentsView role={role} batchId={selectedBatch.id} setActiveToast={setActiveToast} />;
      case 'tests': return <TestsView role={role} batchId={selectedBatch.id} currentUserId={currentUserId} setActiveToast={setActiveToast} />;
      case 'videos': return <VideoClassesView role={role} batchId={selectedBatch.id} setActiveToast={setActiveToast} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] gap-4 md:gap-6 animate-in fade-in">
      {/* Batch List (Sidebar) */}
      <div className={`
        ${selectedBatch ? 'hidden md:flex' : 'flex'} 
        w-full md:w-80 lg:w-96 flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300
      `}>
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {role === UserRole.STUDENT ? 'My Courses' : 'Batch Management'}
          </h2>
          <div className="relative mt-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredBatches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => { setSelectedBatch(batch); setViewingStudent(null); }} // Clear student detail on batch change
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedBatch?.id === batch.id
                  ? 'bg-blue-50 border-blue-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 group-hover:text-blue-600">{batch.name}</h3>
                <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-full">{batch.studentsCount} Students</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">{batch.course}</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${calculateBatchProgress(batch)}%` }}></div>
              </div>
            </button>
          ))}
        </div>
        {(role === UserRole.ADMIN || role === UserRole.TEACHER) && (
          <div className="p-2 border-t border-slate-100"><button onClick={() => setShowAddBatchModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-lg font-semibold text-sm hover:bg-slate-700 transition-colors"><Plus size={16} /> Add New Batch</button></div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`
        ${!selectedBatch ? 'hidden md:flex' : 'flex'}
        flex-1 flex-col min-w-0
      `}>
        {selectedBatch ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4 border-b border-slate-100 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => {setSelectedBatch(null); setViewingStudent(null);}} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 truncate">{selectedBatch.name}</h3>
                  <p className="text-xs text-slate-500">{selectedBatch.course} by {selectedBatch.teacher}</p>
                </div>
              </div>
              {(role === UserRole.ADMIN || role === UserRole.TEACHER) && <button onClick={() => openEditModal(selectedBatch)} className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-200"><Pencil size={12} /> Edit</button>}
            </div>
            
            <div className="border-b border-slate-100 overflow-x-auto">
              <div className="flex gap-2 p-2 min-w-max">
                {TABS.filter(t => t.roles.includes(role)).map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setViewingStudent(null); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">{renderContent()}</div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-center p-8">
            <div>
              <Layers size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="font-bold">Select a batch</h3>
              <p className="text-sm">Choose a batch from the list to see its details.</p>
            </div>
          </div>
        )}
      </div>

      {showEditBatchModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleBatchSubmit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Edit Batch</h3><button type="button" onClick={() => setShowEditBatchModal(false)}><X size={20}/></button></div>
                  <div className="space-y-4">
                      <input value={batchForm.name || ''} onChange={e => setBatchForm({...batchForm, name: e.target.value})} className="w-full p-2 border rounded" placeholder="Batch Name" />
                      <div className="grid grid-cols-2 gap-4">
                          <input value={batchForm.startDate || ''} onChange={e => setBatchForm({...batchForm, startDate: e.target.value})} type="date" className="w-full p-2 border rounded" />
                          <input value={batchForm.endDate || ''} onChange={e => setBatchForm({...batchForm, endDate: e.target.value})} type="date" className="w-full p-2 border rounded" />
                      </div>
                      <select value={batchForm.teacherId || ''} onChange={e => setBatchForm({...batchForm, teacherId: e.target.value})} className="w-full p-2 border rounded bg-white">
                          <option value="">Select Teacher</option>
                          {users.filter(u => u.role === UserRole.TEACHER).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <div>
                          <label className="text-sm font-semibold">Schedule</label>
                          <div className="flex items-center gap-2 mt-1">
                              {WEEK_DAYS_ORDERED.map(day => (
                                  <button key={day.long} type="button" onClick={() => setScheduleDays(prev => prev.includes(day.long) ? prev.filter(d => d !== day.long) : [...prev, day.long])} className={`w-10 h-10 rounded-full text-xs font-bold border ${scheduleDays.includes(day.long) ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 border-slate-200'}`}>{day.short}</button>
                              ))}
                              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="p-2 border rounded-lg text-sm" />
                          </div>
                      </div>
                  </div>
                  <button type="submit" className="w-full mt-4 py-2 bg-blue-600 text-white rounded font-bold">Save Changes</button>
              </form>
          </div>
      )}
    </div>
  );
};

export default BatchManagement;
