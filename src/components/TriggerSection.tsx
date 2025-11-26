import { useState } from 'react'
import { DEFAULT_TRIGGER } from '../types'

type TriggerSectionProps = {
    triggerSymbol: string
    onSave: (symbol: string) => Promise<void>
    onStatusChange: (message: string) => void
}

export function TriggerSection({ triggerSymbol, onSave, onStatusChange }: TriggerSectionProps) {
    const [pendingTrigger, setPendingTrigger] = useState(triggerSymbol)

    const handleSave = async () => {
        const trimmed = pendingTrigger.trim() || DEFAULT_TRIGGER
        await onSave(trimmed)
        setPendingTrigger(trimmed)
        onStatusChange(`觸發符號設定為 ${trimmed}`)
    }

    return (
        <section className="panel">
            <h2>觸發符號</h2>
            <p className="helper-text">預設為 {DEFAULT_TRIGGER},輸入在 ChatGPT 文字框並按 Tab/Enter 插入提示詞。</p>
            <div className="trigger-row">
                <input
                    value={pendingTrigger}
                    maxLength={5}
                    onChange={(event) => setPendingTrigger(event.target.value)}
                    placeholder="例如:!!"
                />
                <button type="button" onClick={handleSave} className="primary">
                    儲存
                </button>
            </div>
        </section>
    )
}
