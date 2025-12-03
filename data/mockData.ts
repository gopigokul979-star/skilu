
import { Batch, ClassSession, User, UserRole, Assignment, Submission, StudyMaterial, Test, VideoClass, Announcement, ChatRoom, ConversationMessage, Question, OnlineTestSubmission, OfflineMark, FeeStructure, PaymentRecord, AttendanceRecord } from "../types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  role: UserRole.STUDENT,
  email: 'alex.j@skillu.edu',
  avatar: 'https://picsum.photos/seed/alex/100/100',
  enrolledBatchIds: ['b1', 'b2'],
  mobile: '+1 234 567 8900',
  qualification: 'High School',
  place: 'New York',
  dob: '2005-06-15',
  address: '123 Learning Lane, Knowledge City, NY 10001',
  profileLocked: false, // User can edit first time
  status: 'ACTIVE',
  joinDate: Date.now() - ONE_MONTH_MS * 3,
  feeStructureId: 'fs1'
};

export const MOCK_USERS_LIST: User[] = [
  { 
    id: 'u1', 
    name: 'Alex Johnson', 
    role: UserRole.STUDENT, 
    email: 'alex.j@skillu.edu', 
    avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random',
    enrolledBatchIds: ['b1', 'b2'],
    mobile: '9876543210',
    qualification: 'Grade 12',
    place: 'San Francisco',
    dob: '2006-03-12',
    address: '42 Silicon Valley Blvd, CA',
    profileLocked: false,
    status: 'ACTIVE',
    joinDate: Date.now() - ONE_MONTH_MS * 4,
    feeStructureId: 'fs1'
  },
  { 
    id: 'u2', 
    name: 'Sarah Connor', 
    role: UserRole.TEACHER, 
    email: 's.connor@skillu.edu', 
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=random',
    mobile: '5551234567',
    profileLocked: true,
    status: 'ACTIVE',
    joinDate: Date.now() - ONE_MONTH_MS * 12
  },
  { 
    id: 'u3', 
    name: 'Michael Smith', 
    role: UserRole.STUDENT, 
    email: 'm.smith@skillu.edu', 
    avatar: 'https://ui-avatars.com/api/?name=Michael+Smith&background=random',
    enrolledBatchIds: ['b1'],
    profileLocked: true, // Already edited
    status: 'ACTIVE',
    joinDate: Date.now() - ONE_DAY_MS * 15, // New User
    feeStructureId: 'fs2'
  },
  { 
    id: 'u4', 
    name: 'Emily Blunt', 
    role: UserRole.TEACHER, 
    email: 'e.blunt@skillu.edu', 
    avatar: 'https://ui-avatars.com/api/?name=Emily+Blunt&background=random',
    status: 'ACTIVE',
    joinDate: Date.now() - ONE_MONTH_MS * 6
  },
  { 
    id: 'u5', 
    name: 'John Doe', 
    role: UserRole.STUDENT, 
    email: 'j.doe@skillu.edu', 
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
    enrolledBatchIds: [],
    status: 'DISCONTINUED',
    joinDate: Date.now() - ONE_MONTH_MS * 8
  },
  {
    id: 'u6',
    name: 'Jane Foster',
    role: UserRole.STUDENT,
    email: 'j.foster@skillu.edu',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Foster&background=random',
    enrolledBatchIds: [],
    status: 'ALUMNI',
    joinDate: Date.now() - ONE_MONTH_MS * 24
  },
  {
    id: 'admin',
    name: 'Admin User',
    role: UserRole.ADMIN,
    email: 'admin@skillu.edu',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=000&color=fff',
    status: 'ACTIVE',
    joinDate: Date.now() - ONE_MONTH_MS * 36
  }
];

export const MOCK_BATCHES: Batch[] = [
  { 
    id: 'b1', 
    name: 'Morning Star', 
    course: 'Advanced Mathematics', 
    teacher: 'Sarah Connor', 
    teacherId: 'u2', 
    schedule: 'Mon, Wed 09:00 AM', 
    startDate: '2023-09-01',
    endDate: '2024-03-01',
    durationMonths: 6,
    studentsCount: 24 
  },
  { 
    id: 'b2', 
    name: 'Evening Scholars', 
    course: 'Physics 101', 
    teacher: 'Emily Blunt', 
    teacherId: 'u4', 
    schedule: 'Tue, Thu 04:00 PM', 
    startDate: '2023-10-01',
    endDate: '2024-02-01',
    durationMonths: 4,
    studentsCount: 18 
  },
  { 
    id: 'b3', 
    name: 'Weekend Warriors', 
    course: 'Computer Science', 
    teacher: 'Alan Turing', 
    teacherId: 'u99', 
    schedule: 'Sat 10:00 AM', 
    startDate: '2023-11-01',
    endDate: '2024-05-01',
    durationMonths: 6,
    studentsCount: 30 
  },
];

