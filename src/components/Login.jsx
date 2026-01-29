import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import logo from '../assets/logo.png'

export function Login({ onLogin }) {
    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)
    const [needsSetup, setNeedsSetup] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        checkStatus()
    }, [])

    const checkStatus = async () => {
        try {
            if (window.electronAPI) {
                const status = await window.electronAPI.checkAuthStatus()
                setNeedsSetup(status.needsSetup)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setInitializing(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!password.trim()) {
            setError('Password cannot be empty')
            return
        }

        if (needsSetup && password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.login(password)
                if (result.success) {
                    onLogin()
                } else {
                    setError('Incorrect password or database error')
                }
            } else {
                // Dev/Browser fallback
                onLogin()
            }
        } catch (e) {
            setError(e.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    if (initializing) {
        return <div className="h-screen w-full bg-background-primary flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
    }

    return (
        <div className="h-screen w-full bg-background-primary flex flex-col items-center justify-center p-4">
            {/* Custom draggable region for window controls if needed */}
            <div className="fixed top-0 left-0 right-0 h-10 app-drag-region" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <img src={logo} alt="Taskiant" className="h-16 w-auto mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-text-primary mb-2">
                        {needsSetup ? 'Welcome to Taskiant' : 'Welcome Back'}
                    </h1>
                    <p className="text-text-secondary">
                        {needsSetup
                            ? 'Create a master password to secure your tasks'
                            : 'Enter your master password to unlock'}
                    </p>
                </div>

                <div className="bg-background-secondary border border-border/50 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary ml-1">
                                Master Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-9"
                                    placeholder={needsSetup ? "Create secure password" : "Enter password"}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {needsSetup && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-text-primary ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-9"
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded-lg"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base mt-2"
                            disabled={loading || !password}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {needsSetup ? 'Create Database' : 'Unlock Database'}
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-text-muted mt-6">
                    {needsSetup ? (
                        "This password encrypts your database. Don't lose it!"
                    ) : (
                        "Your data is fully encrypted and secure locally."
                    )}
                </p>
            </motion.div>
        </div>
    )
}
