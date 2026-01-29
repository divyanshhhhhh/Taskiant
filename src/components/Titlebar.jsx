import { Minus, Square, X, Copy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'

import logo from '../assets/logo.png'

export function Titlebar() {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        const checkMaximized = async () => {
            if (window.electronAPI) {
                const maximized = await window.electronAPI.isMaximized()
                setIsMaximized(maximized)
            }
        }
        checkMaximized()
    }, [])

    const handleMinimize = () => window.electronAPI?.minimize()
    const handleMaximize = async () => {
        await window.electronAPI?.maximize()
        const maximized = await window.electronAPI?.isMaximized()
        setIsMaximized(maximized)
    }
    const handleClose = () => window.electronAPI?.close()

    return (
        <div className="titlebar h-10 flex items-center justify-between bg-background-secondary border-b border-border px-4">
            <div className="flex items-center gap-2">
                <img src={logo} alt="App Logo" className="h-5 w-auto" />
                <span className="text-sm font-semibold text-text-primary">Taskiant</span>
            </div>

            <div className="flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none hover:bg-background-tertiary"
                    onClick={handleMinimize}
                >
                    <Minus className="h-4 w-4 text-text-secondary" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none hover:bg-background-tertiary"
                    onClick={handleMaximize}
                >
                    {isMaximized ? (
                        <Copy className="h-3.5 w-3.5 text-text-secondary" />
                    ) : (
                        <Square className="h-3.5 w-3.5 text-text-secondary" />
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none hover:bg-priority-1 hover:text-white"
                    onClick={handleClose}
                >
                    <X className="h-4 w-4 text-text-secondary" />
                </Button>
            </div>
        </div>
    )
}
