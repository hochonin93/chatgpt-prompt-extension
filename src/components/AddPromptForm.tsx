import { FormEvent, useState } from 'react'

type AddPromptFormProps = {
    onAdd: (prompt: string) => Promise<void>
}

export function AddPromptForm({ onAdd }: AddPromptFormProps) {
    const [newPrompt, setNewPrompt] = useState('')

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        const trimmed = newPrompt.trim()
        if (!trimmed) return
        await onAdd(trimmed)
        setNewPrompt('')
    }

    return (
        <form className="add-row" onSubmit={handleSubmit}>
            <input
                value={newPrompt}
                onChange={(event) => setNewPrompt(event.target.value)}
                placeholder="輸入新的提示詞..."
            />
            <button type="submit" className="primary">
                新增
            </button>
        </form>
    )
}
