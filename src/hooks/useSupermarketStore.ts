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
const STORAGE_KEY_DELETED_CHAINS = 'egypt_supermarkets_deleted_chains_v2';
const STORAGE_KEY_DELETED_BRANCHES = 'egypt_supermarkets_deleted_branches_v2';

function getDeletedChainIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_CHAINS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    // ignore
  }
  return new Set();
}

function saveDeletedChainId(id: string) {
  try {
    const set = getDeletedChainIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED_CHAINS, JSON.stringify(Array.from(set)));
  } catch (e) {
    // ignore
  }
}

function unmarkDeletedChainId(id: string) {
  try {
    const set = getDeletedChainIds();
    set.delete(id);
    localStorage.setItem(STORAGE_KEY_DELETED_CHAINS, JSON.stringify(Array.from(set)));
  } catch (e) {
    // ignore
  }
}

function getDeletedBranchKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_BRANCHES);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    // ignore
  }
  return new Set();
}

function saveDeletedBranchKeys(...keys: (string | undefined)[]) {
  try {
    const set = getDeletedBranchKeys();
    keys.forEach((k) => {
      if (k && k.trim()) set.add(k.trim());
    });
    localStorage.setItem(STORAGE_KEY_DELETED_BRANCHES, JSON.stringify(Array.from(set)));
  } catch (e) {
    // ignore
  }
}

function unmarkDeletedBranchKeys(...keys: (string | undefined)[]) {
  try {
    const set = getDeletedBranchKeys();
    keys.forEach((k) => {
      if (k && k.trim()) set.delete(k.trim());
    });
    localStorage.setItem(STORAGE_KEY_DELETED_BRANCHES, JSON.stringify(Array.from(set)));
  } catch (e) {
    // ignore
  }
}

// Helper to clean and deduplicate branches across all chains (strictly respects deletions)
function cleanChainsData(rawChains: SupermarketChain[]): SupermarketChain[] {
  const deletedChains = getDeletedChainIds();
  const deletedBranches = getDeletedBranchKeys();

  return rawChains
    .filter((chain) => !deletedChains.has(chain.id))
    .map((chain) => {
      const seen = new Set<string>();
      const uniqueBranches: Branch[] = [];

      (chain.branches || []).forEach((b) => {
        const key = normalizeBranchKey(b.name, b.address);
        if (deletedBranches.has(key) || (b.id && deletedBranches.has(b.id))) {
          return; // Deleted branch: NEVER restore!
        }
        if (!seen.has(key)) {
          seen.add(key);
          uniqueBranches.push(b);
        }
      });

      return {
        ...chain,
        branches: uniqueBranches,
      };
    });
}