// Helper to get time relative to now for realistic demo simulation
const getTimeFromNow = (minutes: number) => {
  const date = new Date(Date.now() + minutes * 60000);
  return {
    timeString: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: date.getTime()
  };
};

// Generate classes scheduled relative to current time
const nextClass = getTimeFromNow(5); // Starts in 5 minutes
const laterClass = getTimeFromNow(120); // Starts in 2 hours
const eveningClass = getTimeFromNow(240); // Starts in 4 hours

export const UPCOMING_CLASSES: ClassSession[] = [
  { 
    id: 'c1', 
    title: 'Advanced Biology: Photosynthesis', 
    subject: 'Biology', 
    startTime: nextClass.timeString, 
    status: 'UPCOMING',
    timestamp: nextClass.timestamp,
    batchId: 'b1',
    url: 'https://meet.google.com/zyx-wvut-srq'
  },
  { 
    id: 'c2', 
    title: 'Calculus II: Integrals', 
    subject: 'Math', 
    startTime: laterClass.timeString, 
    status: 'UPCOMING',
    timestamp: laterClass.timestamp,
    batchId: 'b1'
  },
  { 
    id: 'c3', 
    title: 'Modern History: Cold War', 
    subject: 'History', 
    startTime: eveningClass.timeString, 
    status: 'UPCOMING',
    timestamp: eveningClass.timestamp,
    batchId: 'b2',
    url: 'https://meet.google.com/pqr-stuv-wxy'
  },
];

export const TEACHER_CLASSES: ClassSession[] = [
  { 
    id: 'c1', 
    title: 'Advanced Biology: Photosynthesis', 
    subject: 'Biology', 
    startTime: nextClass.timeString, 
    status: 'UPCOMING',
    timestamp: nextClass.timestamp,
    batchId: 'b1',
    url: 'https://meet.google.com/zyx-wvut-srq'
  },
  { 
    id: 'c4', 
    title: 'Biology 101: Cell Structure', 
    subject: 'Biology', 
    startTime: '11:00 AM', 
    status: 'COMPLETED',
    batchId: 'b1' 
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    title: 'Photosynthesis Diagram',
    subject: 'Biology',
    description: 'Draw and label the process of photosynthesis including the Calvin cycle.',
    assignedDate: Date.now() - ONE_DAY_MS,
    dueDate: Date.now() + ONE_DAY_MS * 2,
    teacherId: 'u2',
    batchId: 'b1'
  },
  {
    id: 'a2',
    title: 'Calculus Problem Set 3',
    subject: 'Math',
    description: 'Complete problems 1-15 from Chapter 4. Submit a PDF.',
    assignedDate: Date.now() - ONE_DAY_MS * 3,
    dueDate: Date.now() - ONE_DAY_MS, // Overdue
    teacherId: 'u2',
    batchId: 'b1'
  }
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 's1',
    assignmentId: 'a2',
    studentId: 'u1',
    studentName: 'Alex Johnson',
    submittedAt: Date.now() - ONE_DAY_MS * 1.5,
    fileUrl: 'calculus_hw.pdf',
    fileType: 'DOCUMENT',
    status: 'PENDING'
  },
  {
    id: 's2',
    assignmentId: 'a1',
    studentId: 'u3',
    studentName: 'Michael Smith',
    submittedAt: Date.now() - (ONE_DAY_MS / 2),
    fileUrl: 'diagram.png',
    fileType: 'IMAGE',
    status: 'PENDING'
  }
];

export const MOCK_MATERIALS: StudyMaterial[] = [
  { id: 'm1', title: 'Chapter 4: Integration Rules', type: 'PDF', url: 'calculus_ch4.pdf', uploadDate: Date.now() - ONE_DAY_MS * 5, batchId: 'b1' },
  { id: 'm2', title: 'Calculus Cheat Sheet', type: 'PDF', url: 'formulas.pdf', uploadDate: Date.now() - ONE_DAY_MS * 10, batchId: 'b1' },
  { id: 'm3', title: 'Khan Academy: Derivatives', type: 'LINK', url: 'https://khanacademy.org...', uploadDate: Date.now() - ONE_DAY_MS * 15, batchId: 'b1' },
];

const MOCK_QUESTIONS: Question[] = [
  { id: 'q1', text: 'What is the powerhouse of the cell?', type: 'MCQ', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], correctAnswer: 'Mitochondria', marks: 5 },
  { id: 'q2', text: 'Is the sky blue due to light scattering?', type: 'YES_NO', correctAnswer: 'Yes', marks: 2 },
  { id: 'q3', text: 'The capital of France is ____.', type: 'FILL_IN_BLANKS', correctAnswer: 'Paris', marks: 3 },
];

