import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileTabBar from '@/components/layout/MobileTabBar';
import { PageTransition } from '@/components/common/Motion';

/** Storefront shell: header, animated page slot, footer, and the mobile tab bar. */
const PublicLayout = () => (
  <div className="flex min-h-screen flex-col">
    {/* Keyboard users can jump past the header; visible only while focused. */}
    <a
      href="#main-content"
      className="sr-only z-[100] rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Skip to content
    </a>
    <Navbar />
    <main id="main-content" className="flex-1 pb-20 sm:pb-0" tabIndex={-1}>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </main>
    <Footer />
    <MobileTabBar />
  </div>
);

export default PublicLayout;
