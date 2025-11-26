import { useState } from 'react'
import { Draggable, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { PromptItem as PromptItemType } from '../types'

type PromptItemProps = {
    prompt: PromptItemType
    index: number
    onEdit: (index: number, text: string) => Promise<void>
    onDelete: (index: number) => Promise<void>
}

export function PromptItem({ prompt, index, onEdit, onDelete }: PromptItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editingValue, setEditingValue] = useState('')

    const handleStartEdit = () => {
        setIsEditing(true)
        setEditingValue(prompt.text)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditingValue('')
    }

    const handleSaveEdit = async () => {
        const trimmed = editingValue.trim()
        if (!trimmed) return
        await onEdit(index, trimmed)
        setIsEditing(false)
        setEditingValue('')
    }

    const handleDelete = async () => {
        const promptText = prompt.text
        const confirmMessage = promptText.length > 50
            ? `確定要刪除此提示詞嗎?\n\n"${promptText.substring(0, 50)}..."`
            : `確定要刪除此提示詞嗎?\n\n"${promptText}"`

        if (!window.confirm(confirmMessage)) {
            return
        }
        await onDelete(index)
    }

    return (
        <Draggable key={prompt.id} draggableId={prompt.id} index={index}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`draggable-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    style={provided.draggableProps.style}
                >
                    {isEditing ? (
                        <>
                            <textarea value={editingValue} onChange={(event) => setEditingValue(event.target.value)} />
                            <div className="button-row">
                                <button type="button" className="primary" onClick={handleSaveEdit}>
                                    儲存
                                </button>
                                <button type="button" onClick={handleCancelEdit}>
                                    取消
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="drag-handle" {...provided.dragHandleProps}>
                                <span className="drag-icon">⋮⋮</span>
                            </div>
                            <div className="prompt-content">
                                <p>{prompt.text}</p>
                                <div className="button-row">
                                    <button type="button" onClick={handleStartEdit}>
                                        編輯
                                    </button>
                                    <button type="button" className="danger" onClick={handleDelete}>
                                        刪除
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </li>
            )}
        </Draggable>
    )
}
