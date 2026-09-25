import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Student auth store ────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token:       null,
      etudiant:    null,  // { id_etudiant, id_classe }
      isLoggedIn:  false,

      loginSuccess: (token, data) => set({
        token,
        etudiant:   { id_etudiant: data.id_etudiant, id_classe: data.id_classe },
        isLoggedIn: true
      }),

      logout: () => set({ token: null, etudiant: null, isLoggedIn: false }),

      getToken: () => get().token
    }),
    {
      name:    'fseg-student-auth',
      partialize: (s) => ({ token: s.token, etudiant: s.etudiant, isLoggedIn: s.isLoggedIn })
    }
  )
);

// ─── Admin auth store ──────────────────────────────────────────────────────
export const useAdminStore = create(
  persist(
    (set, get) => ({
      token:       null,
      admin:       null,  // { id, username, nom_complet }
      isLoggedIn:  false,

      loginSuccess: (token, admin) => set({ token, admin, isLoggedIn: true }),
      logout: () => set({ token: null, admin: null, isLoggedIn: false }),
      getToken: () => get().token
    }),
    {
      name:    'fseg-admin-auth',
      partialize: (s) => ({ token: s.token, admin: s.admin, isLoggedIn: s.isLoggedIn })
    }
  )
);
