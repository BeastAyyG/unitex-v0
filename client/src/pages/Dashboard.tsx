import { Award, Database, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

const data = [
    { name: 'Jan', xp: 2400 },
    { name: 'Feb', xp: 1398 },
    { name: 'Mar', xp: 3800 },
    { name: 'Apr', xp: 3908 },
    { name: 'May', xp: 4800 },
    { name: 'Jun', xp: 3800 },
];

function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="pt-4 pb-20 max-w-5xl mx-auto px-6">
            <header className="mb-10 border-b border-[var(--color-surface)] pb-6 flex items-end justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-text)] mb-6 transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Profile
                    </button>
                    <h1 className="text-5xl font-bold tracking-tight text-[var(--color-text)] uppercase leading-none">Dashboard</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mt-4">Core Analytics Transmission</p>
                </div>
                <div className="hidden md:block">
                    <Database size={48} strokeWidth={2} className="text-[var(--color-surface)]" />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Level Card */}
                <div className="bg-[var(--color-text)] text-white p-10 relative overflow-hidden group min-h-[450px] flex flex-col justify-between border border-[var(--color-text)] shadow-sm rounded-lg">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <Award size={48} className="text-[var(--color-accent)]" />
                            <span className="font-bold text-[10px] uppercase tracking-widest text-white/40">Current Rank // Elite</span>
                        </div>
                        <h2 className="text-5xl font-bold uppercase tracking-tight mb-4 leading-none">
                            Level 04
                        </h2>
                        <p className="font-bold text-lg text-[var(--color-accent)] uppercase tracking-widest mb-8">
                            Master Builder
                        </p>

                        <div className="mb-4">
                            <div className="flex justify-between mb-4 text-[10px] font-bold uppercase tracking-widest text-white/60">
                                <span>XP Progress</span>
                                <span className="text-white font-mono">2,400 / 3,000</span>
                            </div>
                            <div className="h-2 bg-white/10 border border-white/10 w-full overflow-hidden rounded-lg">
                                <div className="h-full bg-[var(--color-accent)] w-[80%] rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="border border-[var(--color-surface)] p-10 bg-white min-h-[450px] flex flex-col shadow-sm rounded-lg">
                    <div className="flex justify-between items-center mb-6 border-b border-[var(--color-surface)] pb-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Activity Metric // XP Flux
                        </h3>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 bg-[var(--color-accent)]" />
                            <span className="w-2 h-2 bg-[var(--color-text)]" />
                        </div>
                    </div>
                    <div className="flex-1 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--color-text)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    opacity={0.4}
                                    fontFamily="monospace"
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-text)', border: 'none', borderRadius: '0px', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace' }}
                                    cursor={{ stroke: 'var(--color-surface)', strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="xp"
                                    stroke="var(--color-accent)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorXp)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
