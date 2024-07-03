"use client"

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios"
import { useAuth } from "@/app/lib/auth.js";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation.js";
import { db } from "../lib/firebaseConfig.js";
import Link from "next/link.js";

export default function YoutubeRegisterSuccess() {
  const [waiting, setWaiting] = useState(true)
  const user = useAuth()
  const router = useRouter()

  const getAccount = useCallback((params) => {
    const tmpParams = params || JSON.parse(localStorage.getItem('oauth2-test-params'))
    console.log("tmpParams", tmpParams)
    if (tmpParams && tmpParams['access_token']) {
      axios.get('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
        headers: { Authorization: `Bearer ${tmpParams['access_token']}` }
      })
        .then(res => {
          console.log("res in YoutubeLogin", res)
          const supporterId = res.data.items[0].id
          const ref = doc(db, `users/${user.id}`);
          axios.post(`${process.env.NEXT_PUBLIC_API_URL}/connectUserToSupporter`,
          { userId: user.id, supporterId }, {
            headers:{
              "Content-Type": "application/json"
            }
          }).then(_ => {
            updateDoc(ref, {supporterId})
            setWaiting(false)})
        })
    } else {
      console.log("failed2", tmpParams)
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      var fragmentString = location.hash.substring(1);
      var params = {};
      var regex = /([^&=]+)=([^&]*)/g, m;
      while (m = regex.exec(fragmentString)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }
      if (Object.keys(params).length > 0 && params['state']) {
        console.log("params['state']", params['state'])
        console.log("localStorage", localStorage.getItem('state'))
        if (params['state'] == localStorage.getItem('state')) {
          localStorage.setItem('oauth2-test-params', JSON.stringify(params) );
          getAccount(params)
        } else {
          console.log('State mismatch. Possible CSRF attack');
        }
      }
    }
  }, [user, getAccount])

  return (
    <div>
      {waiting == true && <div>loading...</div>}
      {waiting == false && 
      <div>
        <div>success</div>
        <a href={'/'} >
          Go Home
        </a>
      </div>
      }
    </div>
  )
}