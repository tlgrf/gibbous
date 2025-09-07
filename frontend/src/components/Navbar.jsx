import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar(){
  const [user, setUser] = useState(null)
  const [csrf, setCsrf] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    async function loadMe(){
      try{
        const me = await fetch('/api/me', { credentials: 'include' }).then(r => r.json())
        setUser(me.user || null)
        setCsrf(me.csrf || null)
      }catch(_){}
    }
    loadMe()
  }, [])

  async function logout(){
    try{
      await fetch('/api/logout', {
        method:'POST',
        credentials:'include',
        headers: csrf ? { 'X-CSRF-Token': csrf } : {}
      })
    }finally{
      nav('/login', { replace: true })
    }
  }

  if (!user) return null

  return (
    <nav className="w-full border-b bg-white/90 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-semibold hover:underline">Dashboard</Link>
          <Link to="/in-progress" className="text-yellow-600 hover:underline">In Progress</Link>
          <Link to="/dropped" className="text-blue-600 hover:underline">Dropped</Link>
          <Link to="/finished" className="text-green-600 hover:underline">Finished</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Hi, {user.username}</span>
          <button onClick={logout} className="px-3 py-1 rounded bg-gray-900 text-white text-sm">Log Out</button>
        </div>
      </div>
    </nav>
  )
}