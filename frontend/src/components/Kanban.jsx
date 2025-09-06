import React from 'react'
import {DndContext, closestCenter, PointerSensor, useSensor, useSensors} from '@dnd-kit/core'
import {SortableContext, arrayMove, verticalListSortingStrategy, useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'

function Item({item}){
  const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: item.id})
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style} className="p-2 border mb-2 rounded bg-white" {...attributes} {...listeners}>
      {item.title}
    </div>
  )
}

export default function Kanban({queues, items, onReorder}){
  const sensors = useSensors(useSensor(PointerSensor))

  // group items by queue id and sort by sort_key
  const byQueue = {}
  queues.forEach(q=> byQueue[q.id] = [])
  items.forEach(i=>{
    if(byQueue[i.queue_id]) byQueue[i.queue_id].push(i)
  })
  Object.keys(byQueue).forEach(k => byQueue[k].sort((a,b)=> (a.sort_key||0) - (b.sort_key||0)))

  function handleDragEnd(event, queueId){
    const {active, over} = event
    if(!over || active.id === over.id) return
    const list = byQueue[queueId]
    const oldIndex = list.findIndex(i => i.id === active.id)
    const newIndex = list.findIndex(i => i.id === over.id)
    if(oldIndex === -1 || newIndex === -1) return
    const newList = arrayMove(list, oldIndex, newIndex)

    // compute new sort_keys as incremental floats
    const payload = newList.map((it, idx) => ({ id: it.id, sort_key: idx * 10.0 }))
    // optimistic UI: call onReorder if provided
    if(onReorder) onReorder(queueId, payload)
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {queues.map(q=> (
        <div key={q.id} className="border rounded p-3 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">{q.title}</h4>
            <div className="flex gap-2">
              <button onClick={() => onReorder && onReorder(q.id, [])} className="text-sm text-blue-600">Tonight Trio</button>
            </div>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e)=>handleDragEnd(e, q.id)}>
            <SortableContext items={byQueue[q.id].map(i=>i.id)} strategy={verticalListSortingStrategy}>
              <div>
                {byQueue[q.id].map(i=> <Item key={i.id} item={i} />)}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  )
}
