import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Share2, Bookmark, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOCK_DISCOVER_CONTENT: Record<string, any> = {
    'spacex': {
        title: "SpaceX Starship Launch: A New Era",
        category: "Science",
        date: "March 24, 2024",
        author: "UnitX Editorial",
        image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1200&auto=format&fit=crop",
        content: "SpaceX's Starship, the most powerful rocket ever built, has successfully completed its latest flight test. This milestone brings humanity one step closer to multi-planetary life. The mission profile included several key objectives, from engine relights in space to controlled atmospheric reentry. Observers around the globe watched as the massive vehicle ascended from Starbase, Texas, marking a significant shift in orbital delivery capabilities and cost-efficiency for future deep-space exploration."
    },
    'eu-ai-act': {
        title: "EU AI Act: Setting the Global Digital Standard",
        category: "Policy",
        date: "March 22, 2024",
        author: "Regulatory Watch",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",
        content: "The European Parliament has finalized the world's first comprehensive horizontal regulation on artificial intelligence. The EU AI Act introduces a risk-based approach, banning certain applications while imposing strict transparency requirements on high-risk systems. As the digital 'Brussels Effect' takes hold, countries worldwide are looking to this framework as a template for balancing innovation with fundamental rights and safety in the age of generative AI."
    },
    'drizzle-orm': {
        title: "Drizzle ORM v1.0: Modern Type-Safe Databases",
        category: "Tech",
        date: "March 20, 2024",
        author: "Dev Insights",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop",
        content: "Drizzle ORM has hit its 1.0 milestone, solidifying its position as the preferred choice for TypeScript developers who value performance and developer experience. Unlike heavy abstractions, Drizzle feels like 'SQL with types,' providing a lean, intuitive interface for managing complex data schemas. The release includes full support for major SQL dialects, a robust migration engine, and seamless integration with modern serverless and edge compute environments."
    },
    'arc-browser': {
        title: "Arc Browser Hits 1M Users: Reimagining the Internet",
        category: "Software",
        date: "March 18, 2024",
        author: "Product Hunt",
        image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=1200&auto=format&fit=crop",
        content: "The Browser Company's 'Arc' has officially surpassed one million active users, signaling a massive shift in how people expect to interact with the web. By introducing features like 'Spaces,' 'Boosts,' and a vertical sidebar that treats the browser like an operating system, Arc has successfully challenged the dominance of legacy browsers. The milestone comes amidst increasing conversation about 'user agency' and browser-native productivity tools."
    },
    'hermes': {
        title: "Meta's Hermes Engine: Faster Mobile JavaScript",
        category: "Mobile",
        date: "March 15, 2024",
        author: "Engineering News",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        content: "Meta has open-sourced major updates to Hermes, its specialized JavaScript engine optimized for React Native. The new version features advanced ahead-of-time (AOT) compilation and improved garbage collection, significantly reducing 'Time to Interactive' for mobile applications on lower-end devices. This release reinforces Meta's commitment to cross-platform performance and provides the community with a powerful tool for building fluid, high-performance mobile experiences."
    },
    'mindful-travel': {
        title: "The Future of Mindful Travel",
        category: "Popular",
        date: "March 25, 2024",
        author: "Globe Trotter",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
        content: "Slow tourism is overtaking fast travel. How digital nomads are reshaping local economies by staying longer and engaging deeper with local cultures. This trend shifts the focus from 'checking boxes' to 'building connections,' fostering a more sustainable and meaningful global travel ecosystem."
    },
    'cybersecurity-ai': {
        title: "Cybersecurity in the Age of AI",
        category: "Technology",
        date: "March 24, 2024",
        author: "Securify",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
        content: "Protecting digital infrastructure when the attackers are automated agents requires a fundamental shift in defense strategies. AI-driven anomaly detection and self-healing networks are becoming the new standard for enterprise security."
    },
    'general-topic': {
        title: "Curriculum Overview",
        category: "Education",
        date: "Ongoing",
        author: "UnitX Academy",
        image: "https://images.unsplash.com/photo-1434031211128-095490e7e7bb?q=80&w=1200&auto=format&fit=crop",
        content: "Explore our intensive learning paths designed for the next generation of builders. From Computer Science to Psychology, our curriculum is built to provide foundational knowledge and practical skills for the decentralized era."
    }
};

function DiscoverDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const content = MOCK_DISCOVER_CONTENT[slug || ""] || {
        title: "Signal Not Found",
        category: "Unknown",
        date: "N/A",
        author: "System",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
        content: "The requested discovery signal could not be located in the current layer."
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-[var(--color-text)]">
            {/* Back Button */}
            <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-8 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Discover
            </button>

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-widest">
                        {content.category}
                    </span>
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> {content.date}
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight uppercase leading-[0.9] mb-8">
                    {content.title}
                </h1>
                <div className="flex items-center gap-4 border-y border-[var(--color-surface)] py-6">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
                        <User size={20} className="opacity-40" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Reported By</p>
                        <p className="text-sm font-bold uppercase tracking-tight">{content.author}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 border-[var(--color-surface)] hover:bg-gray-50 rounded-lg">
                            <Share2 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 border-[var(--color-surface)] hover:bg-gray-50 rounded-lg">
                            <Bookmark size={16} />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mb-12 border border-[var(--color-surface)] overflow-hidden">
                <img src={content.image} alt={content.title} className="w-full h-auto" />
            </div>

            <article className="prose prose-zinc max-w-none">
                <div className="text-lg md:text-xl font-medium leading-relaxed opacity-80 uppercase tracking-tight italic border-l-2 border-[var(--color-accent)] pl-8 my-10">
                    "This signal represents a primary inflection point in the current {content.category.toLowerCase()} trajectory."
                </div>
                <p className="text-lg md:text-xl leading-relaxed font-sans mb-8">
                    {content.content}
                </p>
                <p className="text-lg md:text-xl leading-relaxed font-sans mb-8">
                    As we continue to monitor this development, further signals will be prioritized and broadcasted to the discovery layer. The implications for the local mesh and global network are significant, requiring proactive adjustment of current operational protocols.
                </p>
            </article>

            <footer className="mt-20 pt-10 border-t border-[var(--color-surface)] text-center">
                <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.3em] mb-4 text-[var(--color-text)]">
                    End of Signal Broadcast
                </p>
                <div className="flex justify-center gap-8">
                    <Globe size={24} className="opacity-5" />
                    <Activity size={24} className="opacity-5" />
                </div>
            </footer>
        </div>
    );
}

const Activity = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default DiscoverDetail;
