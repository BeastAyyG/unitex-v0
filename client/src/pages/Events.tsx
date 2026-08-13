import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Filter, Plus, X, Sparkles, CheckCircle } from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '../components/ui/drawer';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';
import { useMediaQuery } from '../hooks/use-media-query';
import { cn } from '../lib/utils';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { subscribeToEvents, createEvent, rsvpEvent } from '@/lib/firestore';
import { toast } from 'sonner';

function Events() {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([]);
    const [createEventOpen, setCreateEventOpen] = useState(false);
    const [newEventDate, setNewEventDate] = useState<Date | undefined>(new Date());
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Registration form state
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [registerEventId, setRegisterEventId] = useState<string | null>(null);
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regSeats, setRegSeats] = useState('1');
    const [regSuccess, setRegSuccess] = useState(false);

    useEffect(() => {
        const unsub = subscribeToEvents((data) => {
            setEvents(data);
        });
        return () => unsub();
    }, []);

    const openRegisterDialog = (eventId: string) => {
        setRegisterEventId(eventId);
        setRegName(currentUser?.displayName || '');
        setRegEmail(currentUser?.email || '');
        setRegSeats('1');
        setRegSuccess(false);
        setRegisterDialogOpen(true);
    };

    const handleRegister = async () => {
        if (!regName.trim() || !regEmail.trim() || !currentUser) return;
        if (registerEventId !== null) {
            try {
                await rsvpEvent(registerEventId, currentUser.uid);
                setRsvpedEvents(prev => [...prev, registerEventId]);
                setRegSuccess(true);
                setTimeout(() => {
                    setRegisterDialogOpen(false);
                    setRegSuccess(false);
                }, 2000);
            } catch (err) {
                toast.error("Failed to register for event");
            }
        }
    };

    const handleUnregister = (id: string) => {
        setRsvpedEvents(prev => prev.filter(item => item !== id));
        toast.success("Registration cancelled (Local preview)");
    };

    const registeringEvent = events.find(e => e.id === registerEventId);

    // Shared Form Component
    const EventForm = ({ className }: { className?: string }) => {
        const [title, setTitle] = useState('');
        const [time, setTime] = useState('');
        const [desc, setDesc] = useState('');
        const [loading, setLoading] = useState(false);

        const handleCreate = async () => {
            if (!title || !desc || !time || !newEventDate || !currentUser) return;
            setLoading(true);
            try {
                await createEvent({
                    title,
                    description: desc,
                    date: newEventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    time,
                    mode: 'Remote',
                    community: currentUser.displayName || 'UniteX Community',
                    hostUid: currentUser.uid
                });
                toast.success("Event created!");
                setCreateEventOpen(false);
                setTitle('');
                setDesc('');
                setTime('');
            } catch (err) {
                toast.error("Error creating event");
            } finally {
                setLoading(false);
            }
        };

        return (
            <FieldGroup className={cn("p-4 md:p-0", className)}>
                <Field>
                    <FieldLabel>Event Title</FieldLabel>
                    <Input placeholder="e.g. React Pattern Deep Dive" value={title} onChange={e => setTitle(e.target.value)} />
                    <FieldDescription>Choose a catchy title for your event.</FieldDescription>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel>Date</FieldLabel>
                        <DatePicker date={newEventDate} setDate={setNewEventDate} className="w-full" />
                    </Field>
                    <Field>
                        <FieldLabel>Time</FieldLabel>
                        <Input placeholder="6:00 PM EST" value={time} onChange={e => setTime(e.target.value)} />
                    </Field>
                </div>

                <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea placeholder="Describe what attendees can expect..." className="h-24" value={desc} onChange={e => setDesc(e.target.value)} />
                    <FieldDescription>Markdown is supported.</FieldDescription>
                </Field>

                <Button 
                    onClick={handleCreate} 
                    disabled={loading || !title || !desc || !time}
                    className="w-full bg-[var(--color-accent)] text-white font-bold uppercase tracking-widest hover:opacity-90 transition-opacity rounded-lg mt-2"
                >
                    {loading ? "Publishing..." : "Publish Event"}
                </Button>
            </FieldGroup>
        );
    };

    return (
        <div className="pt-4 pb-10 max-w-7xl mx-auto px-4 md:px-8">
            <header className="flex flex-col md:flex-row justify-between items-end mb-4 border-b border-[var(--color-surface)] pb-4 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] uppercase leading-none">
                        Events
                    </h1>
                    <p className="text-[10px] md:text-xs text-[var(--color-text)] opacity-40 mt-3 font-bold uppercase tracking-widest">
                        Learn • Connect • Grow
                    </p>
                </div>
                <div className="flex gap-3">
                    {isDesktop ? (
                        <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
                            <DialogTrigger asChild>
                                <button
                                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3 transition-all border border-[var(--color-surface)] bg-white text-[var(--color-text)] shadow-sm hover:bg-gray-50 rounded-lg"
                                >
                                    <Plus size={16} /> Create Event
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
                                <div className="bg-[var(--color-surface)]/20 p-6">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                                            <Plus size={18} className="text-[var(--color-accent)]" /> Host an Event
                                        </DialogTitle>
                                        <DialogDescription className="text-xs opacity-60 font-mono hidden">
                                            Fill out the details to host a new community event.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <EventForm />
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Drawer open={createEventOpen} onOpenChange={setCreateEventOpen}>
                            <DrawerTrigger asChild>
                                <button
                                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors border text-[var(--color-text)] border-[var(--color-surface)] hover:bg-[var(--color-surface)]"
                                >
                                    <Plus size={14} /> Create Event
                                </button>
                            </DrawerTrigger>
                            <DrawerContent className="bg-white">
                                <div className="mx-auto w-full max-w-sm">
                                    <DrawerHeader>
                                        <DrawerTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 justify-center">
                                            <Plus size={18} className="text-[var(--color-accent)]" /> Host an Event
                                        </DrawerTitle>
                                        <DrawerDescription className="text-xs opacity-60 font-mono text-center">
                                            Fill out the details below.
                                        </DrawerDescription>
                                    </DrawerHeader>
                                    <div className="p-4 pb-0">
                                        <EventForm />
                                    </div>
                                    <DrawerFooter>
                                        <DrawerClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </div>
                            </DrawerContent>
                        </Drawer>
                    )}

                    <button className="flex items-center gap-2 text-[var(--color-text)] text-xs font-bold uppercase tracking-widest border border-[var(--color-surface)] px-6 py-3 bg-white shadow-sm hover:bg-gray-50 transition-all rounded-lg">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Events List */}
                <div className="lg:col-span-9 flex flex-col gap-2">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <div key={event.id} className="group relative">
                                <Link to={`/events/${event.id}`} className="flex flex-col sm:flex-row bg-white border border-[var(--color-surface)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mb-2 rounded-lg">
                                    {/* Date Badge */}
                                    <div className="sm:w-32 bg-gray-50 flex flex-row sm:flex-col items-center justify-between sm:justify-center p-2 border-b sm:border-b-0 sm:border-r border-[var(--color-surface)] group-hover:bg-[var(--color-surface)] transition-colors">
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl font-bold tracking-tight leading-none text-[var(--color-text)]">{event.date?.split(' ')[1]?.replace(',', '') || '??'}</span>
                                            <span className="text-[10px] uppercase tracking-widest font-bold mt-2 text-gray-400">{event.date?.split(' ')[0] || 'TBD'}</span>
                                        </div>
                                        <span className="sm:hidden text-xs font-bold uppercase tracking-widest text-[var(--color-text)]">{event.time}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 flex-1 flex flex-col text-[var(--color-text)]">
                                        <div className="flex gap-4 text-[10px] mb-3 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 bg-[var(--color-surface)] px-2 py-0.5 rounded-lg"><MapPin size={12} /> {event.mode}</span>
                                            <span className="hidden sm:flex items-center gap-1.5 border border-[var(--color-surface)] px-2 py-0.5 rounded-lg font-medium opacity-60"><CalendarIcon size={12} /> {event.time}</span>
                                        </div>

                                        <h3 className="text-2xl md:text-3xl font-bold mb-2 uppercase tracking-tight leading-none group-hover:text-[var(--color-accent)] transition-colors">{event.title}</h3>
                                        <p className="text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-widest mb-4">Hosted by {event.community}</p>
                                        <p className="opacity-60 leading-relaxed mb-6 text-sm font-medium line-clamp-2">{event.description}</p>

                                        <div className="flex justify-between items-center border-t border-[var(--color-surface)] pt-4 mt-auto">
                                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                <Users size={16} className="text-[var(--color-accent)]" /> {event.attendees || 0} Registered
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (rsvpedEvents.includes(event.id)) {
                                                        handleUnregister(event.id);
                                                    } else {
                                                        openRegisterDialog(event.id);
                                                    }
                                                }}
                                                className={cn(
                                                    "px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border border-[var(--color-surface)] rounded-lg relative z-10",
                                                    rsvpedEvents.includes(event.id)
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : "bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] shadow-sm"
                                                )}
                                            >
                                                {rsvpedEvents.includes(event.id) ? "✓ Registered" : "Book Seat"}
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <CalendarIcon />
                                </EmptyMedia>
                                <EmptyTitle>No Upcoming Events</EmptyTitle>
                                <EmptyDescription>
                                    There are no events scheduled at this time. Why not host one?
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button
                                    onClick={() => setCreateEventOpen(true)}
                                    className="bg-[var(--color-text)] text-white hover:bg-[var(--color-accent)] font-bold uppercase tracking-widest text-xs h-9 rounded-lg"
                                >
                                    Host an Event
                                </Button>
                            </EmptyContent>
                        </Empty>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-3 hidden lg:block">
                    <div className="sticky top-6">
                        <div className="mb-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-[var(--color-surface)] inline-block">Categories</h3>
                            <div className="flex flex-col gap-3">
                                {["General Events", "Workshops", "Hackathons", "Competitions", "Bootcamps"].map(tag => (
                                    <div key={tag} className="flex items-center justify-between group cursor-pointer border border-transparent hover:border-[var(--color-surface)] hover:bg-gray-50 p-2.5 transition-all -mx-2 rounded-lg">
                                        <span className="text-[11px] font-bold text-[var(--color-text)] uppercase tracking-tight">{tag}</span>
                                        <span className="text-[10px] font-bold bg-[var(--color-surface)] text-[var(--color-text)] px-2 py-0.5 rounded-lg">12</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-white border border-[var(--color-surface)] shadow-sm rounded-lg">
                            <h4 className="font-bold uppercase tracking-widest text-[10px] text-gray-400 mb-4 flex items-center gap-2">
                                <Sparkles size={14} className="text-[var(--color-accent)]" /> Pro Tip
                            </h4>
                            <p className="text-[12px] leading-relaxed font-medium text-[var(--color-text)] opacity-60">
                                "Hosting events boosts your community reputation. Consistent hosts see 20% higher engagement on their posts."
                            </p>
                        </div>
                    </div>
                </aside>
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
                                    <p className="text-xs opacity-60 font-medium mt-2">See you at {registeringEvent?.title}!</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <DialogHeader className="mb-8">
                                    <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
                                        Register for Event
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mt-2">
                                        {registeringEvent?.title} • {registeringEvent?.date}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6">
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

export default Events;
