
import React, { useState, useEffect, useRef } from 'react';
import { Test, UserRole, User, Question, OnlineTestSubmission, OfflineMark, StudentAnswer, ToastNotification, TestStage } from '../../types';
import { MOCK_TESTS, MOCK_USERS_LIST, MOCK_ONLINE_SUBMISSIONS, MOCK_OFFLINE_MARKS } from '../../data/mockData';
import { Plus, GraduationCap, Clock, CheckCircle, X, ListChecks, FileText, ArrowLeft, Send, BarChart, ExternalLink, Award, UserCheck, User as UserIcon, AlertTriangle, Users, BookOpen, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

// NEW: Define TestView type
type TestView = 'list' | 'create_select_mode' | 'create_form' | 'take_test' | 'pre_submit_review' | 'post_submit_results' | 'result_detail_online' | 'result_detail_offline' | 'results_list' | 'mark_offline';

interface TestsViewProps {
  role: UserRole;
  batchId: string;
  currentUserId?: string;
  setActiveToast?: (toast: ToastNotification | null) => void;
}

const TestsView: React.FC<TestsViewProps> = ({ role, batchId, currentUserId, setActiveToast }) => {
  const [tests, setTests] = useState<Test[]>(MOCK_TESTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS_LIST);
  const [onlineSubmissions, setOnlineSubmissions] = useState<OnlineTestSubmission[]>(MOCK_ONLINE_SUBMISSIONS);
  const [offlineMarks, setOfflineMarks] = useState<OfflineMark[]>(MOCK_OFFLINE_MARKS);

  const [testView, setTestView] = useState<TestView>('list'); // Use TestView type
  const [newTestForm, setNewTestForm] = useState<Partial<Test>>({
    title: '',
    date: Date.now(),
    durationMinutes: 60,
    totalMarks: 0,
    batchId: batchId,
    type: 'ONLINE',
    questions: [],
    assignmentTarget: 'ALL',
    assignedStudentIds: [],
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  const [viewingTest, setViewingTest] = useState<Test | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<OnlineTestSubmission | OfflineMark | null>(null);

  // Student Test Taking State
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStage, setTestStage] = useState<TestStage>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null); // Corrected declaration

  const filteredTests = tests.filter(t => t.batchId === batchId).sort((a,b) => b.date - a.date);
  const studentsInBatch = users.filter(u => u.enrolledBatchIds?.includes(batchId));
  const canManage = role === UserRole.ADMIN || role === UserRole.TEACHER;

  useEffect(() => {
    if (testView === 'take_test' && viewingTest && testStage === 'taking') {
        if (timeLeft === 0) { // Only set initial time if it's not already running/set
          setTimeLeft(viewingTest.durationMinutes * 60);
        }
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleStudentTestSubmit(true); // Auto-submit on timer expiry
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  }, [testView, viewingTest, testStage, timeLeft]); // Added timeLeft as dependency

  const resetTestTakingState = () => {
    setStudentAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(0);
    setTestStage('instructions');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const navigateBackToList = () => {
    setTestView('list');
    setViewingTest(null);
    setViewingSubmission(null);
    resetTestTakingState();
  };

  // --- Teacher/Admin Test Management ---
  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestForm.title || !newTestForm.date || !newTestForm.durationMinutes) return;

    const testId = `test_${Date.now()}`;
    const finalTest: Test = {
      ...newTestForm as Test,
      id: testId,
      batchId: batchId,
      date: new Date(newTestForm.date).getTime(),
      questions: newTestForm.type === 'ONLINE' ? newTestForm.questions : undefined,
      numberOfQuestions: newTestForm.type === 'ONLINE' ? newTestForm.questions?.length || 0 : undefined,
      totalMarks: newTestForm.type === 'ONLINE' ? (newTestForm.questions?.reduce((acc, q) => acc + (q.marks || 0), 0) || 0) : newTestForm.totalMarks,
    };

    setTests(prev => [finalTest, ...prev]);
    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Test Created',
      message: `'${finalTest.title}' has been scheduled.`,
      type: 'success'
    });
    setNewTestForm({
      title: '', date: Date.now(), durationMinutes: 60, batchId: batchId,
      type: 'ONLINE', questions: [], assignmentTarget: 'ALL', assignedStudentIds: [], totalMarks: 0,
    });
    setTestView('list');
  };

  const handleAddQuestion = () => {
    const defaultQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
    };
    setCurrentQuestion(defaultQuestion);
    setEditingQuestionIndex(newTestForm.questions?.length || 0);
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion) return;
    setNewTestForm(prev => {
      const questions = prev.questions ? [...prev.questions] : [];
      if (editingQuestionIndex !== null && editingQuestionIndex < questions.length) {
        questions[editingQuestionIndex] = currentQuestion;
      } else {
        questions.push(currentQuestion);
      }
      return { ...prev, questions };
    });
    setCurrentQuestion(null);
    setEditingQuestionIndex(null);
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setCurrentQuestion(newTestForm.questions?.[index] || null);
  };

  const handleDeleteQuestion = (index: number) => {
    setNewTestForm(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index),
    }));
  };

  const handleMarkOfflineTest = (testId: string, studentId: string, marks: number, feedback?: string) => {
    const existingMarkIndex = offlineMarks.findIndex(m => m.testId === testId && m.studentId === studentId);
    if (existingMarkIndex > -1) {
      setOfflineMarks(prev => prev.map((m, i) => i === existingMarkIndex ? { ...m, marks, feedback } : m));
    } else {
      setOfflineMarks(prev => [...prev, { id: `om_${Date.now()}`, testId, studentId, marks, feedback }]);
    }
    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Marks Updated',
      message: `Marks for ${users.find(u => u.id === studentId)?.name} updated.`,
      type: 'success'
    });
  };

  // --- Student Test Taking ---
  const handleStudentAnswerChange = (questionId: string, answer: string) => {
    setStudentAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleStudentTestSubmit = (fromTimerExpiry: boolean = false) => {
    if (!viewingTest || !viewingTest.questions || !currentUserId) return;

    if (!fromTimerExpiry && testStage === 'taking') {
      // If student clicks "Review & Submit" from last question
      setTestStage('pre_submit_review');
      return;
    }

    // Final submission logic (from 'pre_submit_review' or timer expiry)
    let score = 0;
    viewingTest.questions.forEach(q => {
      if (studentAnswers[q.id] === q.correctAnswer) {
        score += q.marks || 0;
      }
    });

    const newSubmission: OnlineTestSubmission = {
      id: `ots_${Date.now()}`,
      testId: viewingTest.id,
      studentId: currentUserId,
      answers: Object.entries(studentAnswers).map(([questionId, answer]) => ({ questionId, answer: answer as string })),
      score: score,
      submittedAt: Date.now(),
    };
    setOnlineSubmissions(prev => [...prev, newSubmission]);
    setTestStage('post_submit_results'); // Transition to final results
    if (timerRef.current) clearInterval(timerRef.current); // Stop timer immediately
    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Test Submitted',
      message: `'${viewingTest.title}' submitted successfully.`,
      type: 'success'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // --- Render Helpers ---
  const renderTestStatus = (test: Test, studentSubmission?: OnlineTestSubmission | OfflineMark) => {
    const now = Date.now();
    if (test.type === 'ONLINE') {
        const hasSubmitted = onlineSubmissions.some(s => s.testId === test.id && s.studentId === currentUserId);
        const testEndTime = test.date + test.durationMinutes * 60 * 1000;

        if (now > testEndTime) { // Test window has completely passed
            return hasSubmitted ? 'Completed' : 'Missed';
        }
        if (now < test.date) { // Test has not started yet
            return 'Upcoming';
        }
        // Test is currently active
        return hasSubmitted ? 'Submitted' : 'Due';
    } else { // Offline test
        const hasMarks = offlineMarks.some(m => m.testId === test.id && m.studentId === currentUserId);
        if (now > test.date) { // Test date has passed
            return hasMarks ? 'Marked' : 'Pending Marking';
        }
        return 'Upcoming'; // Test date is in future
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-700';
      case 'Due': return 'bg-amber-100 text-amber-700';
      case 'Submitted': return 'bg-emerald-100 text-emerald-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Missed': return 'bg-red-100 text-red-700';
      case 'Marked': return 'bg-purple-100 text-purple-700';
      case 'Pending Marking': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderQuestionForm = () => {
    if (!currentQuestion) return null;
    const isMCQ = currentQuestion.type === 'MCQ';

    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="font-bold text-lg text-slate-800">
          {editingQuestionIndex !== null ? `Edit Question ${editingQuestionIndex + 1}` : 'Add New Question'}
        </h4>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Question Text</label>
          <textarea
            value={currentQuestion.text}
            onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Question Type</label>
          <select
            value={currentQuestion.type}
            onChange={e => {
              const newType = e.target.value as Question['type'];
              setCurrentQuestion({
                ...currentQuestion,
                type: newType,
                options: newType === 'MCQ' ? ['', '', '', ''] : undefined,
                correctAnswer: newType === 'YES_NO' ? 'Yes' : '', // Default for Yes/No
              });
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="YES_NO">Yes/No</option>
            <option value="FILL_IN_BLANKS">Fill in the Blanks</option>
          </select>
        </div>
        {isMCQ && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Options</label>
            {currentQuestion.options?.map((option, i) => (
              <input
                key={i}
                type="text"
                value={option}
                onChange={e => {
                  const newOptions = [...(currentQuestion.options || [])];
                  newOptions[i] = e.target.value;
                  setCurrentQuestion({ ...currentQuestion, options: newOptions });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={`Option ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Correct Answer</label>
          {currentQuestion.type === 'YES_NO' ? (
            <select
              value={currentQuestion.correctAnswer}
              onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          ) : (
            <input
              type="text"
              value={currentQuestion.correctAnswer}
              onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={isMCQ ? 'Enter the exact correct option text' : 'Enter the fill-in-the-blank answer'}
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Marks</label>
          <input
            type="number"
            value={currentQuestion.marks}
            onChange={e => setCurrentQuestion({ ...currentQuestion, marks: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => { setCurrentQuestion(null); setEditingQuestionIndex(null); }}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveQuestion}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Save Question
          </button>
        </div>
      </div>
    );
  };

  // --- Render Main Views ---
  const renderList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={22} className="text-purple-600"/> Tests
        </h2>
        {canManage && (
          <button
            onClick={() => setTestView('create_select_mode')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} /> Create Test
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTests.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTests.map(test => {
              const status = renderTestStatus(test, onlineSubmissions.find(s => s.testId === test.id && s.studentId === currentUserId) || offlineMarks.find(m => m.testId === test.id && m.studentId === currentUserId));
              const statusColor = getStatusColor(status);
              const hasSubmitted = onlineSubmissions.some(s => s.testId === test.id && s.studentId === currentUserId);
              const hasMarks = offlineMarks.some(m => m.testId === test.id && m.studentId === currentUserId);

              return (
                <div key={test.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                      {test.type === 'ONLINE' ? <FileText size={20} /> : <ListChecks size={20} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{test.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {test.type} Test • {new Date(test.date).toLocaleDateString()} • {test.durationMinutes} mins
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                      {status}
                    </span>
                    {role === UserRole.STUDENT && test.type === 'ONLINE' && status === 'Due' && !hasSubmitted && (
                      <button
                        onClick={() => { setViewingTest(test); setTestView('take_test'); resetTestTakingState(); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Take Test
                      </button>
                    )}
                    {role === UserRole.STUDENT && test.type === 'ONLINE' && (status === 'Submitted' || status === 'Completed') && (
                      <button
                        onClick={() => { setViewingTest(test); setTestView('result_detail_online'); }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        View Result
                      </button>
                    )}
                     {role === UserRole.STUDENT && test.type === 'OFFLINE' && hasMarks && (
                      <button
                        onClick={() => { setViewingTest(test); setTestView('result_detail_offline'); }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        View Marks
                      </button>
                    )}
                    {canManage && test.type === 'ONLINE' && (status === 'Submitted' || status === 'Completed' || status === 'Missed') && (
                      <button
                        onClick={() => { setViewingTest(test); setTestView('results_list'); }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        View Submissions
                      </button>
                    )}
                    {canManage && test.type === 'OFFLINE' && status !== 'Upcoming' && (
                        <button
                            onClick={() => { setViewingTest(test); setTestView('mark_offline'); }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                            Mark Test
                        </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <GraduationCap size={32} className="mx-auto mb-2 opacity-50" />
            No tests scheduled for this batch yet.
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateSelectMode = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Choose Test Type</h3>
          <button onClick={navigateBackToList} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => { setNewTestForm(prev => ({ ...prev, type: 'ONLINE', questions: [], totalMarks: 0 })); setTestView('create_form'); }}
            className="w-full flex items-center gap-4 p-4 border border-blue-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="p-3 bg-white rounded-lg text-blue-600 shadow-sm"><FileText size={24} /></div>
            <div>
              <h4 className="font-bold text-slate-800">Online Test</h4>
              <p className="text-sm text-slate-500">Create questions, auto-evaluate submissions.</p>
            </div>
          </button>
          <button
            onClick={() => { setNewTestForm(prev => ({ ...prev, type: 'OFFLINE', questions: undefined })); setTestView('create_form'); }}
            className="w-full flex items-center gap-4 p-4 border border-purple-200 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <div className="p-3 bg-white rounded-lg text-purple-600 shadow-sm"><ListChecks size={24} /></div>
            <div>
              <h4 className="font-bold text-slate-800">Offline Test</h4>
              <p className="text-sm text-slate-500">Manual marking, track results in app.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderCreateForm = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            Create {newTestForm.type === 'ONLINE' ? 'Online' : 'Offline'} Test
          </h3>
          <button onClick={navigateBackToList} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleCreateTest} className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Test Title</label>
            <input
              type="text"
              required
              value={newTestForm.title || ''}
              onChange={e => setNewTestForm({ ...newTestForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Chapter 5 Quiz"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={newTestForm.date ? new Date(newTestForm.date).toISOString().split('T')[0] : ''}
                onChange={e => setNewTestForm({ ...newTestForm, date: new Date(e.target.value).getTime() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                required
                value={newTestForm.durationMinutes || ''}
                onChange={e => setNewTestForm({ ...newTestForm, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          {newTestForm.type === 'OFFLINE' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                required
                value={newTestForm.totalMarks || ''}
                onChange={e => setNewTestForm({ ...newTestForm, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {newTestForm.type === 'ONLINE' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700">Questions ({newTestForm.questions?.length || 0})</h4>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-200"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>

              {newTestForm.questions?.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No questions added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {newTestForm.questions?.map((q, i) => (
                    <div key={q.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-800 line-clamp-1">Q{i + 1}: {q.text}</p>
                        <p className="text-xs text-slate-500 mt-1">{q.type} • {q.marks} marks</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(i)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(i)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentQuestion && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                {renderQuestionForm()}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create Test
          </button>
        </form>
      </div>
    </div>
  );

  const renderTakeTest = () => {
    if (!viewingTest || !viewingTest.questions) return null;

    const currentQ = viewingTest.questions[currentQuestionIndex];
    const totalQuestions = viewingTest.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const renderQuestionInput = (question: Question) => {
      switch (question.type) {
        case 'MCQ':
          return (
            <div className="space-y-3" role="radiogroup" aria-labelledby={`question-${question.id}-label`}>
              {question.options?.map((option, i) => (
                <label key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={option}
                    checked={studentAnswers[question.id] === option}
                    onChange={() => handleStudentAnswerChange(question.id, option)}
                    className="form-radio text-blue-600 focus:ring-blue-500"
                    aria-label={`Option ${i+1}: ${option}`}
                  />
                  <span className="text-sm text-slate-800">{option}</span>
                </label>
              ))}
            </div>
          );
        case 'YES_NO':
          return (
            <div className="flex gap-4" role="radiogroup" aria-labelledby={`question-${question.id}-label`}>
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value="Yes"
                  checked={studentAnswers[question.id] === 'Yes'}
                  onChange={() => handleStudentAnswerChange(question.id, 'Yes')}
                  className="form-radio text-blue-600 focus:ring-blue-500"
                  aria-label="Answer Yes"
                />
                <span className="text-sm text-slate-800">Yes</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors flex-1">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value="No"
                  checked={studentAnswers[question.id] === 'No'}
                  onChange={() => handleStudentAnswerChange(question.id, 'No')}
                  className="form-radio text-blue-600 focus:ring-blue-500"
                  aria-label="Answer No"
                />
                <span className="text-sm text-slate-800">No</span>
              </label>
            </div>
          );
        case 'FILL_IN_BLANKS':
          return (
            <input
              type="text"
              value={studentAnswers[question.id] || ''}
              onChange={e => handleStudentAnswerChange(question.id, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Type your answer here..."
              aria-label={`Answer for question ${currentQuestionIndex + 1}`}
            />
          );
        default: return null;
      }
    };

    if (testStage === 'instructions') {
      return (
        <div className="fixed inset-0 bg-slate-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-2xl mx-auto text-center space-y-6">
            <h3 className="text-2xl font-bold text-slate-800">{viewingTest.title}</h3>
            <p className="text-slate-600">Please read the instructions carefully before starting the test.</p>
            <ul className="list-disc list-inside text-left space-y-2 text-sm text-slate-700 bg-slate-50 p-6 rounded-lg border border-slate-100" role="list">
              <li role="listitem">Duration: {viewingTest.durationMinutes} minutes</li>
              <li role="listitem">Total Questions: {totalQuestions}</li>
              <li role="listitem">Each question carries its specified marks.</li>
              <li role="listitem">Once submitted, you cannot reattempt the test.</li>
              <li role="listitem">Your answers will be saved automatically upon time expiry.</li>
            </ul>
            <button
              onClick={() => setTestStage('taking')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
              aria-label="Start Test"
            >
              Start Test
            </button>
          </div>
        </div>
      );
    }

    if (testStage === 'taking') {
      return (
        <div className="fixed inset-0 bg-slate-50 z-40 flex items-center justify-center p-4"> {/* Full screen overlay for taking test */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 flex flex-col w-full max-w-4xl h-[90vh]">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                    <button onClick={navigateBackToList} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Exit Test">
                        <X size={20} />
                    </button>
                    <h3 className="font-bold text-slate-800 text-xl flex-1 text-center">{viewingTest.title}</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold text-sm shadow-sm" aria-label={`Time left: ${formatTime(timeLeft)}`}>
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-4">
                    {/* Question Palette (Left Sidebar for larger screens, hidden on small screens) */}
                    <div className="hidden lg:block w-40 flex-shrink-0 bg-slate-50 p-3 rounded-lg border border-slate-100 overflow-y-auto">
                        <h4 className="font-semibold text-slate-700 text-sm mb-3">Questions</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {viewingTest.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                        ${idx === currentQuestionIndex ? 'bg-blue-600 text-white shadow-md' :
                                        studentAnswers[q.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                    aria-label={`Question ${idx + 1}: ${studentAnswers[q.id] ? 'Answered' : 'Unanswered'}`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Question Area */}
                    <div className="flex-1 space-y-6">
                        <div className="text-sm font-semibold text-slate-700">
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                            <div className="w-full bg-slate-100 rounded-full h-2 mt-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p id={`question-${currentQ.id}-label`} className="font-bold text-lg text-slate-800 mb-4">{currentQ.text} <span className="text-sm text-slate-500 font-normal">({currentQ.marks} Marks)</span></p>
                            {renderQuestionInput(currentQ)}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                        aria-label="Previous Question"
                    >
                        <ChevronLeft size={16} className="inline-block mr-1"/> Previous
                    </button>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                            aria-label="Next Question"
                        >
                            Next <ChevronRight size={16} className="inline-block ml-1"/>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStudentTestSubmit(false)} // Pass false as it's not from timer expiry
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                            aria-label="Review and Submit Test"
                        >
                            Review & Submit
                        </button>
                    )}
                </div>
            </div>
        </div>
      );
    }

    if (testStage === 'post_submit_results') { // Renamed from 'review'
      const studentSubmission = onlineSubmissions.find(s => s.testId === viewingTest.id && s.studentId === currentUserId);
      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-2xl mx-auto text-center space-y-6">
          <CheckCircle size={64} className="text-emerald-500 mx-auto" aria-hidden="true" />
          <h3 className="text-2xl font-bold text-slate-800">Test Submitted!</h3>
          <p className="text-slate-600">Your responses for '{viewingTest.title}' have been recorded.</p>
          {studentSubmission && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-bold text-lg" aria-live="polite">
              Your Score: {studentSubmission.score} / {viewingTest.totalMarks}
            </div>
          )}
          <button
            onClick={() => { setViewingTest(viewingTest); setTestView('result_detail_online'); }}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors shadow-lg"
            aria-label="View Detailed Result"
          >
            View Detailed Result
          </button>
          <button
            onClick={navigateBackToList}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold text-lg hover:bg-slate-200 transition-colors mt-2"
            aria-label="Back to Tests"
          >
            Back to Tests
          </button>
        </div>
      );
    }
    return null;
  };

  // NEW: Extracted renderPreSubmitReview function
  const renderPreSubmitReview = () => {
    if (!viewingTest || !viewingTest.questions) return null; // Safety check

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-xl flex-1 text-center">Review Your Answers</h3>
            <button onClick={() => setTestStage('taking')} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Test">
              Back to Test
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <p className="text-sm text-slate-600 text-center mb-4">Please review your answers before final submission. You can click "Edit Answer" to go back to a question.</p>
            
            {viewingTest.questions.map((q, i) => {
              const studentAnswer = studentAnswers[q.id];
              const isAnswered = !!studentAnswer;
              return (
                <div key={q.id} className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isAnswered ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`} aria-label={`Question ${i+1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 line-clamp-2">Q{i + 1}: {q.text}</p>
                    <p className={`text-xs mt-1 ${isAnswered ? 'text-emerald-700' : 'text-red-700'}`}>
                      Status: <span className="font-semibold">{isAnswered ? 'Answered' : 'Unanswered'}</span>
                    </p>
                    {isAnswered && <p className="text-xs text-slate-600 mt-0.5">Your selection: <span className="font-semibold">{studentAnswer}</span></p>}
                  </div>
                  <button
                    onClick={() => { setCurrentQuestionIndex(i); setTestStage('taking'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors flex-shrink-0"
                    aria-label={`Edit Answer for Question ${i+1}`}
                  >
                    <Pencil size={14} /> Edit Answer
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => handleStudentTestSubmit(false)} // Final confirmation of submission
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
              aria-label="Confirm and Submit Test"
            >
              Confirm & Submit Test
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderResultDetailOnline = () => {
    if (!viewingTest || !viewingTest.questions || !currentUserId) return null;

    const studentSubmission = onlineSubmissions.find(s => s.testId === viewingTest.id && s.studentId === currentUserId);
    if (!studentSubmission) return (
        <div className="p-12 text-center text-slate-400">
            <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" aria-hidden="true"/>
            <p>No submission found for this test.</p>
            <button onClick={navigateBackToList} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Tests">Back to Tests</button>
        </div>
    );

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <button onClick={navigateBackToList} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Back to Test List">
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-bold text-slate-800 text-xl flex-1 text-center">{viewingTest.title} - Result</h3>
          <span className="text-slate-500" aria-label={`Score: ${studentSubmission.score} out of ${viewingTest.totalMarks}`}>
            <Award size={20} className="inline-block mr-2 text-amber-500" aria-hidden="true"/>
            Score: {studentSubmission.score} / {viewingTest.totalMarks}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {viewingTest.questions.map((q, i) => {
            const studentAnswer = studentSubmission.answers.find(ans => ans.questionId === q.id)?.answer || '';
            const isCorrect = studentAnswer === q.correctAnswer;
            const cardBgClass = isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
            const textColorClass = isCorrect ? 'text-emerald-800' : 'text-red-800';

            return (
              <div key={q.id} className={`p-4 rounded-lg border ${cardBgClass}`} role="article">
                <p className="font-bold text-lg text-slate-800 mb-2">Q{i + 1}: {q.text}</p>
                <div className="text-sm space-y-2">
                  <p className="text-slate-700">Your Answer: <span className={`font-semibold ${textColorClass}`}>{studentAnswer || '[No Answer]'}</span></p>
                  <p className="text-slate-700">Correct Answer: <span className="font-semibold text-emerald-800">{q.correctAnswer}</span></p>
                  <p className="text-slate-700">Marks: <span className="font-semibold">{isCorrect ? q.marks : 0} / {q.marks}</span></p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-4 border-t border-slate-100 text-center">
            <button onClick={navigateBackToList} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Tests">
                Back to Tests
            </button>
        </div>
      </div>
    );
  };
  
  const renderResultDetailOffline = () => {
    if (!viewingTest || !currentUserId) return null;

    const studentMarks = offlineMarks.find(m => m.testId === viewingTest.id && m.studentId === currentUserId);
    if (!studentMarks) return (
        <div className="p-12 text-center text-slate-400">
            <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" aria-hidden="true"/>
            <p>Marks not yet recorded for this test.</p>
            <button onClick={navigateBackToList} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Tests">Back to Tests</button>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
                <button onClick={navigateBackToList} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Back to Test List">
                    <ArrowLeft size={20} />
                </button>
                <h3 className="font-bold text-slate-800 text-xl flex-1 text-center">{viewingTest.title} - Marks</h3>
                <span className="text-slate-500" aria-label={`Score: ${studentMarks.marks} out of ${viewingTest.totalMarks}`}>
                    <Award size={20} className="inline-block mr-2 text-amber-500" aria-hidden="true"/>
                    Score: {studentMarks.marks} / {viewingTest.totalMarks}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg" role="alert">
                    <p className="text-sm text-slate-700">Your total marks for this test:</p>
                    <p className="font-bold text-3xl text-blue-800 mt-1">{studentMarks.marks} <span className="text-xl text-blue-600">/ {viewingTest.totalMarks}</span></p>
                </div>
                {studentMarks.feedback && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg" role="note">
                        <h4 className="font-bold text-slate-700 mb-2">Teacher Feedback:</h4>
                        <p className="text-sm text-slate-600">{studentMarks.feedback}</p>
                    </div>
                )}
            </div>
            <div className="pt-4 border-t border-slate-100 text-center">
                <button onClick={navigateBackToList} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Tests">
                    Back to Tests
                </button>
            </div>
        </div>
    );
  };

  const renderResultsList = () => {
    if (!viewingTest) return null;

    const testSubmissions = onlineSubmissions.filter(s => s.testId === viewingTest.id);

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <button onClick={navigateBackToList} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Back to Test List">
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-bold text-slate-800 text-xl flex-1 text-center">{viewingTest.title} - Submissions</h3>
          <span className="text-slate-500" aria-label={`${testSubmissions.length} submissions`}>
            <UserCheck size={20} className="inline-block mr-2 text-emerald-500" aria-hidden="true"/>
            {testSubmissions.length} Submitted
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {testSubmissions.length > 0 ? testSubmissions.map(submission => {
            const student = users.find(u => u.id === submission.studentId);
            return (
              <div key={submission.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between" role="listitem">
                <div className="flex items-center gap-3">
                  <img src={student?.avatar} alt={student?.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-slate-800">{student?.name}</p>
                    <p className="text-xs text-slate-500">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-blue-800">{submission.score} / {viewingTest.totalMarks}</span>
                  <button
                    onClick={() => {
                        setViewingTest(viewingTest); // Keep current test
                        setViewingSubmission(submission);
                        setTestView('result_detail_online'); // Reuse online detail for now
                    }}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-200"
                    aria-label={`View details for ${student?.name}'s submission`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" aria-hidden="true"/>
                No submissions yet for this test.
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-slate-100 text-center">
            <button onClick={navigateBackToList} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Tests">
                Back to Tests
            </button>
        </div>
      </div>
    );
  };
  
  const renderMarkOffline = () => {
    if (!viewingTest) return null;

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <button onClick={navigateBackToList} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full" aria-label="Back to Test List">
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-bold text-slate-800 text-xl flex-1 text-center">Mark '{viewingTest.title}'</h3>
          <span className="text-slate-500">Total Marks: {viewingTest.totalMarks}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {studentsInBatch.length > 0 ? studentsInBatch.map(student => {
                const existingMark = offlineMarks.find(m => m.testId === viewingTest.id && m.studentId === student.id);
                const [marksInput, setMarksInput] = useState<number | string>(existingMark?.marks || '');
                const [feedbackInput, setFeedbackInput] = useState<string>(existingMark?.feedback || '');

                return (
                    <div key={student.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4" role="listitem">
                        <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                            <p className="font-semibold text-slate-800">{student.name}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input
                                type="number"
                                value={marksInput}
                                onChange={e => setMarksInput(Number(e.target.value))}
                                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right"
                                placeholder="Marks"
                                max={viewingTest.totalMarks}
                                min={0}
                                aria-label={`Marks for ${student.name}`}
                            />
                            <span className="text-slate-500">/ {viewingTest.totalMarks}</span>
                            <button
                                onClick={() => handleMarkOfflineTest(viewingTest.id, student.id, Number(marksInput), feedbackInput)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                                aria-label={`Save marks for ${student.name}`}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                );
            }) : (
                <div className="p-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-50" aria-hidden="true"/>
                    No students enrolled in this batch.
                </div>
            )}
        </div>
        <div className="pt-4 border-t border-slate-100 text-center">
            <button onClick={navigateBackToList} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors" aria-label="Back to Tests">
                Back to Tests
            </button>
        </div>
      </div>
    );
  };


  switch (testView) {
    case 'list': return renderList();
    case 'create_select_mode': return renderCreateSelectMode();
    case 'create_form': return renderCreateForm();
    case 'take_test': return renderTakeTest();
    case 'pre_submit_review': return renderPreSubmitReview(); // Call the new function
    case 'post_submit_results': return renderTakeTest(); // Renders the results screen
    case 'result_detail_online': return renderResultDetailOnline();
    case 'result_detail_offline': return renderResultDetailOffline();
    case 'results_list': return renderResultsList();
    case 'mark_offline': return renderMarkOffline();
    default: return renderList();
  }
};

export default TestsView;