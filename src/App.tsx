import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import './App.css'

const DEFAULT_TRIGGER = '!!'
const STORAGE_KEYS: (keyof StorageData)[] = ['prompts', 'triggerSymbol']

type StorageData = {
  prompts?: string[]
  triggerSymbol?: string
}

type PromptItem = {
  id: string
  text: string
}

const hasChromeRuntime = typeof chrome !== 'undefined' && !!chrome.storage?.sync

const fallbackPrompts = [
  '請幫我把以下內容翻譯成英文。',
  'Summarize the next paragraph in 3 bullet points.',
  'Generate five interview questions about this topic.'
]

function App() {
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [triggerSymbol, setTriggerSymbol] = useState(DEFAULT_TRIGGER)
  const [pendingTrigger, setPendingTrigger] = useState(DEFAULT_TRIGGER)
  const [newPrompt, setNewPrompt] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hasChromeRuntime) {
      setPrompts(fallbackPrompts.map((text) => ({ id: crypto.randomUUID(), text })))
      setPendingTrigger(DEFAULT_TRIGGER)
      setTriggerSymbol(DEFAULT_TRIGGER)
      setLoading(false)
      return
    }

    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!hasChromeRuntime) return
    const handler = (changes: { [key in keyof StorageData]?: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'sync') return
      if (changes.prompts) {
        const newPrompts = Array.isArray(changes.prompts.newValue) ? changes.prompts.newValue : []
        setPrompts(newPrompts.map((text: string) => ({ id: crypto.randomUUID(), text })))
      }
      if (changes.triggerSymbol) {
        const nextValue = changes.triggerSymbol.newValue
        const resolved = typeof nextValue === 'string' && nextValue.trim() ? nextValue : DEFAULT_TRIGGER
        setTriggerSymbol(resolved)
        setPendingTrigger(resolved)
      }
    }

    chrome.storage.onChanged.addListener(handler)
    return () => chrome.storage.onChanged.removeListener(handler)
  }, [])

  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 2800)
    return () => clearTimeout(timer)
  }, [statusMessage])

  const promptCountLabel = useMemo(() => `${prompts.length} 個提示詞`, [prompts.length])

  const loadFromStorage = () => {
    if (!hasChromeRuntime) return
    chrome.storage.sync.get(STORAGE_KEYS, (result: StorageData) => {
      const savedPrompts = Array.isArray(result.prompts) ? result.prompts : []
      const savedTrigger =
        typeof result.triggerSymbol === 'string' && result.triggerSymbol.trim()
          ? result.triggerSymbol
          : DEFAULT_TRIGGER

      setPrompts(savedPrompts.map((text) => ({ id: crypto.randomUUID(), text })))
      setTriggerSymbol(savedTrigger)
      setPendingTrigger(savedTrigger)
      setLoading(false)
    })
  }

  const persistPrompts = (nextPrompts: PromptItem[]) => {
    const rawPrompts = nextPrompts.map((p) => p.text)
    if (!hasChromeRuntime) {
      setPrompts(nextPrompts)
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set({ prompts: rawPrompts }, () => resolve())
    })
  }

  const persistTrigger = (value: string) => {
    if (!hasChromeRuntime) {
      setTriggerSymbol(value)
      return Promise.resolve()
    }
    return new Promise<void>((resolve) => chrome.storage.sync.set({ triggerSymbol: value }, () => resolve()))
  }

  const handleAddPrompt = async (event?: FormEvent) => {
    event?.preventDefault()
    const trimmed = newPrompt.trim()
    if (!trimmed) return
    const nextPrompts = [...prompts, { id: crypto.randomUUID(), text: trimmed }]
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
    setNewPrompt('')
    setStatusMessage('提示詞已新增')
  }

  const handleDeletePrompt = async (index: number) => {
    const nextPrompts = prompts.filter((_, itemIndex) => itemIndex !== index)
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
    if (editingIndex === index) {
      setEditingIndex(null)
      setEditingValue('')
    }
    setStatusMessage('提示詞已刪除')
  }

  const handleStartEdit = (index: number, value: string) => {
    setEditingIndex(index)
    setEditingValue(value)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingValue('')
  }

  const handleSaveEdit = async () => {
    if (editingIndex === null) return
    const trimmed = editingValue.trim()
    if (!trimmed) return
    const nextPrompts = prompts.map((prompt, index) =>
      index === editingIndex ? { ...prompt, text: trimmed } : prompt
    )
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
    setEditingIndex(null)
    setEditingValue('')
    setStatusMessage('提示詞已更新')
  }

  const handleSaveTrigger = async () => {
    const trimmed = pendingTrigger.trim() || DEFAULT_TRIGGER
    await persistTrigger(trimmed)
    setTriggerSymbol(trimmed)
    setPendingTrigger(trimmed)
    setStatusMessage(`觸發符號設定為 ${trimmed}`)
  }

  const handleExportPrompts = () => {
    const exported = JSON.stringify(prompts.map((p) => p.text), null, 2)
    const blob = new Blob([exported], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'prompts.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage('提示詞已匯出')
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
          setStatusMessage('檔案格式不正確')
          return
        }
        const cleaned = parsed
          .filter((item) => typeof item === 'string')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)

        const currentTexts = prompts.map((p) => p.text)
        const newTexts = cleaned.filter((text: string) => !currentTexts.includes(text))

        if (newTexts.length === 0) {
          setStatusMessage('沒有新的提示詞可匯入')
          return
        }

        const nextPrompts = [...prompts, ...newTexts.map((text: string) => ({ id: crypto.randomUUID(), text }))]
        await persistPrompts(nextPrompts)
        setPrompts(nextPrompts)
        setStatusMessage('提示詞已匯入')
      } catch (error) {
        console.error(error)
        setStatusMessage('匯入時發生錯誤')
      } finally {
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    const nextPrompts = Array.from(prompts)
    const [reorderedItem] = nextPrompts.splice(sourceIndex, 1)
    nextPrompts.splice(destinationIndex, 0, reorderedItem)

    setPrompts(nextPrompts)
    await persistPrompts(nextPrompts)
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="panel">
          <p>資料載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <p className="eyebrow">ChatGPT Prompt Companion</p>
          <h1>提示詞管理器</h1>
          <p className="subtitle">設定觸發符號、整理片語，並匯入匯出 JSON</p>
        </div>
        <button className="secondary" onClick={handleExportPrompts} type="button">
          匯出 JSON
        </button>
      </header>

      <section className="panel">
        <h2>觸發符號</h2>
        <p className="helper-text">預設為 {DEFAULT_TRIGGER}，輸入在 ChatGPT 文字框並按 Tab/Enter 插入提示詞。</p>
        <div className="trigger-row">
          <input
            value={pendingTrigger}
            maxLength={5}
            onChange={(event) => setPendingTrigger(event.target.value)}
            placeholder="例如：!!"
          />
          <button type="button" onClick={handleSaveTrigger} className="primary">
            儲存
          </button>
        </div>
      </section>

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

        <form className="add-row" onSubmit={handleAddPrompt}>
          <input
            value={newPrompt}
            onChange={(event) => setNewPrompt(event.target.value)}
            placeholder="輸入新的提示詞..."
          />
          <button type="submit" className="primary">
            新增
          </button>
        </form>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="prompt-list">
            {(provided) => (
              <ul className="prompt-list" {...provided.droppableProps} ref={provided.innerRef}>
                {prompts.length === 0 && <li className="empty">尚未建立提示詞，先新增幾個吧。</li>}
                {prompts.map((prompt, index) => (
                  <Draggable key={prompt.id} draggableId={prompt.id} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`draggable-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        style={provided.draggableProps.style}
                      >
                        {editingIndex === index ? (
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
                                <button type="button" onClick={() => handleStartEdit(index, prompt.text)}>
                                  編輯
                                </button>
                                <button type="button" className="danger" onClick={() => handleDeletePrompt(index)}>
                                  刪除
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </section>

      <footer>
        <p>
          安裝後於 ChatGPT 輸入框鍵入 <strong>{triggerSymbol}</strong>，即可喚出提示詞列表，使用 Tab / Enter 選取。
        </p>
        {statusMessage && <span className="status-chip">{statusMessage}</span>}
      </footer>
    </div>
  )
}

export default App
