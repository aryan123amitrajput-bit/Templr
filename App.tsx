import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import TemplateGallery from './components/TemplateGallery';
import WhyTemplr from './components/WhyTemplr';
import FeaturedCreators from './components/FeaturedCreators';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ChatModal from './components/ChatModal';
import UploadModal from './components/UploadModal';
import ImageViewerModal from './components/ImageViewerModal';
import DashboardModal from './components/DashboardModal';
import LoginModal from './components/LoginModal';
import Notification from './components/Notification';
import * as api from './api';
import { playOpenModalSound, playCloseModalSound, playSuccessSound } from './audio';
import type { Session, Template, NewTemplateData } from './api';


const App: React.FC = () => {
  const [isChatModalOpen, setChatModalOpen] = useState(false);
  const [chattingWith, setChattingWith] = useState('');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDashboardOpen, setDashboardOpen] = useState(false); 
  const [isLoginModalOpen, setLoginModalOpen] = useState(false); // Login Modal State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Local User State
  const [likedTemplateIds, setLikedTemplateIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('templr_liked_ids');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      return new Set();
    }
  });

  const [viewedTemplateIds, setViewedTemplateIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('templr_viewed_ids');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      return new Set();
    }
  });

  useEffect(() => {
    const { data: { subscription } } = api.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    setIsLoading(true);
    api.listenForTemplates((newTemplates) => {
      setTemplates(newTemplates);
      setIsLoading(false);
    });
    return () => { api.detachTemplatesListener(); };
  }, []);

  const displayTemplates = useMemo(() => {
    return templates.map(t => ({
      ...t,
      isLiked: likedTemplateIds.has(t.id)
    }));
  }, [templates, likedTemplateIds]);

  const handleOpenChatModal = (creatorName: string) => {
    playOpenModalSound();
    setChattingWith(creatorName);
    setChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    playCloseModalSound();
    setChatModalOpen(false);
  };

  const handleOpenUploadModal = () => {
    playOpenModalSound();
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    playCloseModalSound();
    setUploadModalOpen(false);
  };

  const handleOpenDashboard = () => {
      playOpenModalSound();
      setDashboardOpen(true);
  }

  const handleCloseDashboard = () => {
      playCloseModalSound();
      setDashboardOpen(false);
  }

  const handleOpenLoginModal = () => {
    playOpenModalSound();
    setLoginModalOpen(true);
  }

  const handleCloseLoginModal = () => {
    playCloseModalSound();
    setLoginModalOpen(false);
  }

  // Auth Handlers
  const handleEmailLogin = async (email: string, pass: string) => {
    await api.signInWithEmail(email, pass);
  }

  const handleEmailSignup = async (email: string, pass: string, name: string) => {
    await api.signUpWithEmail(email, pass, name);
  }
  
  const handleSignOut = async () => { await api.signOut(); };

  const handleAddTemplate = async (templateData: NewTemplateData) => {
    // Session check is now also handled inside UploadModal for better UX
    if (!session?.user) {
      setNotification("Please sign in to complete your upload.");
      handleOpenLoginModal();
      return;
    }
    await api.addTemplate(templateData, session.user);
    playSuccessSound();
    setNotification("Design uploaded successfully.");
  };

  const handleViewClick = (templateId: string) => {
    const templateToShow = displayTemplates.find(t => t.id === templateId);
    if (templateToShow) {
      playOpenModalSound();
      if (!viewedTemplateIds.has(templateId)) {
         const updatedViews = templateToShow.views + 1;
         api.updateTemplate(templateId, { views: updatedViews });
         const newViewedSet = new Set(viewedTemplateIds);
         newViewedSet.add(templateId);
         setViewedTemplateIds(newViewedSet);
         localStorage.setItem('templr_viewed_ids', JSON.stringify(Array.from(newViewedSet)));
         setViewingTemplate({ ...templateToShow, views: updatedViews });
      } else {
         setViewingTemplate(templateToShow);
      }
      setViewerOpen(true);
    }
  };

  const handleCloseViewer = () => {
    playCloseModalSound();
    setViewerOpen(false);
    setTimeout(() => setViewingTemplate(null), 300);
  };

  const handleLikeClick = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        const isCurrentlyLiked = likedTemplateIds.has(templateId);
        const newLikes = isCurrentlyLiked ? template.likes - 1 : template.likes + 1;
        const safeLikes = Math.max(0, newLikes);
        api.updateTemplate(templateId, { likes: safeLikes });
        const newLikedSet = new Set(likedTemplateIds);
        if (isCurrentlyLiked) {
            newLikedSet.delete(templateId);
        } else {
            newLikedSet.add(templateId);
        }
        setLikedTemplateIds(newLikedSet);
        localStorage.setItem('templr_liked_ids', JSON.stringify(Array.from(newLikedSet)));
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans overflow-x-hidden selection:bg-white selection:text-black">
      <Header 
        session={session}
        onUploadClick={handleOpenUploadModal} 
        onLoginClick={handleOpenLoginModal}
        onSignOut={handleSignOut}
        onDashboardClick={handleOpenDashboard}
      />
      <main>
        {/* Components handle their own ScrollReveal animations now */}
        <Hero onUploadClick={handleOpenUploadModal} />
        
        <WhyTemplr />
        
        <TemplateGallery 
          templates={displayTemplates}
          isLoading={isLoading}
          onMessageCreator={handleOpenChatModal}
          onLike={handleLikeClick}
          onView={handleViewClick}
        />
        
        <FeaturedCreators />
        
        <CTA />
      </main>
      
      <Footer onShowNotification={(msg) => setNotification(msg)} />

      <ChatModal 
        isOpen={isChatModalOpen} 
        onClose={handleCloseChatModal} 
        creatorName={chattingWith} 
      />
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onAddTemplate={handleAddTemplate}
        onDashboardClick={() => {
          handleCloseUploadModal();
          handleOpenDashboard();
        }}
        isLoggedIn={!!session}
        onLoginRequest={handleOpenLoginModal}
      />
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        template={viewingTemplate}
      />
      <DashboardModal 
        isOpen={isDashboardOpen}
        onClose={handleCloseDashboard}
        userEmail={session?.user.email}
      />
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onLogin={handleEmailLogin}
        onSignup={handleEmailSignup}
      />
      {notification && (
        <Notification 
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App;