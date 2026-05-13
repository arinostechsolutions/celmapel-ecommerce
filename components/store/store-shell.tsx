'use client'

import { Suspense } from 'react'
import { StoreHeader }      from './header'
import { CartDrawer }       from './cart-drawer'
import { CheckoutResumer }  from './checkout-resumer'

interface StoreShellProps {
  storeName: string
  storeLogo?: string
  children: React.ReactNode
}

export function StoreShell({ storeName, storeLogo, children }: StoreShellProps) {
  return (
    <>
      <StoreHeader storeName={storeName} storeLogo={storeLogo} />
      <CartDrawer />
      <Suspense><CheckoutResumer /></Suspense>
      {children}
    </>
  )
}
