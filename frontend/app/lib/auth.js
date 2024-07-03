"use client"

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth"
import { auth, db } from "./firebaseConfig"
import { onAuthStateChanged } from "firebase/auth";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const login = () => {
  const provider = new GoogleAuthProvider()
  console.log("login")
  return signInWithPopup(auth, provider)
}

export const logout = () => {
  return signOut(auth)
}

// export const registerChannel = () => {

// }

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState();

  useEffect(() => {
    console.log("inside useeffect")
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged")
      if (firebaseUser) {
        const ref = doc(db, `users/${firebaseUser.uid}`);
        const snap = await getDoc(ref);
        // console.log("get snap", snap)
        if (snap.exists()) {
          const appUser = snap.data();
          console.log("appUser1", appUser)
          setUser(appUser);
        } else {
          const appUser = {
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            supporterId: "",
          };
          console.log("appUser2", appUser)
          setDoc(ref, appUser).then(() => {
            setUser(appUser);
          });
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [])

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext)