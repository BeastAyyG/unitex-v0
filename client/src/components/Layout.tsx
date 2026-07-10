import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

function Layout() {
    return (
        <div className="TopHeaderLayout min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans transition-colors duration-300">
            <Header />

            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 w-full relative">
                <main className="w-full max-w-none mx-auto pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;
