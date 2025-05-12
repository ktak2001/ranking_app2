"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, login, logout } from "@/app/lib/auth";
import Link from "next/link";
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from "@/app/lib/firebaseConfig";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import styles from "./Header.module.css";
import './Header.buttons.css';
import { FaUserPlus } from 'react-icons/fa'
import YoutubeLogin from "./YoutubeLogin"
import YoutubeLoginButton from "./YoutubeLoginButton.js"

export default function Header() {
  const user      = useAuth();
  const router    = useRouter();
  const pathname  = usePathname();
  const [queryStr, setQueryStr] = useState("");
  const [suggest, setSuggest]   = useState([]);
  const [showSug, setShowSug]   = useState(false);
  const searchRef = useRef(null);

  /* ─── スクロール時の背景透明度 ─── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ─── 検索候補取得（FireStore prefix 検索） ─── */
  const fetchSuggest = useCallback(async (q) => {
    if (!q) return setSuggest([]);
    const qs = query(
      collection(db, "supporters"),
      where("supporterName", ">=", q),
      where("supporterName", "<=", q + "\uf8ff"),
      limit(10)
    );
    const snap = await getDocs(qs);
    setSuggest(
      snap.docs.map((d) => ({
        id:   d.id,
        name: d.data().supporterName
      }))
    );
  }, []);

  /* ─── デバウンス ─── */
  const debounce = (fn, ms=300) => {
    let t; return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args),ms); };
  };
  const debouncedFetch = useCallback(debounce(fetchSuggest, 250), [fetchSuggest]);

  /* ─── 検索入力ハンドラ ─── */
  const onSearch = (e) => {
    const v = e.target.value;
    setQueryStr(v);
    debouncedFetch(v);
    setShowSug(true);
  };

  /* ─── ルート遷移時は検索状態リセット ─── */
  useEffect(() => { setQueryStr(""); setSuggest([]); setShowSug(false); }, [pathname]);

  /* ─── 検索欄外クリックでサジェストを閉じる ─── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSug(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className={`navbar navbar-light fixed-top shadow-sm ${styles.header} ${scrolled ? styles.scrolled : ""} mb-5`}>
      <div className="container-fluid">

        {/* Brand */}
        <Link href="/" className="navbar-brand fw-semibold text-dark">
          OpenSuperchat
        </Link>

        {/* Search */}
        <form className="position-relative" ref={searchRef}>
          <input
            type="search"
            className="form-control"
            style={{ width: 260 }}
            placeholder="Supporter 検索"
            value={queryStr}
            onChange={onSearch}
            onFocus={() => suggest.length && setShowSug(true)}
          />
          {showSug && suggest.length > 0 && (
            <ul className="list-group position-absolute w-100" style={{ top: "calc(100% + .25rem)", maxHeight: 240, overflowY: "auto", zIndex: 2000 }}>
              {suggest.map((s) => (
                <Link
                  href={`/supporters/${s.id}`}
                  key={s.id}
                  className="list-group-item list-group-item-action small"
                >
                  {s.name}
                </Link>
              ))}
            </ul>
          )}
        </form>

        {/* Right side buttons */}
        <div className="d-flex align-items-center gap-2">

          {user == null && (
            <button className="btn-pill-blue" onClick={login}>
              無料ユーザー登録・ログイン
            </button>
          )}

          {user && user.supporterId == "" &&
            <div className="nav-item me-2">
              <YoutubeLoginButton />
            </div>
          }

          {user && user.supporterId && (
            <Link href={`/supporters/${user.supporterId}`} className="btn-pill-blue text-decoration-none">
              マイページ
            </Link>
          )}

          {user && (
            <button className="btn-pill-blue" onClick={logout}>
              ログアウト
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
