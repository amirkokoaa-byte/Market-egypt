import { useState, useEffect, useCallback, useMemo } from 'react';
import { SupermarketChain, AppSettings, Branch, ToastMessage, CustomSidebarSection, CustomSubButton } from '../types';
import { INITIAL_CHAINS, INITIAL_SETTINGS, DEFAULT_TIMELINE_COVER } from '../data/initialData';
import { normalizeBranchKey, deduplicateBranches } from '../utils/excel';
import {
  subscribeToChains,
  saveChainToFirestore,
  deleteChainFromFirestore,
  syncAllChainsToFirestore,
  subscribeToSettings,
  saveSettingsToFirestore,
} from '../lib/firebase';

const STORAGE_KEY_CHAINS = 'egypt_supermarkets_chains_v2';
const STORAGE_KEY_SETTINGS = 'egypt_supermarkets_settings_v2';
const STORAGE_KEY_ADMIN = 'egypt_supermarkets_admin_session';

// Helper to clean and deduplicate branches across all chains
function cleanChainsData(rawChains: SupermarketChain[]): SupermarketChain[] {
  return rawChains.map((chain) => {
    const seen = new Set<string>();
    const uniqueBranches: Branch[] = [];

    (chain.branches || []).forEach((b) => {
      const keyWithAddr = normalizeBranchKey(b.name, b.address);
      const keyNameOnly = normalizeBranchKey(b.name, '');

      if (!seen.has(keyWithAddr) && !seen.has(keyNameOnly)) {
        seen.add(keyWithAddr);
        seen.add(keyNameOnly);
        uniqueBranches.push(b);
      }
    });

    return {
      ...chain,
      branches: uniqueBranches,
    };
  });
}

