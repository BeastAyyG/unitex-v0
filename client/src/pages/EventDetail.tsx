import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Clock, Info, ShieldCheck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MOCK_EVENTS } from '@/utils/mockData';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

function EventDetail() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const event = MOCK_EVENTS.find(e => e.id.toString() === eventId) || MOCK_EVENTS[0];
    const [isGoing, setIsGoing] = useState(false);

    // Registration form state
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regSeats, setRegSeats] = useState('1');
    const [regSuccess, setRegSuccess] = useState(false);

    const handleRegister = () => {
        if (!regName.trim() || !regEmail.trim()) return;
        setRegSuccess(true);
        setIsGoing(true);
        setTimeout(() => {
            setRegisterDialogOpen(false);
            setRegSuccess(false);
        }, 2000);
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-6 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="bg-white border border-[var(--color-surface)] rounded-none overflow-hidden shadow-brutal-sm">
                {/* Header */}
                <div className="bg-[var(--color-surface)]/10 p-8 md:p-10 border-b border-[var(--color-surface)]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="space-y-3">
                            <span className="px-3 py-1 bg-[var(--color-text)] text-white text-[9px] font-bold uppercase tracking-widest rounded-lg">
                                {event.community}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none uppercase">
                                {event.title}
                            </h1>
                        </div>
                        <Button 
                            onClick={() => {
                                if (isGoing) {
                                    setIsGoing(false);
                                } else {
                                    setRegisterDialogOpen(true);
                                }
                            }}
                            className={cn(
                                "h-12 px-8 rounded-lg border border-[var(--color-text)] font-bold uppercase tracking-widest text-[10px] transition-all",
                                isGoing ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)]"
                            )}
                        >
                            {isGoing ? "✓ Registered" : "Register Now"}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Date</div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                <Calendar size={14} className="text-[var(--color-accent)]" /> {event.date}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Time</div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                <Clock size={14} className="text-[var(--color-accent)]" /> {event.time}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Location</div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                <MapPin size={14} className="text-[var(--color-accent)]" /> {event.mode}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Attendees</div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                <Users size={14} className="text-[var(--color-accent)]" /> {event.attendees} Registered
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h3 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2 border-b border-[var(--color-surface)] pb-2">
                                <Info size={18} className="text-[var(--color-accent)]" /> About this event
                            </h3>
                            <div className="text-base leading-relaxed text-[var(--color-text)] opacity-80 whitespace-pre-wrap font-medium">
                                {event.longDescription}
                            </div>
                        </section>

                        <section className="bg-blue-50/30 border border-blue-100 p-6 rounded-lg">
                            <h4 className="font-bold uppercase tracking-widest text-[9px] text-blue-900 mb-3 flex items-center gap-2">
                                <ShieldCheck size={16} /> Community Integrity
                            </h4>
                            <p className="text-xs font-medium text-blue-900/70 leading-relaxed italic">
                                "This event follows our Community Guidelines. Attendees are expected to contribute meaningfully to the discussions and respect the knowledge-sharing environment."
                            </p>
                        </section>
                    </div>

                    <aside className="space-y-8">
                        <div>
                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-[var(--color-surface)] inline-block">Hosted by</h3>
                            <Link to={`/profile/${event.host.id}`} className="flex items-center gap-4 p-4 bg-white border border-[var(--color-surface)] shadow-brutal-sm group cursor-pointer hover:border-[var(--color-accent)] transition-all rounded-lg">
                                <Avatar className="w-10 h-10 rounded-lg border border-[var(--color-surface)]">
                                    <AvatarImage src={event.host.avatar} className="grayscale group-hover:grayscale-0 transition-all" />
                                    <AvatarFallback>{event.host.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-sm uppercase tracking-tight">{event.host.name}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-40">Community Lead</div>
                                </div>
                            </Link>
                        </div>

                        <div className="border-t border-[var(--color-surface)] pt-6">
                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-4">Share Event</h3>
                            <div className="flex flex-col gap-2">
                                <Button className="w-full rounded-lg border border-[var(--color-surface)] bg-white text-[var(--color-text)] font-bold text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all h-10">Share on Twitter</Button>
                                <Button className="w-full rounded-lg border border-[var(--color-surface)] bg-white text-[var(--color-text)] font-bold text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all h-10">Share on LinkedIn</Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Registration Dialog */}
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white">
                    <div className="p-8">
                        {regSuccess ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-100 italic">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tight">Registration Confirmed</h3>
                                    <p className="text-xs opacity-60 font-medium mt-2">See you at {event.title}!</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <DialogHeader className="mb-8">
                                    <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                                        Register for Event
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mt-2">
                                        {event.title} • {event.date}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 text-[var(--color-text)]">
                                    <Field>
                                        <FieldLabel>Full Name</FieldLabel>
                                        <Input 
                                            placeholder="Alexander..." 
                                            value={regName}
                                            onChange={(e) => setRegName(e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Email Address</FieldLabel>
                                        <Input 
                                            type="email" 
                                            placeholder="alexander@unitex.io" 
                                            value={regEmail}
                                            onChange={(e) => setRegEmail(e.target.value)}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel>Number of Seats</FieldLabel>
                                        <select 
                                            className="w-full bg-gray-50 border border-gray-100 p-4 text-xs font-bold uppercase tracking-widest focus:bg-white focus:outline-none rounded-lg"
                                            value={regSeats}
                                            onChange={(e) => setRegSeats(e.target.value)}
                                        >
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <option key={n} value={n}>{n} {n === 1 ? 'Seat' : 'Seats'}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <div className="pt-4 flex flex-col gap-3">
                                        <Button 
                                            onClick={handleRegister}
                                            disabled={!regName.trim() || !regEmail.trim()}
                                            className="w-full bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] font-bold uppercase tracking-widest text-xs h-14 rounded-lg disabled:opacity-50"
                                        >
                                            Confirm Registration
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setRegisterDialogOpen(false)}
                                            className="text-[9px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default EventDetail;
