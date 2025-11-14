'use client'

import { useTheme } from 'next-themes'
import useUser from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function Profile() {
	const { resolvedTheme } = useTheme()
	const { user } = useUser()
	const router = useRouter()

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		router.refresh()
		router.push('/')
	}

	return (
		<div className='rounded-md border bg-secondary p-4'>
			<p className='font-medium'>{user?.fullName}</p>
			<p className='text-sm text-muted-foreground'>{user?.email}</p>
			<div className='mt-4'>
				<Button onClick={handleLogout}>Log out</Button>
			</div>
		</div>
	)
}

export default Profile
