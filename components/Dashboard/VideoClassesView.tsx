import React, { useState } from 'react';
import { VideoClass, UserRole, ToastNotification } from '../../types';
import { MOCK_VIDEOS } from '../../data/mockData';
import { Plus, Video, Calendar, Clock, PlayCircle, ExternalLink, X, Trash2, Loader2, Sparkles, MessageCircle } from 'lucide-react'; // Added Loader2, Sparkles
import { generateVideoSummary } from '../../services/geminiService'; // Import the Gemini service

interface VideoClassesViewProps {
  role: UserRole;
  batchId: string;
  setActiveToast?: (toast: ToastNotification | null) => void;
}

const VideoClassesView: React.FC<VideoClassesViewProps> = ({ role, batchId, setActiveToast }) => {
  const [videos, setVideos] = useState<VideoClass[]>(MOCK_VIDEOS);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddRecordedModal, setShowAddRecordedModal] = useState(false);
  const [newVideoClass, setNewVideoClass] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: '', // HH:MM format
    url: '',
  });
  const [generatingSummaryId, setGeneratingSummaryId] = useState<string | null>(null); // State for AI summary loading

  const filteredVideos = videos.filter(v => v.batchId === batchId).sort((a, b) => b.date - a.date);
  const canManage = role === UserRole.ADMIN || role === UserRole.TEACHER;

  const handleScheduleLiveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoClass.title || !newVideoClass.date || !newVideoClass.time || !newVideoClass.duration) return;

    const classDate = new Date(`${newVideoClass.date}T${newVideoClass.time}`);
    const newLink = `https://meet.google.com/${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}`;

    const newClass: VideoClass = {
      id: `live_${Date.now()}`,
      title: newVideoClass.title,
      date: classDate.getTime(),
      duration: newVideoClass.duration,
      url: newLink,
      batchId: batchId,
      status: 'UPCOMING',
    };

    setVideos(prev => [newClass, ...prev]);
    setShowScheduleModal(false);
    setNewVideoClass({ title: '', date: new Date().toISOString().split('T')[0], time: '', duration: '', url: '' });
    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Live Class Scheduled',
      message: `'${newClass.title}' scheduled for ${new Date(newClass.date).toLocaleDateString()}.`,
      type: 'success'
    });
  };

  const handleAddRecordedVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoClass.title || !newVideoClass.date || !newVideoClass.duration || !newVideoClass.url) return;

    const newVideo: VideoClass = {
      id: `rec_${Date.now()}`,
      title: newVideoClass.title,
      date: new Date(newVideoClass.date).getTime(),
      duration: newVideoClass.duration,
      url: newVideoClass.url,
      batchId: batchId,
      status: 'RECORDED',
    };

    setVideos(prev => [newVideo, ...prev]);
    setShowAddRecordedModal(false);
    setNewVideoClass({ title: '', date: new Date().toISOString().split('T')[0], time: '', duration: '', url: '' });
    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Recorded Video Added',
      message: `'${newVideo.title}' added to recorded classes.`,
      type: 'success'
    });
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this video class?')) {
      setVideos(prev => prev.filter(v => v.id !== id));
      setActiveToast?.({
        id: `toast_${Date.now()}`,
        title: 'Video Deleted',
        message: 'Video class removed successfully.',
        type: 'info'
      });
    }
  };

  const isLiveNow = (video: VideoClass) => {
    const now = Date.now();
    const classStart = video.date;
    // Assume a live class is 'live' for its duration (e.g., 60 mins if duration is 60:00)
    let durationMs = 60 * 60 * 1000; // Default to 1 hour
    if (video.duration.includes(':')) {
        const parts = video.duration.split(':').map(Number);
        durationMs = (parts[0] * 60 + parts[1]) * 1000;
    }

    return video.status === 'UPCOMING' && now >= classStart && now <= classStart + durationMs;
  };

  const handleGenerateSummary = async (videoId: string, videoTitle: string) => {
    setGeneratingSummaryId(videoId);
    try {
        // Simulate fetching transcript/key points for the video.
        // In a real application, this would involve a backend call to a video processing service
        // that generates a transcript, or it would come from a pre-defined content store.
        const simulatedTranscript = `The recorded class "${videoTitle}" covered topics including:
        - Introduction to the core concepts.
        - Detailed explanation of key algorithms.
        - Practical examples and use cases.
        - Q&A session with student queries regarding implementation.
        - Assignment guidelines for further practice.`;

        const summary = await generateVideoSummary(simulatedTranscript);
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, summary: summary } : v));
        setActiveToast?.({
            id: `toast_${Date.now()}`,
            title: 'Summary Generated',
            message: `AI summary for '${videoTitle}' created.`,
            type: 'success'
        });
    } catch (error) {
        console.error("Error generating summary:", error);
        setActiveToast?.({
            id: `toast_error_${Date.now()}`,
            title: 'Summary Failed',
            message: `Failed to generate summary for '${videoTitle}'. Please try again.`,
            type: 'error'
        });
    } finally {
        setGeneratingSummaryId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Video size={22} className="text-purple-600"/> Video Classes
        </h2>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} /> Schedule Live
            </button>
            <button
              onClick={() => setShowAddRecordedModal(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Recorded
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredVideos.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredVideos.map(video => (
              <div key={video.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                    <Video size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{video.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      <Calendar size={12} className="inline-block mr-1" />{new Date(video.date).toLocaleDateString()}
                      <Clock size={12} className="inline-block ml-3 mr-1" />{video.duration}
                    </p>
                    {video.status === 'RECORDED' && video.summary && (
                        <div className="mt-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-slate-700 leading-snug flex items-start gap-2">
                            <Sparkles size={16} className="flex-shrink-0 text-blue-600 mt-0.5"/>
                            <p className="flex-1">
                                <span className="font-bold text-blue-700">AI Summary: </span>
                                {video.summary}
                            </p>
                        </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {video.status === 'UPCOMING' || isLiveNow(video) ? (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${isLiveNow(video) ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      {isLiveNow(video) ? <PlayCircle size={16} /> : <ExternalLink size={16} />}
                      {isLiveNow(video) ? 'JOIN LIVE' : 'Join Class'}
                    </a>
                  ) : (
                    <>
                        <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 hover:bg-purple-200"
                        >
                        <PlayCircle size={16} /> Watch Recording
                        </a>
                        {canManage && !video.summary && (
                            <button
                                onClick={() => handleGenerateSummary(video.id, video.title)}
                                disabled={generatingSummaryId === video.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 hover:bg-green-200 transition-colors disabled:opacity-70"
                            >
                                {generatingSummaryId === video.id ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={14} /> AI Summary
                                    </>
                                )}
                            </button>
                        )}
                    </>
                  )}
                  {canManage && (
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Video Class"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Video size={32} className="mx-auto mb-2 opacity-50" />
            No video classes available for this batch yet.
          </div>
        )}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Schedule Live Class</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleScheduleLiveClass} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  value={newVideoClass.title}
                  onChange={e => setNewVideoClass({ ...newVideoClass, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Chapter 5: Advanced Calculus"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newVideoClass.date}
                    onChange={e => setNewVideoClass({ ...newVideoClass, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newVideoClass.time}
                    onChange={e => setNewVideoClass({ ...newVideoClass, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (HH:MM)</label>
                <input
                  type="text" // Use text for HH:MM format
                  required
                  value={newVideoClass.duration}
                  onChange={e => setNewVideoClass({ ...newVideoClass, duration: e.target.value })}
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  title="Format: HH:MM (e.g., 01:30 for 1 hour 30 minutes)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 01:30"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                Schedule Class
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddRecordedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add Recorded Video</h3>
              <button onClick={() => setShowAddRecordedModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRecordedVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={newVideoClass.title}
                  onChange={e => setNewVideoClass({ ...newVideoClass, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Lecture 1: Introduction to Biology"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date Recorded</label>
                <input
                  type="date"
                  required
                  value={newVideoClass.date}
                  onChange={e => setNewVideoClass({ ...newVideoClass, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (HH:MM)</label>
                <input
                  type="text"
                  required
                  value={newVideoClass.duration}
                  onChange={e => setNewVideoClass({ ...newVideoClass, duration: e.target.value })}
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  title="Format: HH:MM (e.g., 01:30 for 1 hour 30 minutes)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 00:50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Video URL (e.g., YouTube)</label>
                <input
                  type="url"
                  required
                  value={newVideoClass.url}
                  onChange={e => setNewVideoClass({ ...newVideoClass, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://www.youtube.com/watch?v=example"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                Add Video
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoClassesView;