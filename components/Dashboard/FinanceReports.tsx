import React, { useState, useMemo } from 'react';
import { User, Batch, FeeStructure, PaymentRecord, AttendanceRecord } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// Ensure all necessary icons are imported
import { Download, Calendar, BarChart2, AlertTriangle, ListChecks, Layers, Users, CheckSquare, TrendingUp, User as UserIcon } from 'lucide-react';

interface FinanceReportsProps {
  users: User[];
  batches: Batch[];
  feeStructures: FeeStructure[];
  paymentRecords: PaymentRecord[];
  attendanceRecords: AttendanceRecord[]; // NEW: Accept attendance records
}

type ReportType = 'DATE_WISE' | 'MONTHLY' | 'UNPAID' | 'UPCOMING' | 'BATCH_WISE' | 'ATTENDANCE';

const REPORT_TABS: { id: ReportType, label: string, icon: React.ReactNode }[] = [
    { id: 'DATE_WISE', label: 'Date-wise Collection', icon: <Calendar size={14} /> },
    { id: 'MONTHLY', label: 'Monthly Collection', icon: <BarChart2 size={14} /> },
    { id: 'UNPAID', label: 'Unpaid Dues', icon: <AlertTriangle size={14} /> },
    { id: 'UPCOMING', label: 'Upcoming Dues', icon: <ListChecks size={14} /> },
    { id: 'BATCH_WISE', label: 'Batch-wise Collection', icon: <Layers size={14} /> },
    { id: 'ATTENDANCE', label: 'Attendance Report', icon: <CheckSquare size={14} /> }, // NEW: Attendance tab
];

