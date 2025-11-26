import { useEffect, useState } from 'react'
import { StorageData, DEFAULT_TRIGGER } from '../types'

const hasChromeRuntime = typeof chrome !== 'undefined' && !!chrome.storage?.sync

export function useTriggerStorage() {
    const [triggerSymbol, setTriggerSymbol] = useState(DEFAULT_TRIGGER)

    useEffect(() => {
        if (!hasChromeRuntime) {
            setTriggerSymbol(DEFAULT_TRIGGER)
            return
        }

        loadFromStorage()
    }, [])

    useEffect(() => {
        if (!hasChromeRuntime) return

        const handler = (changes: { [key in keyof StorageData]?: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName !== 'sync') return
            if (changes.triggerSymbol) {
                const nextValue = changes.triggerSymbol.newValue
                const resolved = typeof nextValue === 'string' && nextValue.trim() ? nextValue : DEFAULT_TRIGGER
                setTriggerSymbol(resolved)
            }
        }

        chrome.storage.onChanged.addListener(handler)
        return () => chrome.storage.onChanged.removeListener(handler)
    }, [])

    const loadFromStorage = () => {
        if (!hasChromeRuntime) return
        chrome.storage.sync.get(['triggerSymbol'], (result: StorageData) => {
            const savedTrigger =
                typeof result.triggerSymbol === 'string' && result.triggerSymbol.trim()
                    ? result.triggerSymbol
                    : DEFAULT_TRIGGER
            setTriggerSymbol(savedTrigger)
        })
    }

    const persistTrigger = (value: string) => {
        if (!hasChromeRuntime) {
            setTriggerSymbol(value)
            return Promise.resolve()
        }
        return new Promise<void>((resolve) => chrome.storage.sync.set({ triggerSymbol: value }, () => resolve()))
    }

    return { triggerSymbol, persistTrigger }
}