export const MOCK_TESTS: Test[] = [
  { id: 't1', title: 'Mid-Term Examination (Offline)', date: Date.now() - ONE_DAY_MS * 10, durationMinutes: 90, totalMarks: 100, batchId: 'b1', type: 'OFFLINE' },
  { id: 't2', title: 'Weekly Quiz: Biology', date: Date.now() - ONE_DAY_MS * 2, durationMinutes: 30, totalMarks: 10, batchId: 'b1', type: 'ONLINE', questions: MOCK_QUESTIONS },
  { id: 't3', title: 'Upcoming Physics Test', date: Date.now() + ONE_DAY_MS * 7, durationMinutes: 45, totalMarks: 50, batchId: 'b2', type: 'ONLINE', questions: [] },
];

export const MOCK_ONLINE_SUBMISSIONS: OnlineTestSubmission[] = [
    { id: 'ots1', testId: 't2', studentId: 'u1', submittedAt: Date.now() - ONE_DAY_MS * 1.5, score: 8, answers: [
        { questionId: 'q1', answer: 'Mitochondria' },
        { questionId: 'q2', answer: 'Yes' },
        { questionId: 'q3', answer: 'Paris' },
    ]},
    { id: 'ots2', testId: 't2', studentId: 'u3', submittedAt: Date.now() - ONE_DAY_MS * 1.5, score: 5, answers: [
        { questionId: 'q1', answer: 'Mitochondria' },
        { questionId: 'q2', answer: 'No' }, // Incorrect
        { questionId: 'q3', answer: 'Lyon' }, // Incorrect
    ]}
];

export const MOCK_OFFLINE_MARKS: OfflineMark[] = [
    { id: 'om1', testId: 't1', studentId: 'u1', marks: 85, feedback: 'Good work on the long-form answers.'},
    { id: 'om2', testId: 't1', studentId: 'u3', marks: 72, feedback: 'Need to improve on derivations.'},
];

export const MOCK_VIDEOS: VideoClass[] = [
  { 
    id: 'v1', 
    title: 'Lecture 1: Introduction to Limits', 
    date: Date.now() - ONE_DAY_MS * 20, 
    duration: '45:00', 
    url: 'https://youtube.com/watch?v=example1', 
    batchId: 'b1', 
    status: 'RECORDED',
    summary: 'This lecture introduces the fundamental concept of limits in calculus, explaining how they define the behavior of functions as input values approach a certain point. Key topics included one-sided limits and limit properties.'
  },
  { 
    id: 'v2', 
    title: 'Lecture 2: Continuity', 
    date: Date.now() - ONE_DAY_MS * 18, 
    duration: '50:00', 
    url: 'https://youtube.com/watch?v=example2', 
    batchId: 'b1', 
    status: 'RECORDED',
    summary: 'Building on limits, this class covered the definition of continuity, identifying continuous and discontinuous functions, and practical applications in real-world scenarios. Examples of removable and jump discontinuities were explored.'
  },
  { 
    id: 'v3', 
    title: 'Live Doubt Clearing Session', 
    date: Date.now() + ONE_DAY_MS, 
    duration: '60:00', 
    url: 'https://meet.google.com/ghi-jklm-nop', 
    batchId: 'b1', 
    status: 'UPCOMING' 
  },
  {
    id: 'v4', 
    title: 'Physics: Kinematics Basics', 
    date: Date.now() - ONE_DAY_MS * 7, 
    duration: '01:10', 
    url: 'https://youtube.com/watch?v=example4', 
    batchId: 'b2', 
    status: 'RECORDED' // No summary initially, to demonstrate generation
  },
  {
    id: 'v5',
    title: 'Advanced Python: Decorators',
    date: Date.now() - ONE_DAY_MS * 3,
    duration: '00:55',
    url: 'https://youtube.com/watch?v=example5',
    batchId: 'b3',
    status: 'RECORDED',
    summary: 'This session provided an in-depth look into Python decorators, covering their syntax, usage, and how they can extend function behavior without modification. Examples of practical decorator implementations were demonstrated.'
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann1',
    title: 'Institute Closed for Holiday',
    content: 'The institute will remain closed on Friday due to public holiday.',
    senderId: 'admin',
    senderName: 'Admin Office',
    createdAt: Date.now() - ONE_DAY_MS * 2,
    targetType: 'ALL_USERS'
  },
  {
    id: 'ann2',
    title: 'Exam Schedule Released',
    content: 'The final exam schedule for Batch Morning Star has been uploaded.',
    senderId: 'u2',
    senderName: 'Sarah Connor',
    createdAt: Date.now() - ONE_DAY_MS * 0.5,
    targetType: 'BATCH',
    batchId: 'b1',
    targetIds: ['b1']
  },
  {
    id: 'ann3',
    title: 'Upcoming Parent-Teacher Meeting',
    content: 'Please inform your parents about the meeting next Saturday.',
    senderId: 'admin',
    senderName: 'Admin Office',
    createdAt: Date.now() + ONE_DAY_MS, // Future date (scheduled)
    scheduledFor: Date.now() + ONE_DAY_MS,
    targetType: 'ALL_USERS'
  }
];

