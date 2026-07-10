import { useState, useEffect } from 'react';
import { BookOpen, Video, FileText, Wrench, LayoutTemplate, Search, Bookmark, Clock, ArrowUpRight, Star, Zap, Globe, Cpu, Code, Layout, Users, CheckCircle, ArrowRight, Play, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/useAuth';
import { subscribeToCourses, subscribeToResources, subscribeToEnrolledCourses, enrollCourse, subscribeToSavedResources, toggleResourceSave } from '@/lib/firestore';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResourceType = 'All' | 'Article' | 'Video' | 'Paper' | 'Tool' | 'Template';
type ActiveTab = 'courses' | 'resources';

interface Resource {
    id: string | number;
    title: string;
    description: string;
    type: ResourceType;
    source: string;
    author: string;
    readTime: string;
    tags: string[];
    rating: number;
    saved?: boolean;
    featured?: boolean;
}

interface Course {
    id: string | number;
    title: string;
    instructor: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    rating: number;
    progress?: number;
    image: string;
    category: string;
    tags: string[];
    modules: number;
    enrolled: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { color: string }> = {
    Beginner: { color: 'bg-emerald-500 text-white' },
    Intermediate: { color: 'bg-amber-500 text-white' },
    Advanced: { color: 'bg-red-500 text-white' },
};

const RESOURCE_TYPE_ICONS: Record<string, React.ElementType> = {
    Article: FileText, Video, Paper: BookOpen, Tool: Wrench, Template: LayoutTemplate,
};

const INITIAL_COURSES: Course[] = [
    { id: 'c1', title: 'Mastering mesh architecture', instructor: 'Dr. Sarah Connor', level: 'Advanced', duration: '12h 45m', rating: 4.9, progress: 0, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800', category: 'Core Architecture', tags: ['Rust', 'Distributed Systems'], modules: 8, enrolled: '4.2k' },
    { id: 'c2', title: 'High-density UI strategy', instructor: 'Elena Fisher', level: 'Intermediate', duration: '8h 20m', rating: 4.8, progress: 0, image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800', category: 'Design', tags: ['Framer Motion', 'React'], modules: 6, enrolled: '6.7k' },
    { id: 'c3', title: 'AI node integration', instructor: 'Marcus Reed', level: 'Advanced', duration: '15h 10m', rating: 5.0, progress: 0, image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800', category: 'AI & ML', tags: ['PyTorch', 'System Design'], modules: 11, enrolled: '2.1k' },
    { id: 'c4', title: 'TypeScript for systems engineers', instructor: 'Alex Chen', level: 'Intermediate', duration: '6h 00m', rating: 4.7, progress: 0, image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800', category: 'Engineering', tags: ['TypeScript', 'Node.js'], modules: 5, enrolled: '9.3k' },
    { id: 'c5', title: 'Infrastructure at scale: DevOps fundamentals', instructor: 'Jordan Smith', level: 'Beginner', duration: '10h 30m', rating: 4.6, progress: 0, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800', category: 'Infrastructure', tags: ['Docker', 'K8s', 'CI/CD'], modules: 9, enrolled: '11.5k' },
    { id: 'c6', title: 'Generative design with AI', instructor: 'Priya Patel', level: 'Beginner', duration: '5h 15m', rating: 4.8, progress: 0, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800', category: 'Design', tags: ['Stable Diffusion', 'Figma AI'], modules: 4, enrolled: '7.8k' },
];

const INITIAL_RESOURCES: Resource[] = [
    { id: 'r1', title: 'The art of distributed state management', description: 'A deep dive into CRDT-based approaches for distributed systems and how to avoid clock sync pitfalls in high-density mesh networks.', type: 'Article', source: 'Engineering Blog', author: 'Dr. Sarah Connor', readTime: '14 min', tags: ['Architecture', 'Rust'], rating: 4.9, saved: false, featured: true },
    { id: 'r2', title: 'Framer Motion: Advanced choreography', description: 'Master staggered animations, shared layout transitions, and gesture-driven micro-interactions for high-density UIs.', type: 'Video', source: 'YouTube', author: 'Elena Fisher', readTime: '42 min', tags: ['Design', 'React'], rating: 4.8, saved: false, featured: true },
    { id: 'r3', title: 'Wait-free consensus in meshed networks', description: 'Formal proof-of-concept for achieving linearizability without locks in high-throughput transaction environments.', type: 'Paper', source: 'arXiv', author: 'Marcus Reed', readTime: '28 min', tags: ['Research', 'CS Theory'], rating: 4.7, saved: false, featured: true },
    { id: 'r4', title: 'Node.js monitoring dashboard template', description: 'A production-ready React + Recharts template for real-time system health dashboards.', type: 'Template', source: 'GitHub', author: 'Alex Chen', readTime: '5 min setup', tags: ['Dashboard', 'Monitoring'], rating: 4.6, saved: false },
    { id: 'r5', title: 'Tailoring TypeScript: Advanced generic patterns', description: 'From conditional types to infer, mapped types, and template literals — a practical field guide for library authors.', type: 'Article', source: 'Dev.to', author: 'Jordan Smith', readTime: '18 min', tags: ['TypeScript', 'Engineering'], rating: 4.8, saved: false },
    { id: 'r6', title: 'Drizzle ORM v1.0 deep dive', description: 'Benchmarks, migrations, and relation queries — everything you need to replace Prisma in a production TypeScript stack.', type: 'Video', source: 'Fireship', author: 'Tech Radar', readTime: '22 min', tags: ['Database', 'TypeScript'], rating: 4.7, saved: false },
    { id: 'r7', title: 'Self-hosted analytics with Plausible', description: 'Step-by-step guide to deploying a privacy-first, GDPR-compliant analytics stack on your own infrastructure.', type: 'Tool', source: 'Plausible Docs', author: 'Open Source Nexus', readTime: '10 min', tags: ['Analytics', 'DevOps'], rating: 4.5, saved: false },
    { id: 'r8', title: 'AI product design: from prompt to interface', description: 'Practical workflow for designing AI-native products — prompt engineering patterns, UX edge cases, and latency perception.', type: 'Article', source: 'Medium', author: 'Priya Patel', readTime: '11 min', tags: ['AI', 'Design'], rating: 4.6, saved: false },
    { id: 'r9', title: 'WebGPU: The new standard for hardware rendering', description: 'How WebGPU changes the game for 3D, ML inference in the browser, and compute shaders beyond Canvas/WebGL.', type: 'Paper', source: 'W3C', author: 'W3C Working Group', readTime: '35 min', tags: ['WebGPU', 'Browser'], rating: 4.9, saved: false },
];

const COURSE_CATEGORIES = ['All', 'Core Architecture', 'Design', 'AI & ML', 'Infrastructure', 'Engineering'];
const RESOURCE_TYPES: ResourceType[] = ['All', 'Article', 'Video', 'Paper', 'Tool', 'Template'];

// ─── Component ────────────────────────────────────────────────────────────────

function Resources() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('resources');

    // Firestore states
    const [dbCourses, setDbCourses] = useState<Course[]>([]);
    const [dbResources, setDbResources] = useState<Resource[]>([]);
    const [enrolled, setEnrolled] = useState<any[]>([]);
    const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

    // Courses state
    const [activeCourseCategory, setActiveCourseCategory] = useState('All');
    const [courseSearch, setCourseSearch] = useState('');

    // Resources state
    const [activeResourceType, setActiveResourceType] = useState<ResourceType>('All');
    const [resourceSearch, setResourceSearch] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const uC = subscribeToCourses((data) => setDbCourses(data as unknown as Course[]));
        const uR = subscribeToResources((data) => setDbResources(data as unknown as Resource[]));
        const uE = subscribeToEnrolledCourses(currentUser.uid, setEnrolled);
        const uS = subscribeToSavedResources(currentUser.uid, setSavedSet);
        return () => {
            uC(); uR(); uE(); uS();
        };
    }, [currentUser]);

    useEffect(() => {
        // One-time seeding script if exactly 0 courses/resources are found after a short delay
        let mounted = true;
        const seedDb = async () => {
            if (!db) return;
            if (dbCourses.length === 0) {
                const snap = await getDocs(collection(db, 'courses'));
                if (snap.empty && mounted) {
                    INITIAL_COURSES.forEach(async (c) => await setDoc(doc(db, 'courses', c.id.toString()), c));
                }
            }
            if (dbResources.length === 0) {
                const snap = await getDocs(collection(db, 'resources'));
                if (snap.empty && mounted) {
                    INITIAL_RESOURCES.forEach(async (r) => {
                        const cleanR = { ...r, saved: undefined };
                        await setDoc(doc(db, 'resources', r.id.toString()), cleanR);
                    });
                }
            }
        };
        // Give the listeners half a second to populate first
        const timer = setTimeout(() => { seedDb(); }, 2000);
        return () => { mounted = false; clearTimeout(timer); };
    }, [dbCourses.length, dbResources.length]);

    // Derived logic that merges Firestore data + Fallback Mock Data + User state
    const activeCourses = (dbCourses.length > 0 ? dbCourses : INITIAL_COURSES).map(c => {
        const entry = enrolled.find(e => e.id === c.id.toString());
        return { ...c, progress: entry ? entry.progress : 0 };
    });

    const activeResources = (dbResources.length > 0 ? dbResources : INITIAL_RESOURCES).map(r => {
        return { ...r, saved: savedSet.has(r.id.toString()) };
    });


    const toggleSave = async (id: string, currentlySaved: boolean) => {
        if (!currentUser) return;
        // Optimistic UI updates handle this automatically through real-time DB listener,
        // but we push the operation to Firestore:
        await toggleResourceSave(id.toString(), currentUser.uid, currentlySaved);
    };

    const handleEnroll = async (id: string) => {
        if (!currentUser) return;
        await enrollCourse(id.toString(), currentUser.uid);
    }

    const filteredCourses = activeCourses.filter(c => {
        const matchCat = activeCourseCategory === 'All' || c.category === activeCourseCategory;
        const matchSearch = !courseSearch || c.title.toLowerCase().includes(courseSearch.toLowerCase());
        return matchCat && matchSearch;
    });

    const filteredResources = activeResources.filter(r => {
        const matchType = activeResourceType === 'All' || r.type === activeResourceType;
        const matchSearch = !resourceSearch || r.title.toLowerCase().includes(resourceSearch.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(resourceSearch.toLowerCase()));
        return matchType && matchSearch;
    });

    const inProgress = activeCourses.filter(c => c.progress > 0 && c.progress < 100);
    const featured = activeResources.filter(r => r.featured);
    const heroCourse = activeCourses.length > 0 ? activeCourses[0] : INITIAL_COURSES[0];

    return (
        <div className="pt-4 pb-20 max-w-[1400px] mx-auto px-6">

            {/* ── Page Header ── */}
            <header className="mb-8 border-b border-[var(--color-surface)] pb-6">
                <h1 className="text-5xl font-bold tracking-tighter text-[var(--color-text)] leading-none mb-2">
                    Resources & roadmaps
                </h1>
                <p className="text-sm text-gray-400 font-medium max-w-xl leading-relaxed">
                    Curated courses, learning paths, articles, papers, and tools — everything you need to grow your expertise.
                </p>
            </header>

            <div className="flex gap-0 mb-10 border-b border-[var(--color-surface)]">
                {([
                    { key: 'resources', label: 'Resource library', icon: FileText },
                    { key: 'courses', label: 'Courses & roadmaps', icon: BookOpen },
                ] as { key: ActiveTab; label: string; icon: React.ElementType }[]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-2 px-8 py-4 text-xs font-bold capitalize tracking-wider border-b-2 -mb-px transition-all',
                            activeTab === tab.key
                                ? 'border-[var(--color-accent)] text-[var(--color-text)]'
                                : 'border-transparent text-gray-400 hover:text-[var(--color-text)]'
                        )}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════
                TAB: COURSES & ROADMAPS
            ════════════════════════════════════ */}
            {activeTab === 'courses' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

                    {/* Featured Hero */}
                    <div className="relative overflow-hidden bg-[var(--color-text)] mb-12 min-h-[220px] flex items-end">
                        <img src={heroCourse.image} alt={heroCourse.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 w-full">
                            <div>
                                <div className="flex items-center gap-2 text-[var(--color-accent)] mb-3">
                                    <Zap size={13} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Featured path</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-white leading-none mb-3 capitalize">
                                    {heroCourse.title}
                                </h2>
                                <div className="flex items-center gap-5 text-white/40 text-[10px] font-mono">
                                    <span className="flex items-center gap-1.5"><Users size={10} /> {heroCourse.enrolled} enrolled</span>
                                    <span className="flex items-center gap-1.5"><Clock size={10} /> {heroCourse.duration}</span>
                                    <span className="flex items-center gap-1.5"><Star size={10} className="text-[var(--color-accent)]" /> {heroCourse.rating}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <div className="text-white/40 text-[10px] font-mono">{heroCourse.progress || 0}% complete</div>
                                <div className="w-40 h-1 bg-white/10">
                                    <div className="h-full bg-[var(--color-accent)]" style={{ width: `${heroCourse.progress || 0}%` }} />
                                </div>
                                <button className="px-7 py-3 bg-[var(--color-accent)] text-white text-xs font-bold capitalize tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2"
                                        onClick={() => handleEnroll(heroCourse.id.toString())}>
                                    <Play size={13} /> Continue learning
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        {/* Category Filters */}
                        <div className="flex flex-wrap gap-2">
                            {COURSE_CATEGORIES.map(cat => (
                                <button key={cat} onClick={() => setActiveCourseCategory(cat)}
                                    className={cn(
                                        'px-5 py-2 text-[10px] font-bold capitalize tracking-wider transition-all',
                                        activeCourseCategory === cat
                                            ? 'bg-[var(--color-text)] text-white'
                                            : 'bg-white border border-[var(--color-surface)] text-gray-400 hover:border-gray-300'
                                    )}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                            <input type="text" placeholder="Search courses..." value={courseSearch}
                                onChange={e => setCourseSearch(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-[var(--color-surface)] text-xs font-medium focus:border-[var(--color-accent)] outline-none transition-all w-56" />
                        </div>
                    </div>

                    {/* In-progress Strip */}
                    {inProgress.length > 0 && activeCourseCategory === 'All' && !courseSearch && (
                        <div className="mb-10 p-6 bg-gray-50 border border-[var(--color-surface)]">
                            <h3 className="text-xs font-bold capitalize tracking-wider text-gray-400 mb-5 flex items-center gap-2">
                                <Play size={13} className="text-[var(--color-accent)]" /> Continue studying
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {inProgress.map(c => (
                                    <div key={c.id} className="group cursor-pointer bg-white border border-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-xs font-bold text-[var(--color-text)] capitalize tracking-tight group-hover:text-[var(--color-accent)] transition-colors leading-tight">{c.title}</h4>
                                            <span className="text-[10px] font-mono text-gray-300 ml-2 shrink-0">{c.progress}%</span>
                                        </div>
                                        <div className="h-1 bg-gray-100 w-full overflow-hidden">
                                            <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${c.progress}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map(course => {
                            const levelCfg = LEVEL_CONFIG[course.level] || LEVEL_CONFIG['Beginner'];
                            return (
                                <div key={course.id} className="group flex flex-col bg-white border border-[var(--color-surface)] shadow-sm hover:border-[var(--color-accent)] transition-all overflow-hidden">
                                    <div className="aspect-[16/9] relative overflow-hidden bg-gray-100">
                                        <img src={course.image} alt={course.title}
                                            className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute top-3 left-3">
                                            <span className={cn('px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest', levelCfg.color)}>
                                                {course.level}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                                            {course.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md text-[8px] font-bold text-white tracking-widest uppercase border border-white/20">{tag}</span>
                                            ))}
                                        </div>
                                        {(course.progress ?? 0) > 0 && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-[var(--color-accent)]" style={{ width: `${course.progress}%` }} />
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-bold text-[var(--color-accent)] capitalize tracking-widest">{course.category}</span>
                                            <div className="flex items-center gap-1">
                                                <Star size={10} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
                                                <span className="text-[10px] font-bold">{course.rating}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-bold tracking-tight mb-3 group-hover:text-[var(--color-accent)] transition-colors leading-tight capitalize">{course.title}</h3>
                                        <p className="text-[10px] text-gray-400 font-medium mb-4">By {course.instructor}</p>
                                        <div className="mt-auto pt-4 border-t border-[var(--color-surface)] flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[9px] font-mono text-gray-300 uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><Clock size={10} />{course.duration}</span>
                                                <span className="opacity-30">|</span>
                                                <span>{course.modules} modules</span>
                                            </div>
                                            <button 
                                                onClick={() => handleEnroll(course.id.toString())}
                                                className="text-[10px] font-bold capitalize tracking-wider flex items-center gap-1.5 hover:text-[var(--color-accent)] transition-colors">
                                                {(course.progress ?? 0) > 0 ? 'Continue' : 'Start'} <ArrowRight size={12} className="text-[var(--color-accent)]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Certifications Footer */}
                    <div className="mt-16 border-t border-[var(--color-surface)] pt-12">
                        <div className="flex items-center gap-3 mb-8">
                            <Globe size={16} className="text-[var(--color-accent)]" />
                            <h3 className="text-xs font-bold capitalize tracking-wider">Global certifications</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { name: 'Architecture master', icon: Cpu, cost: '5k VP' },
                                { name: 'Design strategist', icon: Layout, cost: '3k VP' },
                                { name: 'Node specialist', icon: Code, cost: '2k VP' },
                            ].map((cert, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white border border-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <cert.icon size={16} className="text-gray-300" />
                                        <span className="text-xs font-bold capitalize">{cert.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-[var(--color-accent)]">{cert.cost}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════
                TAB: RESOURCE LIBRARY
            ════════════════════════════════════ */}
            {activeTab === 'resources' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

                    {/* Featured Resources Band */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {featured.map(resource => {
                            const Icon = RESOURCE_TYPE_ICONS[resource.type] || FileText;
                            const isSaved = resource.saved;
                            return (
                                <div key={resource.id} className="group relative bg-[var(--color-text)] text-white p-7 overflow-hidden flex flex-col justify-between min-h-[200px] cursor-pointer hover:opacity-95 transition-opacity">
                                    <div className="absolute top-0 right-0 p-6 opacity-5"><Icon size={90} /></div>
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-[var(--color-accent)] text-white">{resource.type}</span>
                                            <button onClick={() => toggleSave(resource.id.toString(), isSaved || false)}
                                                className={cn('p-1.5 transition-colors', isSaved ? 'text-[var(--color-accent)]' : 'text-white/30 hover:text-white')}>
                                                <Bookmark size={13} fill={isSaved ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                        <h3 className="text-base font-bold tracking-tight leading-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors capitalize">{resource.title}</h3>
                                        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{resource.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                                        <span className="text-[9px] font-mono text-white/30 flex items-center gap-1"><Clock size={10} />{resource.readTime}</span>
                                        <span className="text-[9px] font-bold text-white/30">{resource.author}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <div className="flex flex-wrap gap-2">
                            {RESOURCE_TYPES.map(type => {
                                const Icon = type === 'All' ? Zap : RESOURCE_TYPE_ICONS[type];
                                return (
                                    <button key={type} onClick={() => setActiveResourceType(type)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-5 py-2 text-[10px] font-bold capitalize tracking-wider transition-all',
                                            activeResourceType === type
                                                ? 'bg-[var(--color-text)] text-white'
                                                : 'bg-white border border-[var(--color-surface)] text-gray-400 hover:border-gray-300'
                                        )}>
                                        {Icon && <Icon size={11} />} {type}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                            <input type="text" placeholder="Search resources..." value={resourceSearch}
                                onChange={e => setResourceSearch(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-[var(--color-surface)] text-xs font-medium focus:border-[var(--color-accent)] outline-none transition-all w-56" />
                        </div>
                    </div>

                    {/* Resource List */}
                    <div className="flex flex-col gap-4">
                        {filteredResources.map(resource => {
                            const Icon = RESOURCE_TYPE_ICONS[resource.type] || FileText;
                            const isSaved = resource.saved;
                            return (
                                <div key={resource.id} className="group bg-white border border-[var(--color-surface)] p-6 hover:border-[var(--color-accent)] transition-all shadow-sm cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)] group-hover:text-white group-hover:border-transparent transition-all">
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="text-sm font-bold tracking-tight group-hover:text-[var(--color-accent)] transition-colors leading-tight capitalize">
                                                    {resource.title}
                                                </h3>
                                                <button onClick={e => { e.stopPropagation(); toggleSave(resource.id.toString(), isSaved || false); }}
                                                    className={cn('p-1.5 shrink-0 transition-colors', isSaved ? 'text-[var(--color-accent)]' : 'text-gray-200 hover:text-gray-400')}>
                                                    <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-1">{resource.description}</p>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex gap-1.5">
                                                    {resource.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 text-[8px] font-bold capitalize tracking-widest bg-gray-50 border border-gray-100 text-gray-400">{tag}</span>
                                                    ))}
                                                </div>
                                                <div className="ml-auto flex items-center gap-4 text-[9px] font-mono text-gray-300">
                                                    <span className="flex items-center gap-1"><Star size={9} className="fill-[var(--color-accent)] text-[var(--color-accent)]" /><span className="text-[var(--color-text)] font-bold">{resource.rating}</span></span>
                                                    <span className="flex items-center gap-1"><Clock size={9} />{resource.readTime}</span>
                                                    <span>{resource.source}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Resources;
