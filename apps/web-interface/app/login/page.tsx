'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 Попытка входа:', { username, passwordLength: password.length })

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username: username.trim(),
        password: password
      })

      console.log('✅ Вход успешен:', response.data.operator)

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('operator', JSON.stringify(response.data.operator))
      
      router.push('/home')
    } catch (err: any) {
      console.error('❌ Ошибка входа:', err)
      console.error('Статус:', err.response?.status)
      console.error('Данные:', err.response?.data)
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Не удается подключиться к серверу. Убедитесь, что Backend API запущен на порту 3001.')
      } else if (err.response?.status === 401) {
        setError('Неверное имя пользователя или пароль')
      } else if (err.response?.status === 500) {
        const errorMsg = err.response?.data?.error?.message || ''
        if (errorMsg.includes('JWT')) {
          setError('Ошибка конфигурации сервера (JWT). Обратитесь к администратору.')
        } else {
          setError('Ошибка сервера. Попробуйте позже.')
        }
      } else {
        setError(err.response?.data?.error?.message || 'Ошибка входа. Попробуйте позже.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">Панель оператора</h1>
            <p className="text-gray-600 mt-2">Магазин одежды</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Имя пользователя
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="admin"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