// Merges local chains with remote chains without ever resurrecting deleted items
function mergeChainsData(localChains: SupermarketChain[], remoteChains: SupermarketChain[]): SupermarketChain[] {
  const deletedChains = getDeletedChainIds();
  const deletedBranches = getDeletedBranchKeys();

  const filteredRemote = (remoteChains || []).filter((rc) => !deletedChains.has(rc.id));
  const filteredLocal = (localChains || []).filter((lc) => !deletedChains.has(lc.id));

  if (filteredRemote.length === 0 && filteredLocal.length === 0) return [];
  if (filteredRemote.length === 0) return cleanChainsData(filteredLocal);
  if (filteredLocal.length === 0) return cleanChainsData(filteredRemote);

  const chainMap = new Map<string, SupermarketChain>();

  // 1. Put local chains
  filteredLocal.forEach((lc) => {
    chainMap.set(lc.id, lc);
  });

  // 2. Merge with remote chains
  filteredRemote.forEach((rc) => {
    const local = chainMap.get(rc.id);
    if (!local) {
      chainMap.set(rc.id, rc);
    } else {
      const branchMap = new Map<string, Branch>();

      // Remote branches (filter out deleted)
      (rc.branches || []).forEach((b) => {
        const key = normalizeBranchKey(b.name, b.address);
        if (deletedBranches.has(key) || (b.id && deletedBranches.has(b.id))) {
          return; // Do not restore deleted branch
        }
        branchMap.set(key, b);
      });

      // Local branches (filter out deleted)
      (local.branches || []).forEach((b) => {
        const key = normalizeBranchKey(b.name, b.address);
        if (deletedBranches.has(key) || (b.id && deletedBranches.has(b.id))) {
          return; // Do not restore deleted branch
        }
        const existing = branchMap.get(key);
        branchMap.set(key, existing ? { ...existing, ...b } : b);
      });

      chainMap.set(rc.id, {
        ...rc,
        ...local,
        branches: Array.from(branchMap.values()),
      });
    }
  });

  return cleanChainsData(Array.from(chainMap.values()));
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
          setChains((currentLocalChains) => {
            const merged = mergeChainsData(currentLocalChains, remoteChains);
            // Ensure any locally added branches not yet in remote Firestore are persisted to Firestore
            merged.forEach((mChain) => {
              const rChain = remoteChains.find((r) => r.id === mChain.id);
              if (
                mChain.branches &&
                (!rChain || !rChain.branches || mChain.branches.length > rChain.branches.length)
              ) {
                saveChainToFirestore(mChain).catch((err) =>
                  console.warn('Auto-syncing preserved branches to Firestore:', err)
                );
              }
            });
            return merged;
          });
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
  const addChain = useCallback(async (newChainData: Omit<SupermarketChain, 'id' | 'branches'>) => {
    const id = `chain-${Date.now()}`;
    const newChain: SupermarketChain = {
      ...newChainData,
      id,
      branches: [],
    };
    setChains((prev) => {
      const next = [newChain, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chains to localStorage', e);
      }
      return next;
    });
    setSelectedChainId(id);
    setActiveView('chains');
    try {
      await saveChainToFirestore(newChain);
    } catch (err) {
      console.warn('Firestore addChain error:', err);
    }
    showToast('success', 'تمت إضافة السلسلة بنجاح!', `أهلاً بـ ${newChain.name} في الدليل`);
  }, [showToast]);

  const updateChain = useCallback(async (id: string, updates: Partial<SupermarketChain>) => {
    let chainToSave: SupermarketChain | null = null;
    setChains((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          chainToSave = updated;
          return updated;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chains to localStorage', e);
      }
      return next;
    });
    if (chainToSave) {
      try {
        await saveChainToFirestore(chainToSave);
      } catch (err) {
        console.warn('Firestore updateChain error:', err);
      }
    }
    showToast('success', 'تم تحديث بيانات السلسلة بنجاح');
  }, [showToast]);

  const deleteChain = useCallback(async (id: string) => {
    saveDeletedChainId(id);
    let targetName = '';
    setChains((prev) => {
      const target = prev.find((c) => c.id === id);
      targetName = target?.name || '';
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chains to localStorage', e);
      }
      return next;
    });
    try {
      await deleteChainFromFirestore(id);
    } catch (err) {
      console.warn('Firestore deleteChain error:', err);
    }
    if (selectedChainId === id) {
      setChains((current) => {
        if (current.length > 0) {
          setSelectedChainId(current[0].id);
        }
        return current;
      });
    }
    showToast('info', 'تم حذف السلسلة نهائياً', `تمت إزالة ${targetName} بنجاح ولن يتم استرجاعها.`);
  }, [selectedChainId, showToast]);

  // Branch Operations
  const addBranch = useCallback(async (chainId: string, branchData: Omit<Branch, 'id'>) => {
    const branchKey = normalizeBranchKey(branchData.name, branchData.address);
    unmarkDeletedBranchKeys(branchKey);

    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    unmarkDeletedBranchKeys(newBranch.id);

    let chainToSave: SupermarketChain | null = null;
    setChains((prev) => {
      const next = prev.map((c) => {
        if (c.id === chainId) {
          const currentBranches = c.branches || [];
          const updatedBranches = deduplicateBranches([newBranch, ...currentBranches]);
          const updated = {
            ...c,
            branches: updatedBranches,
          };
          chainToSave = updated;
          return updated;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chains to localStorage', e);
      }
      return next;
    });
    if (chainToSave) {
      try {
        await saveChainToFirestore(chainToSave);
      } catch (err) {
        console.warn('Firestore addBranch error:', err);
      }
    }
    showToast('success', 'تم إضافة الفرع بنجاح!', `تمت إضافة فرع ${newBranch.name}`);
  }, [showToast]);

  const bulkAddBranches = useCallback(
    async (chainId: string, newBranches: Branch[]) => {
      if (!newBranches || newBranches.length === 0) return;

      newBranches.forEach((b) => {
        unmarkDeletedBranchKeys(normalizeBranchKey(b.name, b.address), b.id);
      });

      let duplicatesCount = 0;
      let addedCount = 0;
      let targetChainName = '';
      let chainToSave: SupermarketChain | null = null;

      setChains((prev) => {
        const target = prev.find((c) => c.id === chainId);
        if (!target) return prev;
        targetChainName = target.name;

        const existing = target.branches || [];
        const filtered = deduplicateBranches(newBranches, existing);

        if (filtered.length === 0) {
          return prev;
        }

        addedCount = filtered.length;
        duplicatesCount = newBranches.length - filtered.length;

        const updatedBranches = deduplicateBranches([...filtered, ...existing]);
        const updated = {
          ...target,
          branches: updatedBranches,
        };
        chainToSave = updated;

        const next = prev.map((c) => (c.id === chainId ? updated : c));

        try {
          localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save chains to localStorage', e);
        }

        return next;
      });

      if (addedCount === 0) {
        showToast(
          'info',
          'لم تتم إضافة أي فرع جديد',
          'جميع الفروع الموجودة في الملف مكررة ومسجلة بالفعل مسبقاً.'
        );
        return;
      }

      if (chainToSave) {
        try {
          await saveChainToFirestore(chainToSave);
        } catch (err) {
          console.warn('Firestore bulkAddBranches error:', err);
        }
      }

      showToast(
        'success',
        `تم استيراد ${addedCount} فرع بنجاح! 📊`,
        duplicatesCount > 0
          ? `تم استبعاد وتصفية ${duplicatesCount} فرع مكرر تلقائياً لعدم تكرار أي فرع مسجل.`
          : `تمت إضافة كافة الفروع إلى ${targetChainName}`
      );
    },
    [showToast]
  );

  const updateBranch = useCallback(async (chainId: string, branchId: string, updates: Partial<Branch>) => {
    let chainToSave: SupermarketChain | null = null;
    setChains((prev) => {
      const next = prev.map((c) => {
        if (c.id === chainId) {
          const updated = {
            ...c,
            branches: c.branches.map((b) => (b.id === branchId ? { ...b, ...updates } : b)),
          };
          chainToSave = updated;
          return updated;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chains to localStorage', e);
      }
      return next;
    });
    if (chainToSave) {
      try {
        await saveChainToFirestore(chainToSave);
      } catch (err) {
        console.warn('Firestore updateBranch error:', err);
      }
    }
    showToast('success', 'تم تحديث بيانات الفرع');
  }, [showToast]);

  const deleteBranch = useCallback(async (chainId: string, branchId: string) => {
    let chainToSave: SupermarketChain | null = null;
    let deletedBranchName = '';

    setChains((prev) => {
      const next = prev.map((c) => {
        if (c.id === chainId) {
          const targetBranch = c.branches.find((b) => b.id === branchId);
          if (targetBranch) {
            deletedBranchName = targetBranch.name;
            const branchKey = normalizeBranchKey(targetBranch.name, targetBranch.address);
            saveDeletedBranchKeys(branchKey, branchId, targetBranch.id);
          } else {
            saveDeletedBranchKeys(branchId);
          }

          const updatedBranches = c.branches.filter((b) => b.id !== branchId);
          const updated = {
            ...c,
            branches: updatedBranches,
          };
          chainToSave = updated;
          return updated;
        }
        return c;
      });
      try {
        localStorage.setItem(STORAGE_KEY_CHAINS, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chains to localStorage', e);
      }
      return next;
    });

    if (chainToSave) {
      try {
        await saveChainToFirestore(chainToSave);
      } catch (err) {
        console.warn('Firestore deleteBranch error:', err);
      }
    }
    showToast('info', 'تم حذف الفرع نهائياً', deletedBranchName ? `تم حذف فرع ${deletedBranchName} ولن يتم استرجاعه.` : undefined);
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

  const addCustomSection = useCallback(async (title: string, description?: string, icon?: string) => {
    const newSection: CustomSidebarSection = {
      id: `section-${Date.now()}`,
      title,
      description,
      icon: icon || 'FolderPlus',
      buttons: [],
    };
    let nextSettings: AppSettings | null = null;
    setSettings((prev) => {
      const next = {
        ...prev,
        customSections: [...prev.customSections, newSection],
      };
      nextSettings = next;
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
    if (nextSettings) {
      try {
        await saveSettingsToFirestore(nextSettings);
      } catch (err) {
        console.warn('Firestore addCustomSection error:', err);
      }
    }
    showToast('success', 'تمت إضافة القسم الجديد للقائمة الجانبية');
  }, [showToast]);

  const deleteCustomSection = useCallback(async (sectionId: string) => {
    let nextSettings: AppSettings | null = null;
    setSettings((prev) => {
      const next = {
        ...prev,
        customSections: prev.customSections.filter((s) => s.id !== sectionId),
      };
      nextSettings = next;
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
    if (selectedSectionId === sectionId) {
      setActiveView('chains');
      setSelectedSectionId(null);
    }
    if (nextSettings) {
      try {
        await saveSettingsToFirestore(nextSettings);
      } catch (err) {
        console.warn('Firestore deleteCustomSection error:', err);
      }
    }
    showToast('info', 'تم حذف القسم نهائياً', 'تم حذف القسم ولن يتم استرجاعه.');
  }, [selectedSectionId, showToast]);

  const addCustomSubButton = useCallback(async (sectionId: string, buttonData: Omit<CustomSubButton, 'id'>) => {
    const newBtn: CustomSubButton = {
      ...buttonData,
      id: `btn-${Date.now()}`,
    };
    let nextSettings: AppSettings | null = null;
    setSettings((prev) => {
      const next = {
        ...prev,
        customSections: prev.customSections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, buttons: [...sec.buttons, newBtn] }
            : sec
        ),
      };
      nextSettings = next;
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
    if (nextSettings) {
      try {
        await saveSettingsToFirestore(nextSettings);
      } catch (err) {
        console.warn('Firestore addCustomSubButton error:', err);
      }
    }
    showToast('success', 'تمت إضافة الزر الفرعي بنجاح');
  }, [showToast]);

  const deleteCustomSubButton = useCallback(async (sectionId: string, buttonId: string) => {
    let nextSettings: AppSettings | null = null;
    setSettings((prev) => {
      const next = {
        ...prev,
        customSections: prev.customSections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, buttons: sec.buttons.filter((b) => b.id !== buttonId) }
            : sec
        ),
      };
      nextSettings = next;
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
    if (nextSettings) {
      try {
        await saveSettingsToFirestore(nextSettings);
      } catch (err) {
        console.warn('Firestore deleteCustomSubButton error:', err);
      }
    }
    showToast('info', 'تم حذف الزر الفرعي نهائياً');
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
    localStorage.removeItem(STORAGE_KEY_DELETED_CHAINS);
    localStorage.removeItem(STORAGE_KEY_DELETED_BRANCHES);
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

  const syncAllToFirebase = useCallback(async () => {
    try {
      showToast('info', 'جاري المزامنة مع Firebase ☁️', 'يتم رفع كافة السلاسل والفروع إلى قاعدة البيانات.');
      const result = await syncAllChainsToFirestore(chains);
      if (result.failed > 0 && result.success === 0) {
        showToast(
          'error',
          'تعذرت المزامنة - تحقق من قواعد Firebase',
          'يرجى فتح لوحة Firebase Console > Firestore Database > Rules والتأكد من السماح بالقراءة والكتابة: allow read, write: if true;'
        );
      } else {
        showToast(
          'success',
          `تمت المزامنة السحابية بنجاح! (${result.success} سلسلة) ⚡`,
          'البيانات الآن منشورة في Firebase وتظهر لحظياً لجميع المستخدمين والزوار.'
        );
      }
    } catch (err: any) {
      showToast('error', 'خطأ أثناء المزامنة السحابية', err?.message || 'تحقق من اتصال الإنترنت وقواعد Firebase.');
    }
  }, [chains, showToast]);

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
    syncAllToFirebase,
  };
}
