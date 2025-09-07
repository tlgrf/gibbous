import React, {useEffect, useState} from 'react'
import { Navigate } from 'react-router-dom'
import Kanban from '../components/Kanban'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Dashboard(){
  const [user, setUser] = useState(undefined) // undefined -> loading, null -> not authed
  const [csrf, setCsrf] = useState(null)
  const [queues, setQueues] = useState([])
  const [items, setItems] = useState([])
  const [newQueueTitle, setNewQueueTitle] = useState('')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [selectedQueue, setSelectedQueue] = useState(null)
  const [trio, setTrio] = useState(null)
  const [selectedVibes, setSelectedVibes] = useState([])
  const VIBE_CHOICES = ['cozy','epic','spooky','chill','upbeat','artsy','cerebral','wholesome'] 
  const [accordionOpen, setAccordionOpen] = useState({})
  const [confirm, setConfirm] = useState(null) // {type:'queue'|'item', id:number, title:string}
  const [busy, setBusy] = useState(false)

  const authHeaders = () => {
    const h = { 'Content-Type': 'application/json' }
    if (csrf) h['X-CSRF-Token'] = csrf
    return h
  }

  async function loadAll(){
    const me = await fetch('/api/me', {credentials:'include'}).then(r=>r.json())
    setUser(me.user)
    setCsrf(me.csrf || null)
    if (!me.user) return
    const qs = await fetch('/api/queues', {credentials:'include'}).then(r=>r.json())
    setQueues(Array.isArray(qs) ? qs : [])
    const its = await fetch('/api/media-items', {credentials:'include'}).then(r=>r.json())
    setItems(Array.isArray(its) ? its : [])
  }
  function toggleVibe(v){
    setSelectedVibes(prev => (
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    ))
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
      body:JSON.stringify({
        title:newItemTitle,
        queue_id:selectedQueue,
        vibes: selectedVibes
      })
     })
     setNewItemTitle('')
    setSelectedVibes([])
    loadAll()
  }

  function toggleAccordion(qid){
    setAccordionOpen(prev => ({ ...prev, [qid]: !prev[qid] }))
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

  function promptDeleteQueue(q){
    setConfirm({
      type: 'queue',
      id: q.id,
      title: q.title
    })
  }

  function promptDeleteItem(it){
    setConfirm({
      type: 'item',
      id: it.id,
      title: it.title
    })
  }

  async function handleConfirm(){
    if (!confirm) return
    try {
      setBusy(true)
      if (confirm.type === 'queue') {
        await fetch(`/api/queues/${confirm.id}`, {
          method:'DELETE',
          headers: authHeaders(),
          credentials:'include'
        })
      } else if (confirm.type === 'item') {
        await fetch(`/api/media-items/${confirm.id}`, {
          method:'DELETE',
          headers: authHeaders(),
          credentials:'include'
        })
      }
    } finally {
      setBusy(false)
      setConfirm(null)
      loadAll()
    }
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
          {selectedQueue && (
            <div className="flex flex-wrap gap-2 items-center">
              {VIBE_CHOICES.map(v => {
                const active = selectedVibes.includes(v)
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={()=>toggleVibe(v)}
                    className={`px-2 py-1 rounded border text-sm ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                    aria-pressed={active}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
          )}
          <button className="bg-blue-600 text-white px-3 rounded" type="submit">Add Item</button>
        </form>
      </div>

{/* Accordions: Queues list with delete and per-item delete */}
      <div className="mb-8">
        <h3 className="font-semibold mb-3">Your Queues</h3>
        <div className="space-y-3">
          {queues.length === 0 && (
            <div className="text-sm text-gray-600">No queues yet. Create one above.</div>
          )}
          {queues.map(q => {
            const open = !!accordionOpen[q.id]
            const qItems = items.filter(i => i.queue_id === q.id)
            return (
              <div key={q.id} className="border rounded-lg bg-white">
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    onClick={() => toggleAccordion(q.id)}
                    className="text-left flex-1 font-medium"
                    aria-expanded={open}
                  >
                    {q.title} <span className="text-xs text-gray-500">({qItems.length})</span>
                  </button>
                  <button
                    onClick={() => promptDeleteQueue(q)}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete queue"
                    aria-label={`Delete queue ${q.title}`}
                  >
                    ×
                  </button>
                </div>
                {open && (
                  <ul className="px-3 pb-3 space-y-2">
                    {qItems.length === 0 && (
                      <li className="text-sm text-gray-500">No items yet.</li>
                    )}
                    {qItems.map(it => (
                      <li key={it.id} className="flex items-center justify-between border rounded p-2">
                        <span>{it.title}</span>
                        <button
                          onClick={() => promptDeleteItem(it)}
                          className="text-gray-500 hover:text-red-600"
                          title="Delete item"
                          aria-label={`Delete item ${it.title}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
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
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'queue' ? 'Delete queue?' : 'Delete item?'}
        message={
          confirm?.type === 'queue'
            ? `This will delete the queue “${confirm?.title}” and everything in it.`
            : `This will delete the item “${confirm?.title}”.`
        }
        confirmText={confirm?.type === 'queue' ? 'Delete Queue' : 'Delete Item'}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
