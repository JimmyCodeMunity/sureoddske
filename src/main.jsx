import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { BetSlipProvider } from '@/context/BetSlipContext'
import { AdminAuthProvider } from '@/context/AdminAuthContext'
import { router } from '@/router'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <AdminAuthProvider>
        <BetSlipProvider>
          <RouterProvider router={router} />
        </BetSlipProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
