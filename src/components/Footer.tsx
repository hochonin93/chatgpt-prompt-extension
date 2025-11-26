import packageJson from '../../package.json'

type FooterProps = {
    triggerSymbol: string
    statusMessage: string | null
}

export function Footer({ triggerSymbol, statusMessage }: FooterProps) {
    return (
        <footer>
            <p>
                安裝後於 ChatGPT 輸入框鍵入 <strong>{triggerSymbol}</strong>,即可喚出提示詞列表,使用 Tab / Enter 選取。
            </p>
            <p>
                作者: HO CHON IN | 版本: {packageJson.version}
            </p>
            {statusMessage && <span className="status-chip">{statusMessage}</span>}
        </footer>
    )
}
