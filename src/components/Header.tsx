type HeaderProps = {
    onExport: () => void
}

export function Header({ onExport }: HeaderProps) {
    return (
        <header>
            <div>
                <p className="eyebrow">ChatGPT Prompt Companion</p>
                <h1>提示詞管理器</h1>
                <p className="subtitle">設定觸發符號、整理片語,並匯入匯出 JSON</p>
            </div>
            <button className="secondary" onClick={onExport} type="button">
                匯出 JSON
            </button>
        </header>
    )
}
