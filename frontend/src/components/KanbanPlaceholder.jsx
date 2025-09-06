import React from 'react'

export default function KanbanPlaceholder({queues, items, onTonight}){
  return (
    <div className="grid grid-cols-3 gap-4">
      {queues.map(q=> (
        <div key={q.id} className="border rounded p-3 bg-white">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">{q.title}</h4>
            <button onClick={() => onTonight && onTonight(q.id)} className="text-sm text-blue-600">Tonight Trio</button>
          </div>
          <ul className="mt-2">
            {items.filter(i=> i.queue_id === q.id).map(i=> (
              <li key={i.id} className="p-2 border mb-2 rounded">{i.title}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
