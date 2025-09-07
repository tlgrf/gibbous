import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'

export default function App(){
  const { pathname } = useLocation()
  const hideNav = pathname === '/login' || pathname === '/register'

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNav && <Navbar />}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
