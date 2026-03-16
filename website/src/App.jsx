import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './stores/authStore'
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
import DevPortal from './pages/DevPortal'
import SmsOptIn from './pages/SmsOptIn'
import SecurityPage from './pages/SecurityPage'
import PricingPage from './pages/PricingPage'
import PlaygroundPage from './pages/PlaygroundPage'
import DocsPage from './pages/DocsPage'
import TutorialPage from './pages/TutorialPage'
import ChangelogPage from './pages/ChangelogPage'
import ShowcasePage from './pages/ShowcasePage'

export default function App() {
    return (
        <AuthProvider>
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
                <Route path="/dev04" element={<DevPortal />} />
                <Route path="/sms-optin" element={<SmsOptIn />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/playground" element={<PlaygroundPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/tutorials" element={<TutorialPage />} />
                <Route path="/changelog" element={<ChangelogPage />} />
                <Route path="/showcase" element={<ShowcasePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            <SignalChatWidget />
        </AuthProvider>
    )
}
