import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'

export default function Login(){
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault()
    const res = await fetch('/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({login,password}), credentials:'include'
    })
    const data = await res.json()
    if(!res.ok) setMsg(data.error || 'error')
    else { nav('/dashboard') }
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <h2 className="text-xl mb-2">Login</h2>
      <input className="border p-2 w-full mb-2" value={login} onChange={e=>setLogin(e.target.value)} placeholder='username or email' />
      <input className="border p-2 w-full mb-2" value={password} onChange={e=>setPassword(e.target.value)} placeholder='password' type='password' />
      <button className="bg-blue-600 text-white px-3 py-1 rounded" type='submit'>Login</button>
      {msg && <div className="mt-2">{msg}</div>}
    </form>
  )
}
