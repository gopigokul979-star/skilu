
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface UserDocuments {
  academic?: string;
  aadhar?: string;
  addressProof?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  enrolledBatchIds?: string[];
  // Extended Profile Fields
  mobile?: string;
  qualification?: string;
  place?: string;
  dob?: string;
  address?: string;
  documents?: UserDocuments;
  profileLocked?: boolean;
  status?: 'ACTIVE' | 'ALUMNI' | 'DISCONTINUED';
  joinDate?: number; // timestamp
  feeStructureId?: string; // Link to a fee structure
}

export interface Batch {
  id: string;
  name: string;
  course: string;
  teacher: string;
  teacherId: string;
  schedule: string; // Daily Time Table
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationMonths: number;
  studentsCount: number;
}

export interface ClassSession {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  timestamp?: number;
  batchId?: string;
  url?: string;
}

export interface StudentStats {
  attendance: number;
  assignmentsCompleted: number;
  averageGrade: number;
  riskAssessment?: RiskAnalysis;
}

export interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  recommendations: string[];
}

// AI Chat Message
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Communication Module Types
export interface ConversationMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'FILE';
  attachmentUrl?: string;
  duration?: number; // For audio
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'BATCH_GROUP' | 'PRIVATE';
  batchId?: string; // If it's a batch group
  participants: string[]; // User IDs
  status: 'ACTIVE' | 'PENDING' | 'REJECTED'; // For private chats
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
  // For private chats, to identify the other party easily
  recipientId?: string;
  recipientName?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: number; // timestamp
  assignedDate: number; // timestamp
  teacherId: string;
  batchId: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: number;
  fileUrl: string;
  fileType: 'IMAGE' | 'DOCUMENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'PDF' | 'LINK' | 'VIDEO' | 'DOC' | 'PPT' | 'EXCEL' | 'IMAGE';
  url: string;
  uploadDate: number;
  batchId: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'YES_NO' | 'FILL_IN_BLANKS';
  options?: string[];
  correctAnswer: string;
  marks: number;
}

export interface Test {
  id: string;
  title: string;
  date: number;
  durationMinutes: number;
  totalMarks: number;
  batchId: string;
  type: 'ONLINE' | 'OFFLINE';
  questions?: Question[];
  numberOfQuestions?: number;
  assignmentTarget?: 'ALL' | 'SPECIFIC';
  assignedStudentIds?: string[];
}

export interface StudentAnswer {
    questionId: string;
    answer: string;
}

export interface OnlineTestSubmission {
    id: string;
    testId: string;
    studentId: string;
    answers: StudentAnswer[];
    score: number;
    submittedAt: number;
}

export interface OfflineMark {
    id: string;
    testId: string;
    studentId: string;
    marks: number;
    feedback?: string;
}


export interface VideoClass {
  id: string;
  title: string;
  date: number;
  duration: string;
  url: string;
  batchId: string;
  status: 'UPCOMING' | 'RECORDED' | 'LIVE';
  summary?: string; // NEW: AI-generated summary
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: number;
  scheduledFor?: number; // If set, it's a scheduled announcement
  targetType: 'ALL_USERS' | 'BATCH' | 'SPECIFIC_STUDENTS';
  targetIds?: string[]; // IDs of batches or students depending on type
  batchId?: string; // If created specifically within a batch context
  isRead?: boolean; // For UI state
}

// --- Payments Module Types
export interface Installment {
  installmentNumber: number;
  amount: number;
  dueDate: number; // timestamp
}

export interface FeeStructure {
  id: string;
  name: string;
  totalAmount: number;
  installments: Installment[];
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  feeStructureId: string;
  installmentNumber: number;
  amountPaid: number;
  paymentDate: number; // timestamp
  method: 'ONLINE' | 'CASH' | 'BANK_TRANSFER';
}

// --- NEW Attendance Type ---
export interface AttendanceRecord {
  studentId: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT';
}


// --- Generic UI Types ---
export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}


// Type for Batch Management tabs, shared across components
export type Tab = 'overview' | 'students' | 'attendance' | 'materials' | 'assignments' | 'tests' | 'videos' | 'announcements';

// Renamed 'review' to 'post_submit_results' for clarity
export type TestStage = 'instructions' | 'taking' | 'pre_submit_review' | 'post_submit_results';
