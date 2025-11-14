'use client'

import type { ReactNode } from 'react'

interface Props {
	children: ReactNode
	localization?: any
}

// Temporary pass-through provider: previously ClerkProvider.
// The app uses a custom auth backend. Keep this component so imports remain valid
// while migrating other components. It simply renders children.
export default function ClerkProviderWrapper({ children }: Props) {
	return <>{children}</>
}
