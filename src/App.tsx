import './App.css'
import { PromptItem } from './types'
import { usePromptStorage } from './hooks/usePromptStorage'
import { useTriggerStorage } from './hooks/useTriggerStorage'
import { useStatusMessage } from './hooks/useStatusMessage'
import { Header } from './components/Header'
import { TriggerSection } from './components/TriggerSection'
import { PromptList } from './components/PromptList'
import { Footer } from './components/Footer'

function App() {
  const { prompts, loading, setPrompts, persistPrompts } = usePromptStorage()
  const { triggerSymbol, persistTrigger } = useTriggerStorage()
  const { statusMessage, setStatusMessage } = useStatusMessage()

  const handleAddPrompt = async (text: string) => {
    const nextPrompts = [...prompts, { id: crypto.randomUUID(), text }]
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
    setStatusMessage('提示詞已新增')
  }

  const handleEditPrompt = async (index: number, text: string) => {
    const nextPrompts = prompts.map((prompt, i) =>
      i === index ? { ...prompt, text } : prompt
    )
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
    setStatusMessage('提示詞已更新')
  }

  const handleDeletePrompt = async (index: number) => {
    const nextPrompts = prompts.filter((_, i) => i !== index)
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
    setStatusMessage('提示詞已刪除')
  }

  const handleReorderPrompts = async (reorderedPrompts: PromptItem[]) => {
    setPrompts(reorderedPrompts)
    await persistPrompts(reorderedPrompts)
  }

  const handleImportPrompts = async (newTexts: string[]) => {
    const nextPrompts = [...prompts, ...newTexts.map((text) => ({ id: crypto.randomUUID(), text }))]
    await persistPrompts(nextPrompts)
    setPrompts(nextPrompts)
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
      <Header onExport={handleExportPrompts} />

      <TriggerSection
        triggerSymbol={triggerSymbol}
        onSave={persistTrigger}
        onStatusChange={setStatusMessage}
      />

      <PromptList
        prompts={prompts}
        onAdd={handleAddPrompt}
        onReorder={handleReorderPrompts}
        onEdit={handleEditPrompt}
        onDelete={handleDeletePrompt}
        onImport={handleImportPrompts}
        onStatusChange={setStatusMessage}
      />

      <Footer triggerSymbol={triggerSymbol} statusMessage={statusMessage} />
    </div>
  )
}

export default App
