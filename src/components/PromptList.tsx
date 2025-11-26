import { ChangeEvent, useRef } from 'react'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { PromptItem as PromptItemType } from '../types'
import { PromptItem } from './PromptItem'
import { AddPromptForm } from './AddPromptForm'

type PromptListProps = {
    prompts: PromptItemType[]
    onAdd: (prompt: string) => Promise<void>
    onReorder: (prompts: PromptItemType[]) => Promise<void>
    onEdit: (index: number, text: string) => Promise<void>
    onDelete: (index: number) => Promise<void>
    onImport: (prompts: string[]) => Promise<void>
    onStatusChange: (message: string) => void
}

export function PromptList({ prompts, onAdd, onReorder, onEdit, onDelete, onImport, onStatusChange }: PromptListProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const sourceIndex = result.source.index
        const destinationIndex = result.destination.index

        if (sourceIndex === destinationIndex) return

        const nextPrompts = Array.from(prompts)
        const [reorderedItem] = nextPrompts.splice(sourceIndex, 1)
        nextPrompts.splice(destinationIndex, 0, reorderedItem)

        await onReorder(nextPrompts)
    }

    const handleChooseFile = () => {
        fileInputRef.current?.click()
    }

    const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const parsed = JSON.parse(String(reader.result))
                if (!Array.isArray(parsed)) {
                    onStatusChange('檔案格式不正確')
                    return
                }
                const cleaned = parsed
                    .filter((item) => typeof item === 'string')
                    .map((item) => item.trim())
                    .filter((item) => item.length > 0)

                const currentTexts = prompts.map((p) => p.text)
                const newTexts = cleaned.filter((text: string) => !currentTexts.includes(text))

                if (newTexts.length === 0) {
                    onStatusChange('沒有新的提示詞可匯入')
                    return
                }

                await onImport(newTexts)
                onStatusChange('提示詞已匯入')
            } catch (error) {
                console.error(error)
                onStatusChange('匯入時發生錯誤')
            } finally {
                event.target.value = ''
            }
        }

        reader.readAsText(file)
    }

    const promptCountLabel = `${prompts.length} 個提示詞`

    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <h2>提示詞列表</h2>
                    <p className="helper-text">{promptCountLabel}</p>
                </div>
                <button className="secondary" onClick={handleChooseFile} type="button">
                    匯入 JSON
                </button>
                <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={handleImportFile} />
            </div>

            <AddPromptForm onAdd={onAdd} />

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="prompt-list">
                    {(provided) => (
                        <ul className="prompt-list" {...provided.droppableProps} ref={provided.innerRef}>
                            {prompts.length === 0 && <li className="empty">尚未建立提示詞,先新增幾個吧。</li>}
                            {prompts.map((prompt, index) => (
                                <PromptItem
                                    key={prompt.id}
                                    prompt={prompt}
                                    index={index}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))}
                            {provided.placeholder}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>
        </section>
    )
}
