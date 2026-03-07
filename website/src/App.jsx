import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import SignalChatWidget from './components/SignalChatWidget'
import HamburgerMenu from './components/HamburgerMenu'
import ExplorePage from './pages/ExplorePage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import LoginPage from './pages/LoginPage'
import AffiliatePage from './pages/AffiliatePage'
import LegalPage from './pages/LegalPage'

export default function App() {
    return (
        <>
            <Nav />
            <HamburgerMenu />
            <Routes>
                <Route path="/" element={<ExplorePage />} />
                <Route path="/explore" element={<Navigate to="/" replace />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/affiliate" element={<AffiliatePage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            <SignalChatWidget />
        </>
    )
}