export const FinanceReports: React.FC<FinanceReportsProps> = ({ users, batches, feeStructures, paymentRecords, attendanceRecords }) => {
    const [activeReport, setActiveReport] = useState<ReportType>('DATE_WISE');
    
    // Filters
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(thirtyDaysAgo);
    const [endDate, setEndDate] = useState(today);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedAttendanceBatch, setSelectedAttendanceBatch] = useState<string>('ALL'); // For attendance reports

    // Helper to get day of week from date string
    const getDayOfWeek = (dateString: string) => {
        const d = new Date(dateString);
        return d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    };

    // Helper to get class days from batch schedule string
    const getClassDaysForBatch = (schedule: string) => {
        const daysPart = schedule.split(' ')[0];
        const dayMap: { [key: string]: number } = { 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6, 'SUN': 0 };
        return daysPart.split(',').map(d => dayMap[d.trim().toUpperCase()]).filter(d => d !== undefined);
    };

    // --- Data Processing ---
    const reportData = useMemo(() => {
        const getStudentName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown Student';
        
        // Helper function for attendance percentage calculation, reused for both monthly and student-wise
        const calculateAttendancePercentageForStudentAndBatch = (studentId: string, batchId: string, calcStartDate: Date, calcEndDate: Date) => {
            const batch = batches.find(b => b.id === batchId);
            if (!batch) return NaN;
            const classDays = getClassDaysForBatch(batch.schedule);

            let totalPossibleClasses = 0;
            let attendedClasses = 0;

            const currentDateIterator = new Date(calcStartDate);
            while (currentDateIterator.getTime() <= calcEndDate.getTime()) {
                if (classDays.includes(currentDateIterator.getDay())) {
                    totalPossibleClasses++;
                    const dateString = currentDateIterator.toISOString().split('T')[0];
                    const record = attendanceRecords.find(r => r.studentId === studentId && r.batchId === batchId && r.date === dateString);
                    if (record?.status === 'PRESENT') {
                        attendedClasses++;
                    }
                }
                currentDateIterator.setDate(currentDateIterator.getDate() + 1);
            }
            return totalPossibleClasses > 0 ? (attendedClasses / totalPossibleClasses) * 100 : NaN;
        };

        switch(activeReport) {
            case 'DATE_WISE':
                const start = new Date(startDate).getTime();
                const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // include full end day
                return paymentRecords
                    .filter(p => p.paymentDate >= start && p.paymentDate <= end)
                    .map(p => ({ ...p, studentName: getStudentName(p.studentId) }))
                    .sort((a, b) => b.paymentDate - a.paymentDate);

            case 'MONTHLY':
                const monthlyData: { [key: string]: number } = {};
                paymentRecords
                    .filter(p => new Date(p.paymentDate).getFullYear() === selectedYear)
                    .forEach(p => {
                        const month = new Date(p.paymentDate).toLocaleString('default', { month: 'short' });
                        monthlyData[month] = (monthlyData[month] || 0) + p.amountPaid;
                    });
                const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return monthOrder.map(month => ({ name: month, collection: monthlyData[month] || 0 }));
            
            case 'UNPAID':
                return users
                    .filter(u => u.role === 'STUDENT' && u.feeStructureId)
                    .map(student => {
                        const structure = feeStructures.find(fs => fs.id === student.feeStructureId);
                        if (!structure) return null;
                        const paid = paymentRecords.filter(p => p.studentId === student.id).reduce((sum, p) => sum + p.amountPaid, 0);
                        const balance = structure.totalAmount - paid;
                        return balance > 0 ? { studentName: student.name, totalFee: structure.totalAmount, totalPaid: paid, balance } : null;
                    })
                    .filter(Boolean);

            case 'UPCOMING':
                const upcomingDues: any[] = [];
                const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
                users.filter(u => u.role === 'STUDENT' && u.feeStructureId).forEach(student => {
                    const structure = feeStructures.find(fs => fs.id === student.feeStructureId);
                    structure?.installments.forEach(inst => {
                        const isPaid = paymentRecords.some(p => p.studentId === student.id && p.installmentNumber === inst.installmentNumber);
                        if (!isPaid && inst.dueDate > Date.now() && inst.dueDate <= thirtyDaysFromNow) {
                            upcomingDues.push({ studentName: student.name, installment: inst.installmentNumber, amount: inst.amount, dueDate: inst.dueDate });
                        }
                    });
                });
                return upcomingDues.sort((a,b) => a.dueDate - b.dueDate);
            
            case 'BATCH_WISE':
                const batchCollections: { [key: string]: { name: string, collection: number } } = {};
                paymentRecords.forEach(p => {
                    const student = users.find(u => u.id === p.studentId);
                    student?.enrolledBatchIds?.forEach(batchId => {
                        const batch = batches.find(b => b.id === batchId);
                        if (batch) {
                            if (!batchCollections[batchId]) batchCollections[batchId] = { name: batch.name, collection: 0 };
                            batchCollections[batchId].collection += p.amountPaid;
                        }
                    });
                });
                return Object.values(batchCollections);
            
            case 'ATTENDANCE':
                const startAttendance = new Date(startDate);
                startAttendance.setHours(0,0,0,0);
                const endAttendance = new Date(endDate);
                endAttendance.setHours(23,59,59,999);

                const attendanceReport: any[] = [];
                if (selectedAttendanceBatch === 'ALL') {
                    // Overall monthly attendance chart for the selected year
                    const monthlyAttendanceData: { name: string, avgAttendance: number }[] = [];
                    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    monthOrder.forEach((monthName, monthIndex) => {
                        const monthStartDate = new Date(selectedYear, monthIndex, 1);
                        const monthEndDate = new Date(selectedYear, monthIndex + 1, 0); // Last day of the month

                        let totalAttendanceRate = 0;
                        let studentsCounted = 0;

                        users.filter(u => u.role === 'STUDENT').forEach(student => {
                            student.enrolledBatchIds?.forEach(batchId => {
                                const rate = calculateAttendancePercentageForStudentAndBatch(student.id, batchId, monthStartDate, monthEndDate);
                                if (!isNaN(rate)) {
                                    totalAttendanceRate += rate;
                                    studentsCounted++;
                                }
                            });
                        });
                        
                        monthlyAttendanceData.push({
                            name: monthName,
                            avgAttendance: studentsCounted > 0 ? parseFloat((totalAttendanceRate / studentsCounted).toFixed(0)) : 0,
                        });
                    });
                    return monthlyAttendanceData;

                } else {
                    // Specific batch student-wise attendance
                    const studentsInSelectedBatch = users.filter(u => u.enrolledBatchIds?.includes(selectedAttendanceBatch) && u.role === 'STUDENT');
                    studentsInSelectedBatch.forEach(student => {
                        const attendanceRate = calculateAttendancePercentageForStudentAndBatch(student.id, selectedAttendanceBatch, startAttendance, endAttendance);
                        if (!isNaN(attendanceRate)) {
                            attendanceReport.push({
                                studentName: student.name,
                                batchName: batches.find(b => b.id === selectedAttendanceBatch)?.name || 'N/A',
                                attendanceRate: attendanceRate.toFixed(0) + '%'
                            });
                        }
                    });
                }
                return attendanceReport.sort((a,b) => parseFloat(String(b.attendanceRate)) - parseFloat(String(a.attendanceRate)));

            default: return [];
        }
    }, [activeReport, users, batches, feeStructures, paymentRecords, attendanceRecords, startDate, endDate, selectedYear, selectedAttendanceBatch]);

    // --- Export Logic ---
    const handleExport = () => {
        if (reportData.length === 0) return;
        const headers = Object.keys(reportData[0]);
        const csvRows = [
            headers.join(','),
            ...reportData.map((row: any) => 
                headers.map(header => {
                    let val = row[header];
                    if (header.toLowerCase().includes('date') && typeof val === 'number') {
                        val = new Date(val).toLocaleDateString();
                    }
                    if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                    return val;
                }).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeReport.toLowerCase()}_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const renderFilters = () => {
        switch(activeReport) {
            case 'DATE_WISE':
                return (
                    <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded text-sm"/>
                        <span>to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded text-sm"/>
                    </div>
                );
            case 'MONTHLY':
                const currentYear = new Date().getFullYear();
                const years = Array.from({length: 5}, (_, i) => currentYear - i);
                return (
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="p-2 border rounded text-sm bg-white">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                );
            case 'ATTENDANCE':
                return (
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm font-medium text-slate-700">Batch:</label>
                        <select 
                            value={selectedAttendanceBatch}
                            onChange={e => setSelectedAttendanceBatch(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="ALL">All Batches (Monthly Overview)</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        {selectedAttendanceBatch !== 'ALL' && (
                            <>
                                <label className="text-sm font-medium text-slate-700 ml-4">Date Range:</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded text-sm"/>
                                <span>to</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded text-sm"/>
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderReportContent = () => {
        const total = (reportData as any[]).reduce((sum, item) => sum + (item.amountPaid || item.collection || item.balance || item.amount || 0), 0);

        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>{renderFilters()}</div>
                    <button onClick={handleExport} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-200"><Download size={14}/> Export CSV</button>
                </div>

                <div className="p-4">
                    {(activeReport === 'MONTHLY' || (activeReport === 'ATTENDANCE' && selectedAttendanceBatch === 'ALL')) && (
                        <div className="h-80 mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData as any[]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}}/>
                                    <YAxis tick={{fontSize: 12}} tickFormatter={(val) => activeReport === 'MONTHLY' ? `₹${val/1000}k` : `${val}%`}/>
                                    <Tooltip formatter={(val: number) => activeReport === 'MONTHLY' ? `₹${val.toLocaleString()}` : `${val.toFixed(0)}%`}/>
                                    <Bar dataKey={activeReport === 'MONTHLY' ? "collection" : "avgAttendance"} fill={activeReport === 'MONTHLY' ? "#3b82f6" : "#10b981"} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {reportData.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-50">
                            <tr>{Object.keys(reportData[0]).map(h => <th key={h} className="p-2 text-left font-semibold text-slate-600">{h.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(reportData as any[]).map((row, i) => (
                                <tr key={i}>
                                    {Object.entries(row).map(([key, val]: [string, any], j) => (
                                        <td key={j} className="p-2">
                                            {key.toLowerCase().includes('date') && typeof val === 'number' ? new Date(val).toLocaleDateString() : (key.toLowerCase().includes('amount') || key.toLowerCase().includes('fee') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('collection')) && typeof val === 'number' ? `₹${val.toLocaleString()}` : val}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    ) : ( activeReport !== 'MONTHLY' && <div className="p-8 text-center text-slate-400">No data for this report.</div>)}
                </div>
                 {(activeReport !== 'ATTENDANCE') && ( // Hide total for attendance reports
                    <div className="p-4 bg-slate-50 border-t font-bold text-right">
                        Total: ₹{total.toLocaleString()}
                    </div>
                 )}
            </div>
        );
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BarChart2 size={20} className="text-emerald-600"/> Reports Dashboard</h3>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border overflow-x-auto min-w-full">
            {REPORT_TABS.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveReport(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                        activeReport === tab.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-white/50'
                    }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
        {renderReportContent()}
      </div>
    )
};

export default FinanceReports;