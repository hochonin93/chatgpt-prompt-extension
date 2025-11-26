import { useEffect, useState } from 'react'
import { PromptItem, StorageData, STORAGE_KEYS } from '../types'

const hasChromeRuntime = typeof chrome !== 'undefined' && !!chrome.storage?.sync

const fallbackPrompts = [
    '請幫我把以下內容翻譯成英文。',
    'Summarize the next paragraph in 3 bullet points.',
    'Generate five interview questions about this topic.'
]

export function usePromptStorage() {
    const [prompts, setPrompts] = useState<PromptItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!hasChromeRuntime) {
            setPrompts(fallbackPrompts.map((text) => ({ id: crypto.randomUUID(), text })))
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
        }

        chrome.storage.onChanged.addListener(handler)
        return () => chrome.storage.onChanged.removeListener(handler)
    }, [])

    const loadFromStorage = () => {
        if (!hasChromeRuntime) return
        chrome.storage.sync.get(STORAGE_KEYS, (result: StorageData) => {
            const savedPrompts = Array.isArray(result.prompts) ? result.prompts : []
            setPrompts(savedPrompts.map((text) => ({ id: crypto.randomUUID(), text })))
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

    return { prompts, loading, setPrompts, persistPrompts }
}