export function useSupermarketStore() {
  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
    } catch {
      return false;
    }
  });

  // Load initial chains from LocalStorage with automatic deduplication
  const [chains, setChains] = useState<SupermarketChain[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CHAINS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanChainsData(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse chains from localStorage', e);
    }
    return cleanChainsData(INITIAL_CHAINS);
  });

  // Load initial settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.websiteName) {
          // Remove "في مصر" from title if previously stored
          const cleanedName = parsed.websiteName.replace(/\s*في مصر\s*$/, '').trim();
          return {
            ...parsed,
            websiteName: cleanedName || 'دليل سلاسل السوبر ماركت',
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    return INITIAL_SETTINGS;
  });

  // Current view selection
  const [selectedChainId, setSelectedChainId] = useState<string>('carrefour-hyper');
  const [activeView, setActiveView] = useState<'chains' | 'custom_section'>('chains');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Search & Filter & Sort
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<'alphabetical' | 'alphabetical_desc' | 'branches_count' | 'anniversary_near'>('branches_count');

  // Lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string>(DEFAULT_TIMELINE_COVER);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save chains on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(chains));
    } catch (e) {
      console.error('Failed to save chains to localStorage', e);
    }
  }, [chains]);

  // Real-time Firestore synchronization for Supermarket Chains
  useEffect(() => {
    let isInitial = true;
    const unsubscribe = subscribeToChains(
      (remoteChains) => {
        if (remoteChains && remoteChains.length > 0) {
          setChains(cleanChainsData(remoteChains));
          if (isInitial) {
            showToast('success', 'متصل بالسحابة (Firebase) ⚡', 'يتم مزامنة وتحديث الفروع والسلاسل لحظياً.');
          }
        } else if (isInitial && remoteChains.length === 0) {
          // Initialize empty Firestore with default chains
          syncAllChainsToFirestore(INITIAL_CHAINS).catch((err) => {
            console.warn('Initial sync to Firestore notice:', err);
          });
        }
        isInitial = false;
      },
      (error) => {
        console.warn('Firestore real-time connection status:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [showToast]);

  // Real-time Firestore synchronization for Settings
  useEffect(() => {
    const unsubscribe = subscribeToSettings((remoteSettings) => {
      if (remoteSettings && remoteSettings.websiteName) {
        setSettings(remoteSettings);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save settings on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Selected chain helper
  const selectedChain = useMemo(() => {
    return chains.find((c) => c.id === selectedChainId) || chains[0] || null;
  }, [chains, selectedChainId]);

  // Selected custom section helper
  const selectedSection = useMemo(() => {
    return settings.customSections.find((s) => s.id === selectedSectionId) || null;
  }, [settings.customSections, selectedSectionId]);

  // Stats
  const totalChains = chains.length;
  const totalBranches = useMemo(() => {
    return chains.reduce((acc, c) => acc + (c.branches ? c.branches.length : 0), 0);
  }, [chains]);

  // Filtered and sorted chains
  const filteredChains = useMemo(() => {
    let list = chains.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.hotline.includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.branches.some((b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || (b.city && b.city.toLowerCase().includes(q)))
      );
    });

    // Current month for anniversary proximity
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12

    return list.sort((a, b) => {
      if (sortMode === 'alphabetical') {
        return a.name.localeCompare(b.name, 'ar');
      }
      if (sortMode === 'alphabetical_desc') {
        return b.name.localeCompare(a.name, 'ar');
      }
      if (sortMode === 'branches_count') {
        return (b.branches?.length || 0) - (a.branches?.length || 0);
      }
      if (sortMode === 'anniversary_near') {
        const getDistance = (m?: number) => {
          if (!m) return 99;
          const diff = m - currentMonth;
          return diff >= 0 ? diff : diff + 12;
        };
        return getDistance(a.anniversaryMonth) - getDistance(b.anniversaryMonth);
      }
      return 0;
    });
  }, [chains, searchQuery, sortMode]);

  // Chain Operations
  const addChain = useCallback((newChainData: Omit<SupermarketChain, 'id' | 'branches'>) => {
    const id = `chain-${Date.now()}`;
    const newChain: SupermarketChain = {
      ...newChainData,
      id,
      branches: [],
    };
    setChains((prev) => [newChain, ...prev]);
    setSelectedChainId(id);
    setActiveView('chains');
    saveChainToFirestore(newChain).catch((err) => console.warn('Firestore addChain:', err));
    showToast('success', 'تمت إضافة السلسلة بنجاح!', `أهلاً بـ ${newChain.name} في الدليل`);
  }, [showToast]);

  const updateChain = useCallback((id: string, updates: Partial<SupermarketChain>) => {
    setChains((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          saveChainToFirestore(updated).catch((err) => console.warn('Firestore updateChain:', err));
          return updated;
        }
        return c;
      });
      return next;
    });
    showToast('success', 'تم تحديث بيانات السلسلة بنجاح');
  }, [showToast]);

  const deleteChain = useCallback((id: string) => {
    const target = chains.find((c) => c.id === id);
    setChains((prev) => prev.filter((c) => c.id !== id));
    deleteChainFromFirestore(id).catch((err) => console.warn('Firestore deleteChain:', err));
    if (selectedChainId === id) {
      const remaining = chains.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setSelectedChainId(remaining[0].id);
      }
    }
    showToast('info', 'تم حذف السلسلة', `تمت إزالة ${target?.name || ''} بنجاح`);
  }, [chains, selectedChainId, showToast]);

  // Branch Operations
  const addBranch = useCallback((chainId: string, branchData: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    setChains((prev) =>
      prev.map((c) => {
        if (c.id === chainId) {
          const updated = {
            ...c,
            branches: [newBranch, ...c.branches],
          };
          saveChainToFirestore(updated).catch((err) => console.warn('Firestore addBranch:', err));
          return updated;
        }
        return c;
      })
    );
    showToast('success', 'تم إضافة الفرع بنجاح!', `تمت إضافة فرع ${newBranch.name}`);
  }, [showToast]);

  const bulkAddBranches = useCallback(
    (chainId: string, newBranches: Branch[]) => {
      if (!newBranches || newBranches.length === 0) return;
      const targetChain = chains.find((c) => c.id === chainId);
      if (!targetChain) return;

      const existing = targetChain.branches || [];
      const filtered = deduplicateBranches(newBranches, existing);

      if (filtered.length === 0) {
        showToast(
          'info',
          'لم تتم إضافة أي فرع جديد',
          'جميع الفروع الموجودة في الملف مكررة ومسجلة بالفعل مسبقاً.'
        );
        return;
      }

      setChains((prev) =>
        prev.map((c) => {
          if (c.id === chainId) {
            const updated = {
              ...c,
              branches: [...filtered, ...c.branches],
            };
            saveChainToFirestore(updated).catch((err) => console.warn('Firestore bulkAddBranches:', err));
            return updated;
          }
          return c;
        })
      );

      const duplicatesCount = newBranches.length - filtered.length;
      showToast(
        'success',
        `تم استيراد ${filtered.length} فرع بنجاح! 📊`,
        duplicatesCount > 0
          ? `تم استبعاد وتصفية ${duplicatesCount} فرع مكرر تلقائياً لعدم تكرار أي فرع مسجل.`
          : `تمت إضافة كافة الفروع إلى ${targetChain.name}`
      );
    },
    [chains, showToast]
  );

  const updateBranch = useCallback((chainId: string, branchId: string, updates: Partial<Branch>) => {
    setChains((prev) =>
      prev.map((c) => {
        if (c.id === chainId) {
          const updated = {
            ...c,
            branches: c.branches.map((b) => (b.id === branchId ? { ...b, ...updates } : b)),
          };
          saveChainToFirestore(updated).catch((err) => console.warn('Firestore updateBranch:', err));
          return updated;
        }
        return c;
      })
    );
    showToast('success', 'تم تحديث بيانات الفرع');
  }, [showToast]);

  const deleteBranch = useCallback((chainId: string, branchId: string) => {
    setChains((prev) =>
      prev.map((c) => {
        if (c.id === chainId) {
          const updated = {
            ...c,
            branches: c.branches.filter((b) => b.id !== branchId),
          };
          saveChainToFirestore(updated).catch((err) => console.warn('Firestore deleteBranch:', err));
          return updated;
        }
        return c;
      })
    );
    showToast('info', 'تم حذف الفرع');
  }, [showToast]);

  // Settings & Custom Sections Operations
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettingsToFirestore(next).catch((err) => console.warn('Firestore updateSettings:', err));
      return next;
    });
    showToast('success', 'تم حفظ الإعدادات بنجاح');
  }, [showToast]);

  const addCustomSection = useCallback((title: string, description?: string, icon?: string) => {
    const newSection: CustomSidebarSection = {
      id: `section-${Date.now()}`,
      title,
      description,
      icon: icon || 'FolderPlus',
      buttons: [],
    };
    setSettings((prev) => ({
      ...prev,
      customSections: [...prev.customSections, newSection],
    }));
    showToast('success', 'تمت إضافة القسم الجديد للقائمة الجانبية');
  }, [showToast]);

  const deleteCustomSection = useCallback((sectionId: string) => {
    setSettings((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((s) => s.id !== sectionId),
    }));
    if (selectedSectionId === sectionId) {
      setActiveView('chains');
      setSelectedSectionId(null);
    }
    showToast('info', 'تم حذف القسم من القائمة الجانبية');
  }, [selectedSectionId, showToast]);

  const addCustomSubButton = useCallback((sectionId: string, buttonData: Omit<CustomSubButton, 'id'>) => {
    const newBtn: CustomSubButton = {
      ...buttonData,
      id: `btn-${Date.now()}`,
    };
    setSettings((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, buttons: [...sec.buttons, newBtn] }
          : sec
      ),
    }));
    showToast('success', 'تمت إضافة الزر الفرعي بنجاح');
  }, [showToast]);

  const deleteCustomSubButton = useCallback((sectionId: string, buttonId: string) => {
    setSettings((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, buttons: sec.buttons.filter((b) => b.id !== buttonId) }
          : sec
      ),
    }));
    showToast('info', 'تم حذف الزر الفرعي');
  }, [showToast]);

  // Full Database Backup & Restore
  const exportDatabaseBackup = useCallback(() => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      settings,
      chains,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_سلاسل_مصر_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'تم تحميل النسخة الاحتياطية بنجاح 💾');
  }, [chains, settings, showToast]);

  const importDatabaseBackup = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.chains)) {
        setChains(parsed.chains);
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        showToast('success', 'تمت استعادة البيانات والنسخة الاحتياطية بنجاح!');
        return true;
      } else {
        showToast('error', 'الملف المحدد غير صالح كنسخة احتياطية للدليل.');
        return false;
      }
    } catch (e) {
      showToast('error', 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      return false;
    }
  }, [showToast]);

  const resetToDefaultData = useCallback(() => {
    setChains(INITIAL_CHAINS);
    setSettings(INITIAL_SETTINGS);
    setSelectedChainId('carrefour-hyper');
    setActiveView('chains');
    localStorage.removeItem(STORAGE_KEY_CHAINS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    showToast('info', 'تمت إعادة ضبط البيانات إلى القيم الافتراضية الأصلية.');
  }, [showToast]);

  const openLightbox = useCallback((imgUrl: string) => {
    setLightboxImage(imgUrl);
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const loginAsAdmin = useCallback((password: string): boolean => {
    // Accepts 'admin' or non-empty administrative key
    if (password.trim().toLowerCase() === 'admin' || password.trim() === '123456') {
      setIsAdmin(true);
      try {
        localStorage.setItem(STORAGE_KEY_ADMIN, 'true');
      } catch (e) {
        // ignore
      }
      showToast('success', 'تم تفعيل صلاحيات المسؤول 🛡️', 'يمكنك الآن إضافة وتعديل وحذف الفروع والسلاسل وتغيير الغلاف.');
      return true;
    }
    return false;
  }, [showToast]);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
    } catch (e) {
      // ignore
    }
    showToast('info', 'تم تسجيل خروج المسؤول', 'تم تحويل الواجهة لوضع العرض العام للزوار.');
  }, [showToast]);

  const logout = useCallback(() => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN);
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    showToast('info', 'تم تسجيل الخروج بنجاح', 'تم إنهاء الجلسة الحالية بنجاح.');
  }, [showToast]);

  return {
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
  };
}
