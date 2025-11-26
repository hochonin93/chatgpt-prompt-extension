import { useEffect, useState } from 'react'

export function useStatusMessage() {
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!statusMessage) return
        const timer = setTimeout(() => setStatusMessage(null), 2800)
        return () => clearTimeout(timer)
    }, [statusMessage])

    return { statusMessage, setStatusMessage }
}
