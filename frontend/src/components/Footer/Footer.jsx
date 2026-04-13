import { FaGithub, FaDiscord, FaGamepad } from "react-icons/fa";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-white/5 bg-midnight-950/40 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    
                    {/* Brand & Rights */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2 mb-1">
                            <FaGamepad className="text-accent" size={16} />
                            <span className="text-sm font-black text-white uppercase tracking-tighter">GameHub</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            &copy; {currentYear} All Rights Reserved
                        </p>
                    </div>

                    {/* API Attribution */}
                    <div className="flex items-center gap-6">
                        <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-text-muted hover:text-white uppercase tracking-widest transition-colors">
                            RAWG Intel
                        </a>
                        <a href="https://isthereanydeal.com" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-text-muted hover:text-white uppercase tracking-widest transition-colors">
                            ITAD Market
                        </a>
                    </div>

                    {/* Socials */}
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-text-muted hover:text-white transition-colors">
                            <FaGithub size={18} />
                        </a>
                        <a href="#" className="text-text-muted hover:text-white transition-colors">
                            <FaDiscord size={18} />
                        </a>
                    </div>

                </div>
            </div>
        </footer>
    );
}

export default Footer;
