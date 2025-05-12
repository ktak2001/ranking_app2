// components/YouTubeAuthProvider.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebaseConfig";

const YTContext = createContext({ linked:false, supporterId:"" });
export const YouTubeAuthProvider = ({ children }) => {
  const [state,setState] = useState({ linked:false, supporterId:"" });
  useEffect(()=>{
    const unsub = auth.onAuthStateChanged(u=>{
      if(!u) return setState({linked:false,supporterId:""});
      return onSnapshot(doc(db,"users",u.uid), snap=>{
        const d = snap.data()||{};
        setState({ linked: !!d.supporterId, supporterId: d.supporterId||""});
      });
    });
    return unsub;
  },[]);
  return <YTContext.Provider value={state}>{children}</YTContext.Provider>;
};
export const useYouTubeAuth = ()=> useContext(YTContext);
