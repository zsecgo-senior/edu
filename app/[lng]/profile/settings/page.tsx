'use client'

import Header from '@/components/shared/header'
import useTranslate from '@/hooks/use-translate'
import useUser from '@/hooks/use-user'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function Page() {
	const { resolvedTheme } = useTheme()
	const t = useTranslate()
	const { user } = useUser()
	const router = useRouter()

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		router.refresh()
		router.push('/')
	}

	return (
		<>
			<Header title={t('settings')} description={t('settingsDescription')} />

			<div className='mt-4'>
				<div className='rounded-md border bg-secondary p-4'>
					<p className='font-medium'>{user?.fullName}</p>
					<p className='text-sm text-muted-foreground'>{user?.email}</p>
					<div className='mt-4'>
						<Button onClick={handleLogout}>{t('logout')}</Button>
					</div>
				</div>
			</div>
		</>
	)
}

export default Page
