// Firebase Authentication & Cloud Sync Engine for Thirukkural AI Companion
(() => {
  const config = window.THIRUKURAL_FIREBASE_CONFIG;
  const isConfigValid = config && ["apiKey", "authDomain", "projectId", "appId"].every(
    k => typeof config[k] === "string" && config[k].trim() !== "" && !config[k].startsWith("YOUR_")
  );

  let auth = null;
  let firestore = null;
  let currentUser = null;
  let isReady = false;

  function dispatchAppEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(`thirukural:${name}`, { detail }));
  }

  function handleAuthError(action, error) {
    console.error(`Firebase ${action} failed:`, error);
    dispatchAppEvent("cloud-error", {
      action,
      message: error.message,
      code: error.code || ""
    });
  }

  function initFallbackState(message) {
    window.thiruKuralCloud = Object.freeze({
      configured: false,
      getState: () => ({ configured: false, ready: true, user: null, message }),
      signIn: async () => { throw new Error(message); },
      signInWithEmail: async () => { throw new Error(message); },
      createAccount: async () => { throw new Error(message); },
      signOut: async () => { throw new Error(message); },
      saveHistory: async () => { throw new Error(message); },
      refreshHistory: async () => [],
      clearHistory: async () => { throw new Error(message); }
    });
    dispatchAppEvent("auth-state", { configured: false, ready: true, user: null });
  }

  if (!isConfigValid) {
    initFallbackState("Firebase configuration is missing or incomplete in firebase-config.js.");
    return;
  }

  if (!window.firebase || !window.firebase.initializeApp || !window.firebase.auth || !window.firebase.firestore) {
    initFallbackState("The Firebase SDK did not load. Check your network connection and reload.");
    return;
  }

  try {
    const app = window.firebase.apps.length > 0 ? window.firebase.apps[0] : window.firebase.initializeApp(config);
    auth = window.firebase.auth(app);
    firestore = window.firebase.firestore(app);
  } catch (err) {
    handleAuthError("initialization", err);
    initFallbackState("Firebase could not initialize. Check firebase-config.js.");
    return;
  }

  function getUserHistoryRef() {
    if (!currentUser) throw new Error("Sign in to access your Kural history.");
    return firestore.collection("users").doc(currentUser.uid).collection("history");
  }

  async function fetchUserHistory() {
    if (!currentUser) return [];
    try {
      const snap = await getUserHistoryRef().orderBy("createdAt", "desc").limit(100).get();
      const entries = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          query: d.query,
          kind: d.kind,
          kuralNumber: d.kuralNumber,
          chapterNumber: d.chapterNumber ?? null,
          language: d.language,
          createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : (d.createdAt || Date.now())
        };
      });
      dispatchAppEvent("history", { entries });
      return entries;
    } catch (err) {
      console.warn("Could not retrieve user history:", err);
      return [];
    }
  }

  window.thiruKuralCloud = Object.freeze({
    configured: true,
    getState: () => ({
      configured: true,
      ready: isReady,
      user: currentUser ? {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL
      } : null
    }),

    // Google Sign-In with instant Account Chooser (No password prompt if already logged in)
    async signIn() {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      
      // prompt: 'select_account' tells Google to display the list of active accounts on the device
      // Clicking the account logs in immediately with zero password prompt!
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      provider.addScope('profile');
      provider.addScope('email');

      try {
        auth.useDeviceLanguage();
      } catch (e) {}

      // Try popup first. If popup is blocked by browser or on mobile, fall back to redirect
      if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) {
        await auth.signInWithRedirect(provider);
      } else {
        try {
          await auth.signInWithPopup(provider);
        } catch (popupErr) {
          if (popupErr.code === "auth/popup-blocked" || popupErr.code === "auth/popup-closed-by-user") {
            await auth.signInWithRedirect(provider);
          } else {
            throw popupErr;
          }
        }
      }
    },

    async signInWithEmail(email, password) {
      await auth.signInWithEmailAndPassword(email, password);
    },

    async createAccount(email, password) {
      const res = await auth.createUserWithEmailAndPassword(email, password);
      try {
        await res.user.sendEmailVerification();
      } catch (e) {}
      return res;
    },

    async sendVerification() {
      if (!currentUser) throw new Error("Sign in to verify your email.");
      await currentUser.sendEmailVerification();
    },

    async sendPasswordReset(email) {
      await auth.sendPasswordResetEmail(email);
    },

    async signOut() {
      await auth.signOut();
    },

    async saveHistory(entry) {
      if (!currentUser) return;
      const cleanQ = String(entry.query || '').trim().slice(0, 500);
      if (!cleanQ || !Number.isInteger(entry.kuralNumber) || entry.kuralNumber < 1 || entry.kuralNumber > 1330) {
        return;
      }
      try {
        const ref = getUserHistoryRef();
        await ref.add({
          query: cleanQ,
          kind: entry.kind || 'kural',
          kuralNumber: entry.kuralNumber,
          chapterNumber: Number.isInteger(entry.chapterNumber) ? entry.chapterNumber : null,
          language: entry.language || 'ta',
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        return fetchUserHistory();
      } catch (err) {
        console.warn("Save history skipped or blocked:", err);
      }
    },

    async refreshHistory() {
      return fetchUserHistory();
    },

    async clearHistory() {
      if (!currentUser) return;
      try {
        const ref = getUserHistoryRef();
        const snap = await ref.get();
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = firestore.batch();
          snap.docs.slice(i, i + 400).forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
        dispatchAppEvent("history", { entries: [] });
      } catch (err) {
        console.warn("Clear history failed:", err);
      }
    }
  });

  // Local persistence for persisting Google login across sessions
  auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(e => handleAuthError("persistence setup", e));

  // Check for redirect result if coming back from redirect login
  auth.getRedirectResult().catch(e => handleAuthError("sign-in redirect", e));

  // Global Auth State Observer
  auth.onAuthStateChanged(async user => {
    currentUser = user;
    isReady = true;
    dispatchAppEvent("auth-state", {
      configured: true,
      ready: true,
      user: window.thiruKuralCloud.getState().user
    });

    if (!user) {
      dispatchAppEvent("history", { entries: [] });
      return;
    }

    try {
      await fetchUserHistory();
    } catch (err) {
      handleAuthError("history retrieval", err);
    }
  }, err => handleAuthError("authentication state", err));
})();
