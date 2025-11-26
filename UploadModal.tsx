import React, { useState, useEffect, useRef } from 'react';
import { XIcon, UploadIcon, CheckCircleIcon, GlobeIcon, ArrowLeftIcon } from './Icons';
import { playClickSound, playTypingSound, playSuccessSound } from '../audio';
import { uploadFile, NewTemplateData } from '../api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (templateData: NewTemplateData) => Promise<void>;
  onDashboardClick: () => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

// Custom Cloud Icon for the specific UI
const CloudUploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddTemplate, onDashboardClick, isLoggedIn, onLoginRequest }) => {
  const [step, setStep] = useState<'form' | 'uploading' | 'success'>('form');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("Initializing...");
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // Treating as "Tags" visually or desc
  const [category, setCategory] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [isPublic, setIsPublic] = useState(true); // "Publish Publicly" toggle

  // File State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetFileName, setAssetFileName] = useState('');
  const [externalLink, setExternalLink] = useState('');
  
  const assetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setStep('form');
        setTitle('');
        setDescription('');
        setCategory('');
        setPriceValue('');
        setImagePreview(null);
        setAssetFile(null);
        setAssetFileName('');
        setExternalLink('');
        setIsPublic(true);
        setUploadProgress(0);
        setUploadStatusText("Initializing...");
    }
  }, [isOpen]);

  // Handlers
  const handleAssetUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setAssetFile(file);
          setAssetFileName(file.name);
          
          // If it's an image, use it as cover too for convenience
          if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onloadend = () => setImagePreview(reader.result as string);
              reader.readAsDataURL(file);
          }
          playClickSound();
      }
      // Reset value so selecting the same file triggers change again if needed
      if (event.target) event.target.value = '';
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setExternalLink(e.target.value);
      // If link provided, clear file
      if (e.target.value) {
          setAssetFile(null);
          setAssetFileName('');
      }
  };

  const handleNavClick = () => {
      playClickSound();
      onDashboardClick();
  }

  const handleSubmit = async () => {
    playClickSound();

    if (!isLoggedIn) {
        onLoginRequest();
        return;
    }

    if (!title || !category) {
        alert('Please fill in the template title and category.');
        return;
    }
    if (!assetFile && !externalLink) {
        alert('Please upload a file or paste a link.');
        return;
    }
    
    setStep('uploading');
    setUploadProgress(0);
    setUploadStatusText("Starting upload...");

    try {
        let finalExternalLink = externalLink;
        let finalImageUrl = imagePreview;

        // 1. Upload Asset File if exists
        if (assetFile) {
            setUploadStatusText("Uploading file...");
            const path = `uploads/${Date.now()}_${assetFile.name}`;
            
            // Promise wrapper to handle timeouts if the network hangs
            const uploadPromise = uploadFile(assetFile, path, (progress) => {
                setUploadProgress(progress);
                if (progress < 100) {
                     setUploadStatusText(`Uploading... ${Math.round(progress)}%`);
                } else {
                     setUploadStatusText("Processing...");
                }
            });
            
            // Race against a generous timeout for the *whole* process, though api.ts has a start watchdog
            const timeoutPromise = new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error("Upload operation timed out. Please retry.")), 60000)
            );

            finalExternalLink = await Promise.race([uploadPromise, timeoutPromise]);
            
            // If the asset is an image, we can use the uploaded URL as the image URL
            if (assetFile.type.startsWith('image/')) {
                finalImageUrl = finalExternalLink;
            }
        } else {
            // Fake progress for link-only submission
            setUploadStatusText("Verifying link...");
            setUploadProgress(30);
            await new Promise(r => setTimeout(r, 500));
            setUploadProgress(100);
            await new Promise(r => setTimeout(r, 300));
        }

        setUploadStatusText("Saving details...");
        await onAddTemplate({
          title,
          imageUrl: finalImageUrl || 'https://picsum.photos/seed/placeholder/600/400', 
          description: description || 'No description provided.',
          category,
          price: priceValue ? `₹${priceValue}` : 'Free',
          fileName: assetFileName || 'External Link',
          fileType: assetFile ? assetFile.name.split('.').pop() : 'link',
          externalLink: finalExternalLink
        });
        
        setStep('success');
        playSuccessSound();
        setTimeout(onClose, 2000);
    } catch (e: any) {
         console.error(e);
         // Reset state to allow retry
         alert(e.message || "Failed to upload template. Please try again.");
         setStep('form');
         setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-10 md:pt-20 bg-[#000000]/95 backdrop-blur-xl overflow-y-auto animate-fade-in pb-20">
        
        {/* Background Ambience (Nebula) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>
        </div>

        {/* Back Button (Top Left) */}
        <button 
            onClick={onClose}
            disabled={step === 'uploading'}
            className="fixed top-6 left-6 z-50 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
        </button>

        {/* Close Button (Top Right) */}
        <button onClick={onClose} disabled={step === 'uploading'} className="fixed top-6 right-6 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-0">
            <XIcon className="w-6 h-6" />
        </button>

        {/* --- 1. HEADER LOGO & NAV --- */}
        <div className="relative z-10 flex flex-col items-center mb-10 animate-slide-up" style={{ animationDelay: '0ms' }}>
            
            {/* 
                NEW TEMPLR BUTTON 
                Recreated from provided HTML/CSS
            */}
            <div className="relative mb-10">
                <button 
                    className="relative inline-flex justify-center items-center px-[40px] py-3 text-[2rem] font-bold text-white tracking-[-0.02em] rounded-[20px] cursor-default transition-all duration-300 hover:-translate-y-[1px] active:translate-y-[1px] group"
                    style={{
                        background: `
                            linear-gradient(180deg, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%) padding-box,
                            linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 100%) border-box
                        `,
                        border: '1.5px solid transparent',
                        boxShadow: `
                            inset 0 1px 0 rgba(255,255,255,0.1),
                            0 0 20px rgba(255, 255, 255, 0.15),
                            0 0 40px rgba(255, 255, 255, 0.05)
                        `
                    }}
                >
                    Templr
                    {/* Hover Effect Overlay to brighten glow */}
                    <div 
                        className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                            boxShadow: `
                                inset 0 1px 0 rgba(255,255,255,0.2),
                                0 0 30px rgba(255, 255, 255, 0.3),
                                0 0 60px rgba(255, 255, 255, 0.1)
                            `
                        }}
                    />
                </button>
            </div>

            {/* Nav Pills */}
            <div className="flex items-center bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-lg">
                {/* Dashboard (Functional) */}
                <button 
                    onClick={handleNavClick}
                    className="relative px-6 py-2 rounded-full bg-white/10 border border-white/5 shadow-inner hover:bg-white/20 transition-all overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                    <span className="text-sm font-bold text-white relative z-10">Dashboard</span>
                </button>
                
                {/* Other sections mapped to Dashboard for now */}
                {['Templates', 'Analytics'].map(item => (
                    <button 
                        key={item} 
                        onClick={handleNavClick}
                        className="px-6 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-white transition-colors"
                    >
                        {item}
                    </button>
                ))}
            </div>
        </div>

        {/* --- 2. MAIN UPLOAD CARD --- */}
        <div className="relative z-10 w-full max-w-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            
            {/* Glow Effect Behind Card */}
            <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/30 to-purple-500/10 rounded-[32px] blur-xl opacity-50"></div>

            <div className="relative bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-gradient-to-b from-white/[0.03] to-transparent rounded-[28px] p-8 md:p-12 flex flex-col items-center text-center border border-white/5">
                    
                    {/* Cloud Icon */}
                    <div className="mb-6 relative group cursor-pointer" onClick={() => step === 'form' && assetInputRef.current?.click()}>
                        <div className={`w-24 h-24 rounded-[24px] border-2 border-dashed ${assetFile ? 'border-green-500/50 bg-green-500/5' : 'border-slate-600 group-hover:border-blue-400 group-hover:bg-blue-500/5'} flex items-center justify-center transition-all duration-300`}>
                            {assetFile ? (
                                <CheckCircleIcon className="w-10 h-10 text-green-400" />
                            ) : (
                                <CloudUploadIcon className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                            )}
                        </div>
                        {step === 'form' && <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        {step === 'uploading' ? 'Deploying...' : 'Upload Your Template'}
                    </h2>
                    
                    {step === 'uploading' ? (
                        <div className="w-full max-w-xs mt-6">
                            <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                                <span className="uppercase tracking-wider">{uploadStatusText}</span>
                                <span>{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                                <div 
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                >
                                    {/* Shimmer on bar */}
                                    <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_1s_infinite] -translate-x-full"></div>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-slate-500 animate-pulse text-center uppercase tracking-widest">
                                Do not close this window
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 text-xs mb-8 font-medium uppercase tracking-wide">
                                {assetFileName ? (
                                    <span className="text-green-400">{assetFileName} selected</span>
                                ) : (
                                    "Supported: ZIP, FIG, XD, JPG, PNG"
                                )}
                            </p>

                            {/* Premium 3D Browse Button */}
                            <button 
                                onClick={() => assetInputRef.current?.click()}
                                className="group relative w-64 h-16 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.6),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.8),0_0_0_1px_rgba(255,255,255,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                                
                                <UploadIcon className="w-5 h-5 text-white relative z-20" />
                                <span className="text-white font-bold text-base tracking-wide relative z-20">Browse Files</span>
                            </button>
                            <input 
                                type="file" 
                                ref={assetInputRef} 
                                className="hidden" 
                                onChange={handleAssetUpload} 
                                accept=".zip,.fig,.xd,.sketch,.psd,.png,.jpg,.jpeg"
                            />

                            {/* Divider */}
                            <div className="flex items-center gap-4 w-full max-w-xs my-8">
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">or Paste a Link</span>
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                            </div>

                            {/* Link Input */}
                            <div className="w-full max-w-md relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                                <input 
                                    type="text" 
                                    value={externalLink}
                                    onChange={handleLinkChange}
                                    placeholder="Paste a Link (Drive, Dropbox, Figma...)" 
                                    className="relative w-full bg-[#020202] border border-[#1F1F1F] text-center text-white placeholder-slate-600 text-sm font-medium py-4 px-6 rounded-xl focus:outline-none focus:border-blue-500/50 focus:bg-[#0A0A0A] transition-all"
                                />
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>

        {/* --- 3. INFO CARD --- */}
        {step === 'form' && (
            <div className="relative z-10 w-full max-w-md mt-6 mb-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
                
                {/* Card Glow */}
                <div className="absolute -inset-1 bg-white/5 rounded-[24px] blur-lg"></div>

                <div className="relative bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 shadow-2xl">
                    
                    <h3 className="text-xl font-bold text-white mb-6 text-center">Template Information</h3>
                    
                    <div className="space-y-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Template Title" 
                                className="w-full bg-[#020202] border border-[#1F1F1F] text-white placeholder-slate-600 text-sm font-medium py-3 px-4 rounded-xl focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        {/* Category */}
                        <div className="relative">
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#020202] border border-[#1F1F1F] text-white text-sm font-medium py-3 px-4 rounded-xl focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="text-slate-600">Category Select</option>
                                <option>SaaS</option>
                                <option>E-commerce</option>
                                <option>Portfolio</option>
                                <option>UI Kit</option>
                                <option>Dashboard</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">▼</div>
                        </div>

                        {/* Tags (Description) */}
                        <div>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description / Tags (e.g. minimal, dark)" 
                                rows={2}
                                className="w-full bg-[#020202] border border-[#1F1F1F] text-white placeholder-slate-600 text-sm font-medium py-3 px-4 rounded-xl focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                            />
                        </div>
                        
                        {/* Price (Extra Field matching style) */}
                        <div>
                            <input 
                                type="number" 
                                value={priceValue}
                                onChange={(e) => setPriceValue(e.target.value)}
                                placeholder="Price (₹) - Leave empty for Free" 
                                className="w-full bg-[#020202] border border-[#1F1F1F] text-white placeholder-slate-600 text-sm font-medium py-3 px-4 rounded-xl focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        {/* Publish Toggle */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-medium text-white">Publish Publicly</span>
                            <button 
                                onClick={() => { setIsPublic(!isPublic); playClickSound(); }}
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isPublic ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Submit Action (Implicit in UI but needed) */}
                    <button 
                        onClick={handleSubmit}
                        className="w-full mt-8 py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-colors flex justify-center"
                    >
                        Complete Upload
                    </button>

                </div>
            </div>
        )}

    </div>
  );
};

export default UploadModal;