export const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'room_b1',
    name: 'Morning Star Batch',
    type: 'BATCH_GROUP',
    batchId: 'b1',
    participants: ['u1', 'u3', 'u2'], // Alex, Michael, Sarah (Teacher)
    status: 'ACTIVE',
    unreadCount: 2,
    lastMessage: 'Check the new schedule please.',
    lastMessageTime: Date.now() - 1000 * 60 * 5
  },
  {
    id: 'room_b2',
    name: 'Evening Scholars',
    type: 'BATCH_GROUP',
    batchId: 'b2',
    participants: ['u1', 'u5', 'u4'], // Alex, John, Emily (Teacher)
    status: 'ACTIVE',
    unreadCount: 0,
    lastMessage: 'Class is delayed by 10 mins.',
    lastMessageTime: Date.now() - 1000 * 60 * 60 * 2
  },
  {
    id: 'room_p1',
    name: 'Doubt: Calculus',
    type: 'PRIVATE',
    participants: ['u1', 'u2'], // Alex (Student), Sarah (Teacher)
    status: 'PENDING',
    unreadCount: 0,
    recipientId: 'u2',
    recipientName: 'Sarah Connor'
  }
];

export const MOCK_CHAT_MESSAGES: ConversationMessage[] = [
  {
    id: 'msg1',
    roomId: 'room_b1',
    senderId: 'u2',
    senderName: 'Sarah Connor',
    senderRole: UserRole.TEACHER,
    text: 'Hello everyone, please submit your assignments by tomorrow.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    type: 'TEXT'
  },
  {
    id: 'msg2',
    roomId: 'room_b1',
    senderId: 'u1',
    senderName: 'Alex Johnson',
    senderRole: UserRole.STUDENT,
    text: 'Ma\'am, is Chapter 5 included?',
    timestamp: Date.now() - 1000 * 60 * 60 * 23,
    type: 'TEXT'
  },
  {
    id: 'msg3',
    roomId: 'room_b1',
    senderId: 'u3',
    senderName: 'Michael Smith',
    senderRole: UserRole.STUDENT,
    text: 'Check the new schedule please.',
    timestamp: Date.now() - 1000 * 60 * 5,
    type: 'TEXT'
  }
];


// --- NEW MOCK ATTENDANCE DATA ---
// Helper to generate some mock data
const generateMockAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const studentsInB1 = MOCK_USERS_LIST.filter(u => u.enrolledBatchIds?.includes('b1'));

  // Generate data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Assume class happens on Mon, Wed, Fri for b1
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday
    if ([1, 3, 5].includes(dayOfWeek)) { // Monday, Wednesday, Friday
      studentsInB1.forEach(student => {
        // Randomly assign present or absent, with more presents
        const status = Math.random() > 0.15 ? 'PRESENT' : 'ABSENT';
        records.push({
          studentId: student.id,
          batchId: 'b1',
          date: dateString,
          status,
        });
      });
    }
  }
  return records;
};

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = generateMockAttendance();

// --- NEW MOCK PAYMENTS DATA ---

export const MOCK_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'fs1',
    name: 'Standard 6-Month Course Fee',
    totalAmount: 60000,
    installments: [
      { installmentNumber: 1, amount: 20000, dueDate: Date.now() - ONE_MONTH_MS * 2 },
      { installmentNumber: 2, amount: 20000, dueDate: Date.now() - ONE_MONTH_MS * 1 },
      { installmentNumber: 3, amount: 20000, dueDate: Date.now() + ONE_MONTH_MS * 1 },
    ]
  },
  {
    id: 'fs2',
    name: 'Lump Sum Course Fee',
    totalAmount: 55000,
    installments: [
      { installmentNumber: 1, amount: 55000, dueDate: Date.now() - ONE_DAY_MS * 10 }
    ]
  }
];

export const MOCK_PAYMENT_RECORDS: PaymentRecord[] = [
  // Alex Johnson's Payments (u1)
  {
    id: 'p1',
    studentId: 'u1',
    feeStructureId: 'fs1',
    installmentNumber: 1,
    amountPaid: 20000,
    paymentDate: Date.now() - ONE_MONTH_MS * 2 + ONE_DAY_MS,
    method: 'ONLINE'
  },
  {
    id: 'p2',
    studentId: 'u1',
    feeStructureId: 'fs1',
    installmentNumber: 2,
    amountPaid: 20000,
    paymentDate: Date.now() - ONE_MONTH_MS * 1,
    method: 'ONLINE'
  },
  // Michael Smith's Payments (u3) - None yet
];