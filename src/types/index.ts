export type PromptItem = {
    id: string
    text: string
}

export type StorageData = {
    prompts?: string[]
    triggerSymbol?: string
}

export const DEFAULT_TRIGGER = '!!'
export const STORAGE_KEYS: (keyof StorageData)[] = ['prompts', 'triggerSymbol']
