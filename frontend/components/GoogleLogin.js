"use client"

import { useAuth } from "@/app/lib/auth.js";
import { login, logout } from "@/app/lib/auth.js";
import { useState } from "react";

export default function GoogleLogin() {
  const user = useAuth()
  const [waiting, setWaiting] = useState(false)

  const signIn = () => {
    setWaiting(true)
    login()
      .catch((error) => {
        console.error(error?.code)
      })
      .finally(() => {
        setWaiting(false)
        console.log("user", user)
        console.log("waiting", waiting)
      })
  }
  return (
    <div>
      {user == null && !waiting && <button onClick={signIn} >会員登録・ログイン</button>}
      {user && <button title="logout" onClick={logout} >ログアウト</button>}
    </div>
  )
}