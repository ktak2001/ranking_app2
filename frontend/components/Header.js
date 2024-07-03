"use client"; // This makes the component a client component

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, login, logout } from "@/app/lib/auth";
import YoutubeLogin from "./YoutubeLogin";
import Link from "next/link";
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import styles from './Header.module.css'; // Import the CSS module
import { db } from "@/app/lib/firebaseConfig.js";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export default function Header() {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  // Add logging in your Next.js application to track issues
  // console.log('Environment Variables:', process.env);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  useEffect(() => {
    const handleRouteChange = () => {
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    };

    // Simulate route change handling
    handleRouteChange();
  }, [pathname]);

  const fetchSuggestions = useCallback(async (queryString) => {
    if (queryString.length === 0) {
      setSuggestions([]);
      return;
    }

    const q = query(
      collection(db, "supporters"),
      where("supporterName", ">=", queryString),
      where("supporterName", "<=", queryString + "\uf8ff"),
      limit(15)
    );
    const querySnapshot = await getDocs(q);
    const suggestion_list = querySnapshot.docs.map(doc => {
      const supporterData = doc.data();
      return {
        supporterCustomUrl: supporterData.supporterCustomUrl,
        supporterId: supporterData.supporterId,
        supporterName: supporterData.supporterName,
      }
    });
    setSuggestions(suggestion_list);
  }, []);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  };

  const debounceFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value === "") {
      setSuggestions([]);
    } else {
      debounceFetchSuggestions(value);
    }
    setShowSuggestions(true);
  };

  const handleSearchFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      router.refresh();
    } else {
      router.push("/");
    }
  };

  return (
    <div>
      <header className={`navbar navbar-expand-lg fixed-top ${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className="container-fluid">
          <a href="/" className="navbar-brand" onClick={handleHomeClick}>
            <button className="btn btn-outline-primary">Home</button>
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <form className="d-flex me-2 position-relative" role="search" ref={searchRef}>
                <input 
                  className="form-control me-2" 
                  type="search" 
                  placeholder="Search" 
                  aria-label="Search" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="list-group position-absolute" style={{ top: '100%', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <Link href={`/supporters/${suggestion.supporterId}`} className="text-muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
                          {suggestion.supporterName}
                        </Link>
                        <div className="text-muted" style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>
                          {suggestion.supporterCustomUrl}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
              {user == null && <li className="nav-item me-2"><button className="btn btn-outline-primary" onClick={login}>会員登録・ログイン</button></li>}
              {user && user.supporterId != "" && 
                <li className="nav-item me-2">
                  <Link href={`/supporters/${user.supporterId}`} className="btn btn-outline-primary">マイページ</Link>
                </li>
              }
              {user && (
                <li className="nav-item me-2">
                  <button className="btn btn-outline-primary" title="logout" onClick={logout}>ログアウト</button>
                </li>
              )}
              {user && user.supporterId == "" && <li className="nav-item me-2"><YoutubeLogin /></li>}
            </ul>          
          </div>
        </div>
      </header>
      <div className={styles.contentPadding}></div>
    </div>
  );
}

