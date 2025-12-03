
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Video, GraduationCap, X, Download, PlayCircle, ExternalLink, RefreshCw, Smartphone, Link as LinkIcon } from 'lucide-react';
import { UserRole, Batch } from '../../types';
import { UPCOMING_CLASSES, MOCK_TESTS, MOCK_BATCHES, MOCK_USERS_LIST, MOCK_VIDEOS } from '../../data/mockData';

interface ScheduleViewProps {
  role: UserRole;
  currentUserId?: string;
  onNavigate?: (view: string) => void;
  onBatchClick?: (batchId: string, targetTab?: string) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  type: 'CLASS' | 'TEST';
  batchId?: string;
  batchName?: string;
  status?: string;
  videoUrl?: string;
}

type ViewMode = 'DAY' | 'WEEK' | 'MONTH';

const ScheduleView: React.FC<ScheduleViewProps> = ({ role, currentUserId, onNavigate, onBatchClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ google: false, outlook: false });
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    subject: '',
    date: '',
    time: '',
    duration: '60',
    type: 'CLASS',
    batchId: ''
  });

  // --- Initialization ---

  useEffect(() => {
    // Merge mock data into a normalized event format
    const loadedEvents: CalendarEvent[] = [];

    // 1. Process Upcoming Classes
    UPCOMING_CLASSES.forEach(cls => {
      let start = new Date();
      if (cls.timestamp) {
        start = new Date(cls.timestamp);
      }
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Assume 1 hr default

      loadedEvents.push({
        id: cls.id,
        title: cls.title,
        subject: cls.subject,
        startTime: start,
        endTime: end,
        type: 'CLASS',
        batchId: 'b1', // Mock assignment
        batchName: 'Morning Star',
        status: cls.status
      });
    });

    // 2. Process Tests
    MOCK_TESTS.forEach(test => {
      const start = new Date(test.date);
      const end = new Date(start.getTime() + test.durationMinutes * 60 * 1000);
      const batch = MOCK_BATCHES.find(b => b.id === test.batchId);

      loadedEvents.push({
        id: test.id,
        title: test.title,
        subject: 'Examination',
        startTime: start,
        endTime: end,
        type: 'TEST',
        batchId: test.batchId,
        batchName: batch?.name || 'Unknown Batch'
      });
    });

    // 3. Process Recorded Videos (Past Classes)
    MOCK_VIDEOS.forEach(video => {
        const start = new Date(video.date);
        // Parse duration "HH:MM" or "MM:SS" or just minutes
        let durationMinutes = 60;
        if(video.duration.includes(':')) {
            const parts = video.duration.split(':');
            durationMinutes = parseInt(parts[0]) + (parseInt(parts[1])/60 || 0); // treating as MM:SS roughly
        }
        
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        const batch = MOCK_BATCHES.find(b => b.id === video.batchId);

        loadedEvents.push({
            id: video.id,
            title: video.title,
            subject: 'Recorded Class',
            startTime: start,
            endTime: end,
            type: 'CLASS',
            batchId: video.batchId,
            batchName: batch?.name || 'Unknown Batch',
            status: 'RECORDED',
            videoUrl: video.url
        });
    });

    // 4. Add some dummy data for the current week to populate the view (Demo purposes)
    const today = new Date();
    const currDay = today.getDay(); // 0-6
    const mondayOffset = currDay === 0 ? -6 : 1 - currDay;
    
    // Add a class for Monday, Wednesday, Friday of current week
    [1, 3, 5].forEach((offsetDay, idx) => {
        const d = new Date(today);
        d.setDate(today.getDate() + mondayOffset + (offsetDay - 1)); // Adjust to Mon, Wed, Fri
        d.setHours(10, 0, 0, 0);
        
        loadedEvents.push({
            id: `dummy-${idx}`,
            title: offsetDay === 1 ? 'Physics Mechanics' : offsetDay === 3 ? 'Chemistry Lab' : 'Math Algebra',
            subject: offsetDay === 1 ? 'Physics' : offsetDay === 3 ? 'Chemistry' : 'Math',
            startTime: new Date(d),
            endTime: new Date(d.getTime() + 60*60*1000),
            type: 'CLASS',
            batchId: 'b1',
            batchName: 'Morning Star'
        });
    });

    // Add a dummy "Recorded" class for Yesterday to demonstrate feature
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    loadedEvents.push({
        id: 'dummy-recorded',
        title: 'History: World War II',
        subject: 'History',
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 60*60*1000),
        type: 'CLASS',
        batchId: 'b2',
        batchName: 'Evening Scholars',
        status: 'RECORDED',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Demo link
    });

    setEvents(loadedEvents);
  }, []);

  // --- Filtering ---

  const getFilteredEvents = () => {
    return events.filter(event => {
      if (role === UserRole.ADMIN) return true;
      
      // Filter by Batch enrollment/assignment
      if (role === UserRole.TEACHER) {
        // Show if teacher teaches this batch
        const batch = MOCK_BATCHES.find(b => b.id === event.batchId);
        return batch?.teacherId === currentUserId;
      }
      
      if (role === UserRole.STUDENT) {
        // Show if student is enrolled in this batch
        const student = MOCK_USERS_LIST.find(u => u.id === currentUserId);
        return student?.enrolledBatchIds?.includes(event.batchId || '');
      }
      
      return false;
    });
  };

  // --- Calendar Logic ---

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Padding days for grid
    const startDay = firstDay.getDay(); // 0 is Sunday, 1 is Monday
    // Adjust for Monday start. If 0 (Sun), we need 6 prev days. If 1 (Mon), 0 prev days.
    const paddingStart = startDay === 0 ? 6 : startDay - 1;
    
    const days: Date[] = [];
    
    // Add prev month padding
    for(let i = paddingStart; i > 0; i--) {
        const d = new Date(year, month, 1 - i);
        days.push(d);
    }
    
    // Add current month days
    for(let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getDisplayedDays = () => {
    if (viewMode === 'DAY') return [currentDate];
    if (viewMode === 'WEEK') {
        const start = getWeekStart(currentDate);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }
    if (viewMode === 'MONTH') {
        return getMonthDays(currentDate);
    }
    return [];
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'DAY') {
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'WEEK') {
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'MONTH') {
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  // --- Dynamic Label Logic ---
  const getNavigationLabel = () => {
    const today = new Date();
    
    if (viewMode === 'DAY') {
        if (isSameDay(currentDate, today)) return "Today";
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (isSameDay(currentDate, tomorrow)) return "Tomorrow";
        
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (isSameDay(currentDate, yesterday)) return "Yesterday";
        
        return currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    if (viewMode === 'WEEK') {
        const currentWeekStart = getWeekStart(today);
        const viewWeekStart = getWeekStart(currentDate);
        
        // Compare timestamps of start of week (ignoring time)
        currentWeekStart.setHours(0,0,0,0);
        viewWeekStart.setHours(0,0,0,0);
        
        if (currentWeekStart.getTime() === viewWeekStart.getTime()) return "This Week";
        
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(currentWeekStart.getDate() + 7);
        if (viewWeekStart.getTime() === nextWeekStart.getTime()) return "Next Week";
        
        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(currentWeekStart.getDate() - 7);
        if (viewWeekStart.getTime() === lastWeekStart.getTime()) return "Last Week";
        
        const viewWeekEnd = new Date(viewWeekStart);
        viewWeekEnd.setDate(viewWeekStart.getDate() + 6);
        return `${viewWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${viewWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    
    if (viewMode === 'MONTH') {
        if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) return "This Month";
        
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1);
        if (currentDate.getMonth() === nextMonth.getMonth() && currentDate.getFullYear() === nextMonth.getFullYear()) return "Next Month";
        
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        if (currentDate.getMonth() === lastMonth.getMonth() && currentDate.getFullYear() === lastMonth.getFullYear()) return "Last Month";
        
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    
    return "Today";
  };

  // --- Scheduling & Actions ---

  const handleScheduleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${newEvent.date}T${newEvent.time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(newEvent.duration) * 60000);
    const batch = MOCK_BATCHES.find(b => b.id === newEvent.batchId);

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      subject: newEvent.subject,
      startTime: startDateTime,
      endTime: endDateTime,
      type: newEvent.type as 'CLASS' | 'TEST',
      batchId: newEvent.batchId,
      batchName: batch?.name || 'Unknown',
      status: 'UPCOMING'
    };

    setEvents([...events, event]);
    setShowModal(false);
    setNewEvent({ title: '', subject: '', date: '', time: '', duration: '60', type: 'CLASS', batchId: '' });
  };

  const handleToggleLiveStatus = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newEvents = events.map(ev => {
      if (ev.id === eventId) {
        const newStatus = ev.status === 'LIVE' ? 'UPCOMING' : 'LIVE';
        return { ...ev, status: newStatus };
      }
      return ev;
    });

    setEvents(newEvents);
  };

  // --- Sync Handlers ---

  const handleConnectCalendar = (provider: 'google' | 'outlook') => {
    setIsSyncing(provider);
    
    // Simulate network delay for auth
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, [provider]: true }));
      setIsSyncing(null);
      // In a real app, this would handle OAuth tokens
    }, 2000);
  };

  const handleDownloadICS = () => {
    const filteredEvents = getFilteredEvents();
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Skill U//Learning App//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    filteredEvents.forEach(event => {
      const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, "");
      const now = new Date();
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${event.id}@skillu.app\n`;
      icsContent += `DTSTAMP:${formatTime(now)}\n`;
      icsContent += `DTSTART:${formatTime(event.startTime)}\n`;
      icsContent += `DTEND:${formatTime(event.endTime)}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:${event.subject} - ${event.batchName}. Access via Skill U App.\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Skill_U_Schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Event Card Helper ---
  const renderEventCard = (event: CalendarEvent, isMonthView: boolean, isMobileList: boolean = false) => (
    <div 
      key={event.id}
      title={event.status === 'RECORDED' && event.videoUrl ? "Click to watch recording" : "View Class Details"}
      onClick={() => {
        if (event.status === 'RECORDED' && event.videoUrl) {
            window.open(event.videoUrl, '_blank');
        } else if (event.batchId && onBatchClick) {
          onBatchClick(event.batchId);
        }
      }}
      className={`
        group relative rounded-lg border-l-3 sm:border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer bg-white border-t border-r border-b border-slate-100
        ${isMonthView ? 'p-1 text-[10px]' : (isMobileList ? 'p-3' : 'p-2 sm:p-3 hover:-translate-y-1 hover:scale-[1.02]')}
        ${event.type === 'TEST' ? 'border-l-amber-500' : (event.status === 'RECORDED' ? 'border-l-emerald-500' : 'border-l-blue-500')}
      `}
    >
      <div className={`flex ${isMonthView || isMobileList ? 'flex-col gap-0.5' : 'justify-between items-start mb-1'}`}>
         <div className="flex flex-col min-w-0">
           <h4 className={`font-bold text-slate-800 leading-tight truncate ${isMonthView ? 'text-[10px]' : (isMobileList ? 'text-sm' : 'text-sm line-clamp-2')}`}>
               {event.title}
           </h4>
           {(isMobileList || !isMonthView) && (
               <span className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">{event.subject}</span>
           )}
         </div>
         
         {/* Status Indicators */}
         <div className="flex-shrink-0">
            {event.status === 'LIVE' && (
                <span className={`bg-red-500 rounded-full animate-pulse ${isMonthView ? 'w-1 h-1 inline-block ml-0.5' : 'w-2 h-2 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} title="Live Now"></span>
            )}
            {event.status === 'RECORDED' && (isMobileList || !isMonthView) && (
                <span className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full" title="Recorded"></span>
            )}
         </div>
      </div>
      
      {/* Details (Hidden in Month View) */}
      {!isMonthView && (
          <>
            <div className="space-y-1 mt-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded w-fit">
                <Clock size={10} className={event.type === 'TEST' ? 'text-amber-500' : (event.status === 'RECORDED' ? 'text-emerald-500' : 'text-blue-500')} />
                <span>
                    {event.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                </div>
                
                {role !== UserRole.STUDENT && (
                <div className="flex items-center gap-1 text-xs text-slate-500 px-0.5">
                    <GraduationCap size={10} />
                    <span className="truncate max-w-[100px]">{event.batchName}</span>
                </div>
                )}
            </div>

            <div className="mt-2 pt-1 border-t border-slate-50 flex justify-end">
                {(role === UserRole.TEACHER || role === UserRole.ADMIN) && event.type === 'CLASS' && event.status !== 'RECORDED' && (
                    <button
                        onClick={(e) => handleToggleLiveStatus(event.id, e)}
                        className={`
                            text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 transition-all w-full justify-center
                            ${event.status === 'LIVE'
                            ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                            : 'bg-slate-900 text-white hover:bg-blue-600 shadow-sm'
                            }
                        `}
                    >
                        {event.status === 'LIVE' ? <>End Session</> : <>Go Live <Video size={9} /></>}
                    </button>
                )}

                {event.status === 'RECORDED' && event.videoUrl && (
                    <a
                        href={event.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded-md transition-all border border-emerald-100"
                    >
                        <PlayCircle size={10} /> Watch Class <ExternalLink size={9} className="opacity-50"/>
                    </a>
                )}
            </div>
          </>
      )}
    </div>
  );


  // --- Render Functions for different layouts ---

  const renderDesktopGrid = () => (
    <div className="flex-1 flex-col overflow-x-auto"> {/* Only visible on desktop+ */}
        <div className={`${viewMode === 'DAY' ? '' : 'min-w-[700px] lg:min-w-[800px]'} flex-1 flex flex-col`}>
            {/* Days Header */}
            <div className={`grid ${viewMode === 'DAY' ? 'grid-cols-1' : 'grid-cols-7'} border-b border-slate-200 bg-slate-50 sticky top-0 z-10`}>
              {displayedDays.map((date, i) => {
                if (viewMode === 'MONTH' && i > 6) return null; // Only first 7 for column headers

                const isToday = isSameDay(date, new Date());
                return (
                  <div key={i} className={`py-3 px-1 sm:px-2 text-center border-r border-slate-200 last:border-r-0 ${isToday && viewMode !== 'MONTH' ? 'bg-blue-50/50' : ''}`}>
                    <div className={`text-xs font-bold uppercase mb-0.5 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                      {viewMode === 'MONTH' 
                        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
                        : date.toLocaleDateString('en-US', { weekday: viewMode === 'DAY' ? 'long' : 'short' })
                      }
                    </div>
                    {viewMode !== 'MONTH' && (
                        <div className={`text-lg md:text-xl font-bold w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mx-auto transition-colors ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                        {date.getDate()}
                        </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Grid / Events */}
            <div className="flex-1">
              <div className={`grid ${viewMode === 'DAY' ? 'grid-cols-1' : 'grid-cols-7'} h-full`}>
                {displayedDays.map((date, i) => {
                  const dayEvents = filteredEvents
                    .filter(e => isSameDay(e.startTime, date))
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                  
                  const isToday = isSameDay(date, new Date());
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                  return (
                    <div key={i} className={`
                        border-r border-b border-slate-200 last:border-r-0 
                        ${viewMode === 'MONTH' ? 'min-h-[100px] p-0.5' : 'min-h-[500px] p-1 sm:p-2'} 
                        flex flex-col gap-1 sm:gap-2 
                        ${isToday ? 'bg-blue-50/20' : ''}
                        ${!isCurrentMonth && viewMode === 'MONTH' ? 'bg-slate-50/50 text-opacity-50' : ''}
                    `}>
                      {viewMode === 'MONTH' && (
                          <div className={`text-right text-xs font-bold p-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                              <span className={isToday ? 'bg-blue-100 px-1 py-0.5 rounded' : ''}>{date.getDate()}</span>
                          </div>
                      )}

                      {dayEvents.map(event => renderEventCard(event, viewMode === 'MONTH'))}
                      
                      {dayEvents.length === 0 && viewMode !== 'MONTH' && (
                         <div className="flex-1 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            {canSchedule && (
                                <button onClick={() => {
                                    setNewEvent(prev => ({...prev, date: date.toISOString().split('T')[0]}));
                                    setShowModal(true);
                                }} className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                                    <Plus size={14} />
                                </button>
                            )}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
    </div>
  );

  const renderMobileList = () => (
    <div className="flex-1 overflow-y-auto p-4"> {/* Only visible on mobile, list format */}
      {displayedDays.map((date, i) => {
        const dayEvents = filteredEvents
          .filter(e => isSameDay(e.startTime, date))
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        const isToday = isSameDay(date, new Date());

        return (
          <div key={i} className="mb-6 last:mb-0">
            <h3 className={`text-sm font-bold uppercase mb-3 px-2 py-1 rounded-lg w-fit ${isToday ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {isToday && " (Today)"}
            </h3>
            <div className="space-y-3">
              {dayEvents.length > 0 ? dayEvents.map(event => (
                renderEventCard(event, false, true) // isMonthView=false, isMobileList=true
              )) : (
                <div className="text-center py-4 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No events.
                    {canSchedule && (
                        <button 
                            onClick={() => { setNewEvent(prev => ({...prev, date: date.toISOString().split('T')[0]})); setShowModal(true); }}
                            className="mt-2 text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1.5 mx-auto"
                        >
                            <Plus size={12}/> Schedule Event
                        </button>
                    )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMobileMonthGrid = () => (
    <div className="flex-1 flex-col"> {/* Only visible on mobile, grid format for month */}
      <div className="min-w-[500px] flex-1 flex flex-col"> {/* Added min-w to allow horizontal scroll on month view */}
        {/* Days Header */}
        <div className={`grid grid-cols-7 border-b border-slate-200 bg-slate-50 sticky top-0 z-10`}>
          {displayedDays.slice(0, 7).map((date, i) => ( // Display only 7 headers for month view
            <div key={i} className="py-3 px-1 sm:px-2 text-center border-r border-slate-200 last:border-r-0">
              <div className="text-xs font-bold uppercase mb-0.5 text-slate-400">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="flex-1">
          <div className="grid grid-cols-7 h-full">
            {displayedDays.map((date, i) => {
              const dayEvents = filteredEvents
                .filter(e => isSameDay(e.startTime, date))
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
              
              const isToday = isSameDay(date, new Date());
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <div key={i} className={`
                    border-r border-b border-slate-200 last:border-r-0 
                    min-h-[90px] p-0.5 flex flex-col gap-0.5 
                    ${isToday ? 'bg-blue-50/20' : ''}
                    ${!isCurrentMonth ? 'bg-slate-50/50 text-opacity-50' : ''}
                `}>
                  <div className={`text-right text-xs font-bold p-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                      <span className={isToday ? 'bg-blue-100 px-1 py-0.5 rounded' : ''}>{date.getDate()}</span>
                  </div>

                  {dayEvents.slice(0, 2).map(event => renderEventCard(event, true))} {/* Show max 2 events for brevity */}
                  {dayEvents.length > 2 && <span className="text-[8px] text-slate-500 px-1">+ {dayEvents.length - 2} more</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );


  const canSchedule = role === UserRole.ADMIN || role === UserRole.TEACHER;
  const filteredEvents = getFilteredEvents();
  const displayedDays = getDisplayedDays();

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-blue-50 text-blue-600 p-2 sm:p-3 rounded-xl shadow-sm">
             <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                {viewMode === 'DAY' ? currentDate.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'}) : 
                 viewMode === 'MONTH' ? currentDate.toLocaleDateString('en-US', {month: 'long', year: 'numeric'}) : 
                 'Weekly Schedule'}
            </h2>
            <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 font-medium text-xs sm:text-sm">
              {viewMode === 'WEEK' && (
                  <>
                    <span>{displayedDays[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>Week {Math.ceil((displayedDays[0]?.getDate() + 6) / 7)}</span>
                  </>
              )}
              {viewMode === 'DAY' && <span>Daily Overview</span>}
              {viewMode === 'MONTH' && <span>{filteredEvents.filter(e => e.startTime.getMonth() === currentDate.getMonth()).length} Events this month</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           {/* View Switcher */}
           <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['DAY', 'WEEK', 'MONTH'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        viewMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {m === 'DAY' ? 'Day' : m === 'WEEK' ? 'Week' : 'Month'}
                  </button>
              ))}
           </div>

           <div className="h-7 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

           {/* Navigation Controls */}
           <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-1 justify-between sm:flex-none">
             <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-slate-800">
               <ChevronLeft size={16} />
             </button>
             <button 
                onClick={goToToday} 
                className="px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all mx-1 uppercase tracking-wide min-w-[80px] sm:min-w-[100px]"
             >
               {getNavigationLabel()}
             </button>
             <button onClick={() => navigate('next')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-slate-800">
               <ChevronRight size={16} />
             </button>
           </div>
           
           {canSchedule && (
             <button 
               onClick={() => setShowModal(true)}
               className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 ml-auto shadow-md hover:shadow-lg transition-all"
             >
               <Plus size={16} />
               <span className="hidden sm:inline">Schedule</span>
             </button>
           )}
        </div>
      </div>

      {/* Calendar Grid/List Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 flex flex-col overflow-y-auto"> {/* Main vertical scroll for the content area */}
          {/* Desktop Grid View */}
          <div className="hidden md:block flex-1 flex-col overflow-x-auto"> {/* Horizontal scroll for desktop grid */}
            {renderDesktopGrid()}
          </div>

          {/* Mobile View */}
          <div className="md:hidden flex-1 flex-col">
            {viewMode === 'MONTH' ? (
              <div className="flex-1 flex-col overflow-x-auto"> {/* Mobile month view can have horizontal scroll */}
                {renderMobileMonthGrid()}
              </div>
            ) : (
              <div className="flex-1 flex-col"> {/* Mobile Day/Week view uses list, already has internal overflow-y-auto */}
                {renderMobileList()}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Sync Calendar Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden 
                       md:inset-0 md:h-auto md:rounded-2xl
                       fixed inset-x-0 bottom-0 top-auto h-auto max-h-[90vh] rounded-b-none rounded-t-2xl flex flex-col"> {/* Mobile Bottom Sheet */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">Sync Calendar</h3>
                    <p className="text-xs text-slate-500 mt-1">Keep your schedule up to date automatically.</p>
                </div>
                <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"> {/* Scrollable content */}
                {/* Google Calendar */}
                <div className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">Google Calendar</div>
                            <div className="text-xs text-slate-500">Auto-sync enabled</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleConnectCalendar('google')}
                        disabled={syncStatus.google || isSyncing === 'google'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            syncStatus.google 
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                        {syncStatus.google ? 'Connected' : isSyncing === 'google' ? 'Connecting...' : 'Connect'}
                    </button>
                </div>

                {/* Outlook */}
                <div className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 shadow-sm flex items-center justify-center text-white font-bold text-xs">
                            O
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">Outlook Calendar</div>
                            <div className="text-xs text-slate-500">Live integration</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleConnectCalendar('outlook')}
                        disabled={syncStatus.outlook || isSyncing === 'outlook'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            syncStatus.outlook 
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                    >
                        {syncStatus.outlook ? 'Connected' : isSyncing === 'outlook' ? 'Connecting...' : 'Connect'}
                    </button>
                </div>

                <div className="my-3 sm:my-4 flex items-center gap-3 sm:gap-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Or Manual Export</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                {/* Download ICS */}
                <button 
                    onClick={handleDownloadICS}
                    className="w-full flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
                        <Download size={18} sm:size={20} />
                    </div>
                    <div className="text-left flex-1">
                        <div className="font-bold text-slate-800 text-sm">Download .ics File</div>
                        <div className="text-xs text-slate-500">Compatible with Apple Calendar & others</div>
                    </div>
                </button>
            </div>
            
            <div className="bg-slate-50 p-3 sm:p-4 text-center text-xs text-slate-400 border-t border-slate-100 flex-shrink-0">
                Events will be synced based on your current role and permissions.
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 
                       md:inset-0 md:h-auto md:rounded-2xl
                       fixed inset-x-0 bottom-0 top-auto h-auto max-h-[90vh] rounded-b-none rounded-t-2xl flex flex-col"> {/* Mobile Bottom Sheet */}
             <div className="p-4 sm:p-6 border-b border-slate-100 pb-4 flex justify-between items-center flex-shrink-0 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Schedule Event</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleScheduleEvent} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"> {/* Scrollable content */}
                <div>
                   <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Event Title</label>
                   <input 
                    required 
                    value={newEvent.title} 
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    placeholder="e.g. Physics Chapter 3" 
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
                    <div className="relative">
                        <select 
                            value={newEvent.type} 
                            onChange={e => setNewEvent({...newEvent, type: e.target.value})} 
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                        <option value="CLASS">Live Class</option>
                        <option value="TEST">Test / Exam</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
                     <input required value={newEvent.subject} onChange={e => setNewEvent({...newEvent, subject: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Physics" />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch</label>
                   <div className="relative">
                       <select 
                        required 
                        value={newEvent.batchId} 
                        onChange={e => setNewEvent({...newEvent, batchId: e.target.value})} 
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                       >
                          <option value="">Select Batch</option>
                          {MOCK_BATCHES
                            .filter(b => role === UserRole.ADMIN || b.teacherId === currentUserId)
                            .map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.course})</option>
                          ))}
                       </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight size={14} className="rotate-90" />
                        </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                    <input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time</label>
                    <input type="time" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration (minutes)</label>
                   <input type="number" required value={newEvent.duration} onChange={e => setNewEvent({...newEvent, duration: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 shadow-lg shadow-blue-900/10 mt-2 transition-all">
                  Confirm Schedule
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;