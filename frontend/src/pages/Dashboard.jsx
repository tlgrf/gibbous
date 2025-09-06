import React, {useEffect, useState} from 'react'
import { Navigate } from 'react-router-dom'
import Kanban from '../components/Kanban'

export default function Dashboard(){
  const [user, setUser] = useState(undefined) // undefined -> loading, null -> not authed
  const [csrf, setCsrf] = useState(null)
  const [queues, setQueues] = useState([])
  const [items, setItems] = useState([])
  const [newQueueTitle, setNewQueueTitle] = useState('')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [selectedQueue, setSelectedQueue] = useState(null)
  const [trio, setTrio] = useState(null)

  const authHeaders = () => {
    const h = { 'Content-Type': 'application/json' }
    if (csrf) h['X-CSRF-Token'] = csrf
    return h
  }

  async function loadAll(){
    const me = await fetch('/api/me', {credentials:'include'}).then(r=>r.json())
    setUser(me.user || null)
    setCsrf(me.csrf || null)
    if (!me.user) return
    const qs = await fetch('/api/queues', {credentials:'include'}).then(r=>r.json())
    setQueues(Array.isArray(qs) ? qs : [])
    const its = await fetch('/api/media-items', {credentials:'include'}).then(r=>r.json())
    setItems(Array.isArray(its) ? its : [])
  }

  useEffect(()=>{ loadAll() }, [])

  async function createQueue(e){
    e.preventDefault()
    if(!newQueueTitle) return
    await fetch('/api/queues', {
      method:'POST',
      headers: authHeaders(),
      credentials:'include',
      body:JSON.stringify({title:newQueueTitle})
    })
    setNewQueueTitle('')
    loadAll()
  }

  async function createItem(e){
    e.preventDefault()
    if(!newItemTitle || !selectedQueue) return
    await fetch('/api/media-items', {
      method:'POST',
      headers: authHeaders(),
      credentials:'include',
      body:JSON.stringify({title:newItemTitle, queue_id:selectedQueue})
    })
    setNewItemTitle('')
    loadAll()
  }

  async function requestTonight(queueId){
    const res = await fetch(`/api/queues/${queueId}/tonight`, {credentials:'include'})
    if(res.ok){
      const data = await res.json()
      setTrio(data)
    }
  }

  async function reorder(queueId, itemsPayload){
    // if payload is empty, treat as request for tonight
    if(itemsPayload && itemsPayload.length === 0){
      requestTonight(queueId)
      return
    }
    await fetch(`/api/queues/${queueId}/reorder`, {
      method:'POST',
      headers: authHeaders(),
      credentials:'include',
      body:JSON.stringify({items: itemsPayload})
    })
    loadAll()
  }

  async function logout(){
    await fetch('/api/logout', {
      method:'POST',
      headers: csrf ? {'X-CSRF-Token': csrf} : {},
      credentials:'include'
    })
    setUser(null)
  }

  // Loading state
  if (user === undefined) return null
  if (user === null) return <Navigate to="/login" replace />

  return (
    <div>
      <h2 className="text-xl mb-2">Dashboard</h2>
     <div className="mb-4 flex items-center gap-3">
       <span>User: {user ? user.username : 'not logged in'}</span>
       <button onClick={logout} className="text-sm text-red-600 underline">Logout</button>
     </div>

      <div className="mb-6">
        <form onSubmit={createQueue} className="flex gap-2">
          <input className="border p-2" placeholder="New queue title" value={newQueueTitle} onChange={e=>setNewQueueTitle(e.target.value)} />
          <button className="bg-green-600 text-white px-3 rounded" type="submit">Create Queue</button>
        </form>
      </div>

      <div className="mb-6">
        <form onSubmit={createItem} className="flex gap-2">
          <input className="border p-2" placeholder="New item title" value={newItemTitle} onChange={e=>setNewItemTitle(e.target.value)} />
          <select value={selectedQueue || ''} onChange={e=>setSelectedQueue(parseInt(e.target.value) || null)} className="border p-2">
            <option value=''>Select queue</option>
            {queues.map(q=> <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
          <button className="bg-blue-600 text-white px-3 rounded" type="submit">Add Item</button>
        </form>
      </div>

      <div className="mb-6">
  <h3 className="font-semibold mb-2">Kanban</h3>
  <Kanban queues={queues} items={items} onReorder={reorder} />
      </div>

      {trio && (
        <div className="border p-3 bg-gray-50">
          <h4 className="font-semibold">Tonight Trio</h4>
          <ul>
            {trio.trio.map(i=> <li key={i.id}>{i.title} — <em>{i.kind}</em></li>)}
          </ul>
          <div className="text-sm mt-2">Why: {trio.why.map(w=> `${w.id}:${w.why}`).join(' | ')}</div>
        </div>
      )}
    </div>
  )
}
