import React, {useState} from 'react'

export default function Register(){
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)

  async function submit(e){
    e.preventDefault()
    setMsg(null)
    try {
      const res = await fetch('/api/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username,email,password}),
        credentials: 'include'
      })
      let data = null
      try { data = await res.json() } catch {_=>{}}
      if(!res.ok) {
        setMsg((data && (data.error || data.message)) || `HTTP ${res.status}`)
        return
      }
      setMsg('registered')
    } catch (err) {
      setMsg(String(err))
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <h2 className="text-xl mb-2">Register</h2>
      <input className="border p-2 w-full mb-2" value={username} onChange={e=>setUsername(e.target.value)} placeholder='username' />
      <input className="border p-2 w-full mb-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder='email' />
      <input className="border p-2 w-full mb-2" value={password} onChange={e=>setPassword(e.target.value)} placeholder='password' type='password' />
      <button className="bg-blue-600 text-white px-3 py-1 rounded" type='submit'>Register</button>
      {msg && <div className="mt-2 text-red-600">{msg}</div>}
    </form>
  )
}
