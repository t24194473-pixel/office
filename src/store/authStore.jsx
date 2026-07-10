import { create } from 'zustand';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: true,

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          let profileData = null;
          if (docSnap.exists()) {
            profileData = docSnap.data();
          }

          set({ user: currentUser, profile: profileData, isLoading: false });
        } catch (err) {
          console.error("Error fetching user profile:", err);
          set({ user: currentUser, profile: null, isLoading: false });
        }
      } else {
        set({ user: null, profile: null, isLoading: false });
      }
    });

    return unsubscribe;
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, profile: null });
    } catch (error) {
      console.error("Logout error", error);
    }
  }
}));
