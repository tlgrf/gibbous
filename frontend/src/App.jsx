import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function App(){
  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Gibbous</h1>
        <nav className="mt-2 space-x-4">
          <Link to="/dashboard" className="text-blue-600">Dashboard</Link>
          <Link to="/login" className="text-blue-600"> Login</Link>
          <Link to="/register" className="text-blue-600"> Register</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
