function Footer() {
    return (
        <footer className="bg-midnight-700 border-t border-midnight-500/30 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-text-muted text-sm">
                        &copy; {new Date().getFullYear()} My GameHub. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                            Powered by RAWG
                        </a>
                        <a href="https://isthereanydeal.com" target="_blank" rel="noopener noreferrer" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                            Deals by ITAD
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
