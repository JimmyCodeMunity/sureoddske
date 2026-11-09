import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import RootLayout from '@/layouts/RootLayout'
import NotFound from '@/pages/NotFound'

const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))

export const router = createBrowserRouter([
    {
        // Public site — has the BetSlipDrawer in RootLayout
        path: '/',
        element: <RootLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'about', element: <About /> },
        ],
    },
    // Admin — standalone pages, no RootLayout/BetSlip
    { path: '/admin', element: <AdminLogin /> },
    { path: '/admin/dashboard', element: <AdminDashboard /> },
    { path: '*', element: <NotFound /> },
])
