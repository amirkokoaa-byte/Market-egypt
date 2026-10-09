import React, { useState } from 'react';
import { useSupermarketStore } from './hooks/useSupermarketStore';
import { Header } from './components/Header';
import { TimelineCover } from './components/TimelineCover';
import { Sidebar } from './components/Sidebar';
import { ChainProfile } from './components/ChainProfile';
import { CustomSectionView } from './components/CustomSectionView';
import { SettingsModal } from './components/SettingsModal';
import { LightboxModal } from './components/LightboxModal';
import { ChainModal } from './components/ChainModal';
import { BranchModal } from './components/BranchModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ToastContainer } from './components/Toast';
import { SupermarketChain, Branch } from './types';

export default function App() {
  const {
    isOnline,
    syncState,
    hasPendingWrites,
    pendingCount,
    triggerManualSync,
    chains,
    filteredChains,
    selectedChain,
    selectedChainId,
    setSelectedChainId,
    totalChains,
    totalBranches,
    settings,
    activeView,
    setActiveView,
    selectedSection,
    selectedSectionId,
    setSelectedSectionId,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    isLightboxOpen,
    lightboxImage,
    openLightbox,
    closeLightbox,
    toasts,
    showToast,
    removeToast,
    addChain,
    updateChain,
    deleteChain,
    addBranch,
    bulkAddBranches,
    updateBranch,
    deleteBranch,
    updateSettings,
    addCustomSection,
    deleteCustomSection,
    addCustomSubButton,
    deleteCustomSubButton,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetToDefaultData,
    logout,
    isAdmin,
    loginAsAdmin,
    logoutAdmin,
    syncAllToFirebase,
  } = useSupermarketStore();

  // Local UI Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAddChainOpen, setIsAddChainOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<SupermarketChain | null>(null);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white antialiased">
      {/* 1. TOP NAVIGATION BAR WITH REAL-TIME OFFLINE/SYNC STATUS */}
      <Header
        websiteName={settings.websiteName}
        totalChains={totalChains}
        totalBranches={totalBranches}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onResetData={resetToDefaultData}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={logoutAdmin}
        isOnline={isOnline}
        syncState={syncState}
        hasPendingWrites={hasPendingWrites}
        pendingCount={pendingCount}
        onTriggerSync={triggerManualSync}
      />

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 relative">
        {/* 3. DYNAMIC MULTI-LEVEL SIDEBAR */}
        <Sidebar
          chains={chains}
          filteredChains={filteredChains}
          selectedChainId={selectedChainId}
          onSelectChain={(id) => {
            setSelectedChainId(id);
            setActiveView('chains');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortMode={sortMode}
          onSortChange={setSortMode}
          onOpenAddChainModal={() => setIsAddChainOpen(true)}
          customSections={settings.customSections}
          activeView={activeView}
          selectedSectionId={selectedSectionId}
          onSelectCustomSection={(sectionId) => {
            setSelectedSectionId(sectionId);
            setActiveView('custom_section');
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isAdmin={isAdmin}
          onShowToast={showToast}
        />

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* 2. TIMELINE COVER BANNER (Interactive Lightbox) */}
          <TimelineCover
            coverUrl={settings.timelineCoverUrl}
            websiteName={settings.websiteName}
            onOpenLightbox={openLightbox}
            onUpdateCover={(newUrl) => {
              updateSettings({ timelineCoverUrl: newUrl });
              showToast('success', 'تم تحديث صورة غلاف التايم لاين بنجاح!');
            }}
            isAdmin={isAdmin}
          />

          {/* VIEW ROUTER */}
          {activeView === 'chains' && selectedChain ? (
            /* 4. SUPERMARKET CHAIN PROFILE CARD */
            <ChainProfile
              chain={selectedChain}
              onUpdateChain={updateChain}
              onDeleteChain={deleteChain}
              onAddBranch={addBranch}
              onBulkAddBranches={bulkAddBranches}
              onUpdateBranch={updateBranch}
              onDeleteBranch={deleteBranch}
              onOpenEditChainModal={() => setEditingChain(selectedChain)}
              onOpenAddBranchModal={() => setIsAddBranchOpen(true)}
              onOpenEditBranchModal={(b) => setEditingBranch(b)}
              showToast={showToast}
              isAdmin={isAdmin}
            />
          ) : activeView === 'custom_section' && selectedSection ? (
            /* CUSTOM SECTION VIEW */
            <CustomSectionView
              section={selectedSection}
              onBackToChains={() => setActiveView('chains')}
              onAddSubButton={addCustomSubButton}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          ) : (
            <div className="p-12 text-center text-slate-400">
              يرجى اختيار سلسلة سوبر ماركت من القائمة الجانبية
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{settings.websiteName} © {new Date().getFullYear()} — دليل سلاسل ومنافذ السوبر ماركت في مصر</span>
          <div className="text-slate-400 font-medium">
            مع تحيات المطور Amir Lamay
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Settings & Customization Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onAddCustomSection={addCustomSection}
        onDeleteCustomSection={deleteCustomSection}
        onAddCustomSubButton={addCustomSubButton}
        onDeleteCustomSubButton={deleteCustomSubButton}
        onExportBackup={exportDatabaseBackup}
        onImportBackup={importDatabaseBackup}
        onResetDefaults={resetToDefaultData}
        onLogout={logout}
        isAdmin={isAdmin}
        onSyncAllToFirebase={syncAllToFirebase}
      />

      {/* 2. Full-Screen Interactive Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        imageUrl={lightboxImage}
        onClose={closeLightbox}
        onUpdateImage={(newUrl) => {
          updateSettings({ timelineCoverUrl: newUrl });
          closeLightbox();
          showToast('success', 'تم استبدال صورة الغلاف بنجاح');
        }}
      />

      {/* 3. Add Chain Modal */}
      <ChainModal
        isOpen={isAddChainOpen}
        onClose={() => setIsAddChainOpen(false)}
        onSave={(data) => addChain(data)}
      />

      {/* 4. Edit Chain Modal */}
      {editingChain && (
        <ChainModal
          isOpen={!!editingChain}
          initialChain={editingChain}
          onClose={() => setEditingChain(null)}
          onSave={(data) => updateChain(editingChain.id, data)}
        />
      )}

      {/* 5. Add Branch Modal */}
      {selectedChain && (
        <BranchModal
          isOpen={isAddBranchOpen}
          chainName={selectedChain.name}
          onClose={() => setIsAddBranchOpen(false)}
          onSave={(branchData) => addBranch(selectedChain.id, branchData)}
        />
      )}

      {/* 6. Edit Branch Modal */}
      {selectedChain && editingBranch && (
        <BranchModal
          isOpen={!!editingBranch}
          initialBranch={editingBranch}
          chainName={selectedChain.name}
          onClose={() => setEditingBranch(null)}
          onSave={(branchData) => updateBranch(selectedChain.id, editingBranch.id, branchData)}
        />
      )}

      {/* 7. Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={loginAsAdmin}
      />

      {/* TOAST ALERTS NOTIFICATIONS */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
