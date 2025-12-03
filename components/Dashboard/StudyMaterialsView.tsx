import React, { useState } from 'react';
import { StudyMaterial, UserRole, ToastNotification } from '../../types';
import { MOCK_MATERIALS } from '../../data/mockData';
import { Plus, Upload, BookOpen, FileText, Link as LinkIcon, Video, Image as ImageIcon, X, Trash2, Download } from 'lucide-react';

interface StudyMaterialsViewProps {
  role: UserRole;
  batchId: string;
  setActiveToast?: (toast: ToastNotification | null) => void;
}

const StudyMaterialsView: React.FC<StudyMaterialsViewProps> = ({ role, batchId, setActiveToast }) => {
  const [materials, setMaterials] = useState<StudyMaterial[]>(MOCK_MATERIALS);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'PDF' as 'PDF' | 'LINK' | 'VIDEO' | 'DOC' | 'PPT' | 'EXCEL' | 'IMAGE',
    urlOrFile: '',
    file: null as File | null,
  });

  const filteredMaterials = materials.filter(m => m.batchId === batchId);
  const canManage = role === UserRole.ADMIN || role === UserRole.TEACHER;

  const getMaterialIcon = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'PDF': return <FileText size={20} className="text-red-500" />;
      case 'LINK': return <LinkIcon size={20} className="text-blue-500" />;
      case 'VIDEO': return <Video size={20} className="text-purple-500" />;
      case 'IMAGE': return <ImageIcon size={20} className="text-emerald-500" />;
      case 'DOC': return <FileText size={20} className="text-indigo-500" />;
      case 'PPT': return <FileText size={20} className="text-orange-500" />;
      case 'EXCEL': return <FileText size={20} className="text-green-500" />;
      default: return <BookOpen size={20} className="text-slate-500" />;
    }
  };

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || (!newMaterial.urlOrFile && !newMaterial.file)) return;

    let url = newMaterial.urlOrFile;
    if (newMaterial.file) {
      url = URL.createObjectURL(newMaterial.file); // Simulate file upload
    }

    const material: StudyMaterial = {
      id: `mat_${Date.now()}`,
      title: newMaterial.title,
      type: newMaterial.type,
      url: url,
      uploadDate: Date.now(),
      batchId: batchId,
    };

    setMaterials(prev => [...prev, material]);
    setShowUploadModal(false);
    setNewMaterial({ title: '', type: 'PDF', urlOrFile: '', file: null });

    setActiveToast?.({
      id: `toast_${Date.now()}`,
      title: 'Material Uploaded',
      message: `'${material.title}' added to study materials.`,
      type: 'success'
    });
  };

  const handleDeleteMaterial = (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setMaterials(prev => prev.filter(m => m.id !== id));
      setActiveToast?.({
        id: `toast_${Date.now()}`,
        title: 'Material Deleted',
        message: 'Study material removed successfully.',
        type: 'info'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={22} className="text-blue-600"/> Study Materials
        </h2>
        {canManage && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} /> Upload Material
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredMaterials.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredMaterials.map(material => (
              <div key={material.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                    {getMaterialIcon(material.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{material.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {material.type} • Uploaded: {new Date(material.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-200"
                    download={material.type === 'PDF' || material.type === 'DOC' || material.type === 'PPT' || material.type === 'EXCEL'}
                  >
                    {material.type === 'LINK' || material.type === 'VIDEO' ? 'View' : 'Download'} <Download size={14} />
                  </a>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Material"
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
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            No study materials added to this batch yet.
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Upload Study Material</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Chapter 1 Notes"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={newMaterial.type}
                  onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value as StudyMaterial['type'], urlOrFile: '', file: null })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="LINK">External Link</option>
                  <option value="VIDEO">Video Link</option>
                  <option value="IMAGE">Image File</option>
                  <option value="DOC">Word Document</option>
                  <option value="PPT">PowerPoint Presentation</option>
                  <option value="EXCEL">Excel Spreadsheet</option>
                </select>
              </div>
              {newMaterial.type === 'LINK' || newMaterial.type === 'VIDEO' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">URL</label>
                  <input
                    type="url"
                    required
                    value={newMaterial.urlOrFile}
                    onChange={e => setNewMaterial({ ...newMaterial, urlOrFile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. https://example.com/notes"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Upload File</label>
                  <input
                    type="file"
                    required={!newMaterial.urlOrFile}
                    onChange={e => setNewMaterial({ ...newMaterial, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {newMaterial.file && <p className="text-xs text-slate-500 mt-1">Selected: {newMaterial.file.name}</p>}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                Upload Material
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialsView;