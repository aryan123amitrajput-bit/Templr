import React, { useEffect, useState } from 'react';
import { XIcon, CheckCircleIcon, LockIcon } from './Icons';
import { Template, listenForTemplates, deleteTemplate, updateTemplate } from '../api';
import { playClickSound, playSuccessSound } from '../audio';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | undefined;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'admin'>('creator');
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock Admin Check
  const isAdmin = true; // For demo purposes, everyone is admin

  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        listenForTemplates((data) => {
            setAllTemplates(data);
            setLoading(false);
        });
    }
  }, [isOpen]);

  const handleApprove = async (id: string) => {
      playSuccessSound();
      await updateTemplate(id, { status: 'approved' });
  };

  const handleDelete = async (id: string) => {
      if (confirm('Are you sure you want to delete this template?')) {
          playClickSound();
          await deleteTemplate(id);
      }
  };

  const myTemplates = allTemplates.filter(t => t.author.toLowerCase().includes((userEmail?.split('@')[0] || '').toLowerCase()) || t.author === 'Anonymous Creator');
  
  // Calculate Creator Stats
  const totalSales = myTemplates.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const totalEarnings = myTemplates.reduce((acc, curr) => acc + (curr.earnings || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in" onClick={onClose}>
        <div className="w-full max-w-5xl h-[85vh] bg-[#030304] border border-[#1F1F1F] rounded-[24px] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-8 border-b border-[#1F1F1F] flex justify-between items-center bg-[#050505]">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                    <p className="text-slate-500 text-sm">Manage your content and earnings.</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-[#111] text-slate-400 hover:text-white hover:bg-[#222]"><XIcon className="w-5 h-5"/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#1F1F1F] bg-[#050505]">
                <button 
                    onClick={() => setActiveTab('creator')} 
                    className={`px-8 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'creator' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Creator Studio
                </button>
                {isAdmin && (
                    <button 
                        onClick={() => setActiveTab('admin')} 
                        className={`px-8 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'admin' ? 'border-purple-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Admin Control
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#030304]">
                
                {/* --- CREATOR TAB --- */}
                {activeTab === 'creator' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-[#080808] border border-[#222]">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Earnings</p>
                                <p className="text-3xl font-mono font-bold text-white">₹{totalEarnings.toLocaleString()}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#080808] border border-[#222]">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Sales</p>
                                <p className="text-3xl font-mono font-bold text-white">{totalSales}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#080808] border border-[#222]">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Live Templates</p>
                                <p className="text-3xl font-mono font-bold text-white">{myTemplates.length}</p>
                            </div>
                        </div>

                        {/* Template List */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">My Templates</h3>
                            <div className="space-y-4">
                                {myTemplates.map(template => (
                                    <div key={template.id} className="flex items-center justify-between p-4 rounded-xl bg-[#080808] border border-[#222] hover:border-[#333] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <img src={template.imageUrl} className="w-16 h-12 object-cover rounded-md opacity-80" alt="" />
                                            <div>
                                                <p className="text-white font-bold">{template.title}</p>
                                                <p className="text-xs text-slate-500">{template.price} • {template.views} Views</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${template.status === 'approved' ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'}`}>
                                                {template.status || 'Approved'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ADMIN TAB --- */}
                {activeTab === 'admin' && (
                     <div className="space-y-8">
                         <h3 className="text-lg font-bold text-white">Global Template Management</h3>
                         <div className="space-y-4">
                            {allTemplates.map(template => (
                                <div key={template.id} className="flex items-center justify-between p-4 rounded-xl bg-[#080808] border border-[#222] hover:border-[#333]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-12 bg-[#111] rounded-md overflow-hidden">
                                            <img src={template.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{template.title}</p>
                                            <p className="text-xs text-slate-500">by {template.author} • {template.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {template.status === 'pending' && (
                                            <button onClick={() => handleApprove(template.id)} className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-bold hover:bg-green-500">
                                                Approve
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(template.id)} className="px-3 py-1.5 rounded bg-red-900/20 text-red-500 text-xs font-bold hover:bg-red-900/40 border border-red-900/30">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default DashboardModal;