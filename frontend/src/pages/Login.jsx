import React, {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'

export default function Login(){
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault()
    setMsg(null)
    try {
      const res = await fetch('/api/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({login,password}),
        credentials:'include'
      })
      let data = null
      try { data = await res.json() } catch {_=>{}}
      if(!res.ok) {
        setMsg((data && (data.error || data.message)) || `HTTP ${res.status}`)
        return
      }
      nav('/dashboard')
    } catch (err) {
      setMsg(String(err))
    }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <form onSubmit={submit} className="w-full max-w-md border bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Log in</h2>
        <input className="border p-2 w-full mb-2 rounded" value={login} onChange={e=>setLogin(e.target.value)} placeholder='username or email' />
        <input className="border p-2 w-full mb-4 rounded" value={password} onChange={e=>setPassword(e.target.value)} placeholder='password' type='password' />
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" type='submit'>Log in</button>
        {msg && <div className="mt-2 text-red-600">{msg}</div>}
        <div className="mt-4 text-sm text-center">
          Or{' '}
          <Link to="/register" className="text-blue-600 underline">
            Register if you don’t have an account
          </Link>
        </div>
      </form>
    </div>
  )
}
