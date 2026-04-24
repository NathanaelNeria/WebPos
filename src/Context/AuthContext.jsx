// src/Context/AuthContext.jsx
import { createContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../Services/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

export const AuthContext = createContext();

const STORAGE_KEY = "ACTIVE_GUDANG_OWNER";
const USER_STORAGE_KEY = "CURRENT_USER_DATA";

const normalizeRole = (role) =>
  Array.isArray(role) ? role : role ? [role] : [];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [gudangList, setGudangList] = useState([]);
  const [activeGudangId, setActiveGudangId] = useState(null);
  const [activeGudang, setActiveGudang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  /* ===============================
     GET USER DISPLAY NAME
  ================================ */
  const getUserDisplayName = useCallback((userData, firebaseUser) => {
    // Prioritaskan nama dari Firestore
    if (userData?.nama) return userData.nama;

    // Fallback ke displayName dari Firebase Auth
    if (firebaseUser?.displayName) return firebaseUser.displayName;

    // Fallback ke email (tanpa domain)
    if (firebaseUser?.email) return firebaseUser.email.split("@")[0];

    // Terakhir, unknown
    return "Unknown User";
  }, []);

  /* ===============================
     SET ACTIVE GUDANG
  ================================ */
  const setActiveGudangInternal = useCallback(
    (gudangId) => {
      console.log("🔄 setActiveGudang called with:", gudangId);

      if (!gudangId) {
        setActiveGudangId(null);
        setActiveGudang(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const found = gudangList.find((g) => g.id === gudangId);
      if (found) {
        console.log("✅ Setting active gudang:", found.nama);
        setActiveGudangId(gudangId);
        setActiveGudang(found);
        localStorage.setItem(STORAGE_KEY, gudangId);

        // Simpan active gudang ke user data juga
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            activeGudangId: gudangId,
            activeGudang: found,
          };
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem(
              USER_STORAGE_KEY,
              JSON.stringify({
                uid: updatedUser.uid,
                email: updatedUser.email,
                nama: updatedUser.nama,
                activeGudangId: gudangId,
              }),
            );
          } catch (e) {
            console.error("Error saving to localStorage:", e);
          }
        }
      }
    },
    [gudangList, currentUser],
  );

  /* ===============================
     LOAD GUDANG UNTUK OWNER
  ================================ */
  const loadAllGudangs = useCallback(async () => {
    try {
      const gudangSnapshot = await getDocs(collection(db, "gudang"));
      const allGudangs = gudangSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGudangList(allGudangs);
      return allGudangs;
    } catch (error) {
      console.error("Error loading all gudangs:", error);
      return [];
    }
  }, []);

  /* ===============================
     LOAD GUDANG UNTUK ADMIN/KASIR
  ================================ */
  const loadAssignedGudang = useCallback(async (gudangId) => {
    if (!gudangId) return null;

    try {
      const gudangDoc = await getDoc(doc(db, "gudang", gudangId));
      if (gudangDoc.exists()) {
        const gudangData = { id: gudangDoc.id, ...gudangDoc.data() };
        setGudangList([gudangData]);
        console.log("1 gudang:", gudangData);
        return gudangData;
      }
    } catch (error) {
      console.error("Error loading assigned gudang:", error);
    }
    return null;
  }, []);

  /* ===============================
     LOAD MULTIPLE GUDANG UNTUK KASIR
  ================================ */
  const loadMultipleGudangs = useCallback(async (gudangIds) => {
    if (!gudangIds || gudangIds.length === 0) return [];

    console.log("Loading multiple gudangs for IDs:", gudangIds);

    try {
      // Firestore only supports up to 10 in queries, so we need to chunk
      const chunks = [];
      for (let i = 0; i < gudangIds.length; i += 10) {
        chunks.push(gudangIds.slice(i, i + 10));
      }

      let allGudangs = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, "gudang"),
          where("__name__", "in", chunk),
        );
        const snapshot = await getDocs(q);
        console.log(
          "✅ loaded gudang:",
          snapshot.docs.map((d) => d.id),
        );
        const gudangs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        allGudangs = [...allGudangs, ...gudangs];
      }

      setGudangList(allGudangs);
      console.log("banyak gudang:", allGudangs);
      return allGudangs;
    } catch (error) {
      console.error("Error loading multiple gudangs:", error);
      return [];
    }
  }, []);

  /* ===============================
     TRY RESTORE FROM LOCALSTORAGE
  ================================ */
  const restoreFromLocalStorage = useCallback(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        console.log("📦 Restored user from localStorage:", parsed);
        return parsed;
      }
    } catch (e) {
      console.error("Error restoring from localStorage:", e);
    }
    return null;
  }, []);

  /* ===============================
     AUTH STATE LISTENER
  ================================ */
  useEffect(() => {
    let isMounted = true;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // console.log("👤 Auth state changed:", firebaseUser?.email);

      if (isMounted) setLoading(true);

      if (!firebaseUser) {
        if (isMounted) {
          setCurrentUser(null);
          setGudangList([]);
          setActiveGudangId(null);
          setActiveGudang(null);
          setLoading(false);
          setInitialized(true);

          // Clear storage
          localStorage.removeItem(USER_STORAGE_KEY);
          localStorage.removeItem(STORAGE_KEY);
        }
        return;
      }

      try {
        // 1. Get user data from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.error("User not found in database");
          if (isMounted) {
            await auth.signOut();
            setCurrentUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        const userData = userDoc.data();

        // 2. Check if user is active
        if (userData.isActive === false) {
          console.log("User is disabled, logging out...");
          if (isMounted) {
            await auth.signOut();
            setCurrentUser(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        // 3. Get user's display name
        const displayName = getUserDisplayName(userData, firebaseUser);

        // 4. Normalize role
        const role = normalizeRole(userData.role);

        // 5. Determine primary role
        let primaryRole = "unknown";
        if (role.includes("owner")) primaryRole = "owner";
        else if (role.includes("admin")) primaryRole = "admin";
        else if (role.includes("kasir")) primaryRole = "kasir";

        // 6. Try to restore from localStorage for continuity
        const storedUser = restoreFromLocalStorage();

        // 7. Build base user object
        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nama: displayName,
          displayName: displayName, // Untuk kompatibilitas
          role,
          primaryRole,
          isOwner: role.includes("owner"),
          isAdmin: role.includes("admin"),
          isKasir: role.includes("kasir"),
          gudangId: userData.gudangId || null,
          gudangNama: userData.gudangNama || null,
          kasirGudangIds: userData.kasirGudangIds || [],
          phone: userData.phone || null,
          isActive: userData.isActive !== false,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          photoURL: firebaseUser.photoURL || null,
          // Ambil activeGudangId dari localStorage jika ada
          activeGudangId: storedUser?.activeGudangId || null,
        };

        if (isMounted) {
          setCurrentUser(baseUser);
          console.log(
            "✅ User authenticated:",
            baseUser.email,
            "Nama:",
            baseUser.nama,
            "Role:",
            primaryRole,
          );
        }

        // ===============================
        // LOAD GUDANG (FINAL LOGIC)
        // ===============================
        let loadedGudangs = [];
        let activeGudangToSet = null;

        // 1️⃣ OWNER → SEMUA GUDANG
        if (baseUser.isOwner) {
          loadedGudangs = await loadAllGudangs();

          const savedGudangId =
            localStorage.getItem(STORAGE_KEY) || baseUser.activeGudangId;

          activeGudangToSet =
            loadedGudangs.find((g) => g.id === savedGudangId) ||
            loadedGudangs[0];
        }

        // 2️⃣ KARYAWAN (ADMIN + KASIR) → SELALU PAKAI kasirGudangIds
        else if (baseUser.kasirGudangIds?.length > 0) {
          loadedGudangs = await loadMultipleGudangs(baseUser.kasirGudangIds);

          const savedGudangId =
            localStorage.getItem(STORAGE_KEY) || baseUser.activeGudangId;

          activeGudangToSet =
            loadedGudangs.find((g) => g.id === savedGudangId) ||
            loadedGudangs[0];
        }

        // 3️⃣ FALLBACK (HARUSNYA HAMPIR TIDAK TERPAKAI)
        else if (baseUser.gudangId) {
          const gudangData = await loadAssignedGudang(baseUser.gudangId);
          if (gudangData) {
            loadedGudangs = [gudangData];
            activeGudangToSet = gudangData;
          }
        }

        if (isMounted) {
          setGudangList(loadedGudangs);

          if (activeGudangToSet) {
            setActiveGudangId(activeGudangToSet.id);
            setActiveGudang(activeGudangToSet);
            localStorage.setItem(STORAGE_KEY, activeGudangToSet.id);

            // Update user with active gudang
            setCurrentUser((prev) => ({
              ...prev,
              activeGudangId: activeGudangToSet.id,
              activeGudang: activeGudangToSet,
            }));

            // Save to localStorage
            try {
              localStorage.setItem(
                USER_STORAGE_KEY,
                JSON.stringify({
                  uid: baseUser.uid,
                  email: baseUser.email,
                  nama: baseUser.nama,
                  activeGudangId: activeGudangToSet.id,
                }),
              );
            } catch (e) {
              console.error("Error saving to localStorage:", e);
            }

            console.log("🎯 Active gudang set to:", activeGudangToSet.nama);
          }
        }
      } catch (error) {
        console.error("❌ Auth error:", error);
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [
    loadAllGudangs,
    loadAssignedGudang,
    loadMultipleGudangs,
    getUserDisplayName,
    restoreFromLocalStorage,
  ]);

  /* ===============================
     REFRESH GUDANG LIST
  ================================ */
  const refreshGudangList = useCallback(async () => {
    if (!currentUser) return;

    try {
      if (currentUser.isOwner) {
        const allGudangs = await loadAllGudangs();

        // Keep current active gudang if it still exists
        if (
          activeGudangId &&
          !allGudangs.some((g) => g.id === activeGudangId)
        ) {
          setActiveGudangId(null);
          setActiveGudang(null);
          localStorage.removeItem(STORAGE_KEY);

          // Update user
          setCurrentUser((prev) => ({
            ...prev,
            activeGudangId: null,
            activeGudang: null,
          }));
        }
      } else if (currentUser.isAdmin) {
        if (currentUser.gudangId) {
          const gudangData = await loadAssignedGudang(currentUser.gudangId);
          if (gudangData) {
            setGudangList([gudangData]);

            if (!activeGudangId || activeGudangId !== gudangData.id) {
              setActiveGudangId(gudangData.id);
              setActiveGudang(gudangData);
              localStorage.setItem(STORAGE_KEY, gudangData.id);
            }
          }
        }
      } else if (currentUser.isKasir) {
        const gudangIds = currentUser.kasirGudangIds || [];
        if (gudangIds.length > 0) {
          const loadedGudangs = await loadMultipleGudangs(gudangIds);

          // Check if current active gudang still exists
          if (
            activeGudangId &&
            !loadedGudangs.some((g) => g.id === activeGudangId)
          ) {
            if (loadedGudangs.length > 0) {
              const newActive = loadedGudangs[0];
              setActiveGudangId(newActive.id);
              setActiveGudang(newActive);
              localStorage.setItem(STORAGE_KEY, newActive.id);
            } else {
              setActiveGudangId(null);
              setActiveGudang(null);
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing gudangs:", error);
    }
  }, [
    currentUser,
    activeGudangId,
    loadAllGudangs,
    loadAssignedGudang,
    loadMultipleGudangs,
  ]);

  /* ===============================
     ENSURE GUDANG SELECTED
  ================================ */
  const ensureGudang = useCallback(() => {
    if (!currentUser) return false;

    // Owner: harus pilih gudang
    if (currentUser.isOwner) {
      if (!activeGudangId || !activeGudang) {
        return false;
      }
      return true;
    }

    // Admin: harus punya gudang assigned
    if (currentUser.isAdmin) {
      if (!currentUser.gudangId || !activeGudangId) {
        return false;
      }
      return true;
    }

    // Kasir: harus punya minimal 1 gudang
    if (currentUser.isKasir) {
      const kasirGudangs = currentUser.kasirGudangIds || [];
      if (kasirGudangs.length === 0 || !activeGudangId) {
        return false;
      }
      return true;
    }

    return false;
  }, [currentUser, activeGudangId, activeGudang]);

  /* ===============================
     LOGOUT
  ================================ */
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  // Value context
  const value = {
    // State
    currentUser,
    gudangList,
    activeGudang,
    activeGudangId,
    loading,
    initialized,

    // Actions
    setActiveGudangId: setActiveGudangInternal,
    refreshGudangList,
    logout,
    ensureGudang,

    // Helpers
    isOwner: currentUser?.isOwner || false,
    isAdmin: currentUser?.isAdmin || false,
    isKasir: currentUser?.isKasir || false,
    userRole: currentUser?.role || [],
    userPrimaryRole: currentUser?.primaryRole || "unknown",
    userName: currentUser?.nama || currentUser?.displayName || "Unknown",
    userEmail: currentUser?.email || "",

    // Convenience getters
    gudangNama: activeGudang?.nama || null,
    gudangKode: activeGudang?.kode || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
