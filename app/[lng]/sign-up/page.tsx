'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useTranslate from '@/hooks/use-translate'

export default function Page() {
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const t = useTranslate()

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const res = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fullName, email, password }),
		})

		if (res.ok) {
			router.push('/')
			router.refresh()
		} else {
			const data = await res.json()
			alert(data.error || 'Registration failed')
		}

		setLoading(false)
	}

	return (
		<div className='mx-auto max-w-md'>
			<h1 className='text-2xl font-bold mb-4'>{t('signUp')}</h1>
			<form onSubmit={onSubmit} className='space-y-3'>
				<Input
					placeholder='Full name'
					value={fullName}
					onChange={e => setFullName(e.target.value)}
				/>
				<Input
					placeholder='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
				/>
				<Input
					placeholder='password'
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
				<Button type='submit' disabled={loading}>
					{t('signUp')}
				</Button>
			</form>
		</div>
	)
}
