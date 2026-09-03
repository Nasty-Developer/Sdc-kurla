import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, HeartHandshake, MapPin, Menu, Phone, ShieldCheck, Smile, Sparkles, Star, Stethoscope, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

const services = [
  { title: 'Preventive care', copy: 'Thoughtful checkups and cleanings that keep small concerns from becoming big ones.', icon: ShieldCheck },
  { title: 'Cosmetic dentistry', copy: 'Subtle, natural-looking improvements that let your own smile lead the way.', icon: Sparkles },
  { title: 'Restorative care', copy: 'Comfort-first treatment to help you eat, speak, and smile with confidence again.', icon: Stethoscope },
  { title: 'Children’s dentistry', copy: 'A calm, friendly first experience that builds healthy habits for life.', icon: Smile },
  { title: 'Invisalign®', copy: 'A discreet, considered approach to a straighter smile, planned around your life.', icon: Check },
  { title: 'Emergency visits', copy: 'When something feels wrong, we make space to listen and help you feel better.', icon: HeartHandshake },
];

const testimonials = [
  { quote: 'Every part of the experience feels considered. I finally feel like I understand my dental health, rather than just being told what to do.', name: 'Rhea S.', detail: 'Patient since 2021' },
  { quote: 'The team made my daughter feel completely at ease. She left asking when she could come back, which I never thought I would say about a dentist.', name: 'Anita M.', detail: 'Parent of a young patient' },
  { quote: 'I appreciated the honesty more than anything. The plan was clear, unhurried, and the result looks like me — just a little more confident.', name: 'Karan D.', detail: 'Cosmetic care patient' },
];

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -48px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`reveal-on-scroll ${visible ? 'is-visible' : ''} ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonial = testimonials[testimonialIndex];

  const goTo = (target: string) => {
    setMenuOpen(false);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  };
  const previousTestimonial = () => setTestimonialIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  const nextTestimonial = () => setTestimonialIndex((current) => (current + 1) % testimonials.length);

  return (
    <main className="sdc-site">
      <header className="sdc-header">
        <div className="container-sdc sdc-header-inner">
          <a className="brand" href="#top" aria-label="Somil Dental Clinic home" data-testid="link-brand">
            <span className="brand-mark">SDC</span>
            <span className="brand-copy"><strong>SOMIL</strong><span>Dental clinic</span></span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#about" data-testid="link-nav-about">About us</a>
            <a href="#care" data-testid="link-nav-care">Our care</a>
            <a href="#team" data-testid="link-nav-team">The team</a>
            <a href="#contact" data-testid="link-nav-contact">Contact</a>
          </nav>
          <button className="outline-top-button" onClick={() => setAppointmentOpen(true)} data-testid="button-header-appointment">Book a visit</button>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} data-testid="button-mobile-menu">
            {menuOpen ? <X size={22} /> : <Menu size={23} />}
          </button>
          {menuOpen && (
            <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
              <a href="#about" onClick={() => setMenuOpen(false)} data-testid="link-mobile-about">About us</a>
              <a href="#care" onClick={() => setMenuOpen(false)} data-testid="link-mobile-care">Our care</a>
              <a href="#team" onClick={() => setMenuOpen(false)} data-testid="link-mobile-team">The team</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} data-testid="link-mobile-contact">Contact</a>
              <a href="#contact" onClick={() => { setMenuOpen(false); setAppointmentOpen(true); }} data-testid="link-mobile-appointment">Book a visit <ArrowRight size={15} /></a>
            </nav>
          )}
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="container-sdc hero-content">
          <div className="reveal">
            <div className="hero-kicker eyebrow">A better dental visit</div>
            <h1 id="hero-title">Care that feels<br /><em>personal.</em></h1>
            <p className="hero-lede">Modern dentistry, rooted in listening. Welcome to Somil Dental Clinic — a neighborhood practice for healthier smiles and calmer visits.</p>
            <div className="button-row">
              <button className="button-primary" onClick={() => setAppointmentOpen(true)} data-testid="button-hero-appointment">Book an appointment <ArrowRight size={16} /></button>
              <a className="button-light" href="#care" data-testid="link-hero-services">Explore our care</a>
            </div>
            <div className="hero-note"><Check size={15} /> Gentle care, clear conversations, no pressure.</div>
          </div>
          <div className="hero-proof reveal reveal-delay" aria-label="Clinic highlights">
            <div className="proof-item"><strong>15+</strong><span>years of care</span></div>
            <div className="proof-item"><strong>4.9 / 5</strong><span>patient rated</span></div>
            <div className="proof-item"><strong>1:1</strong><span>attention always</span></div>
          </div>
        </div>
      </section>

       <section className="trust-strip" aria-label="Clinic assurances">
         <Reveal className="container-sdc trust-inner">
          <p className="trust-label">A practice built around your peace of mind.</p>
          <div className="trust-list">
            <span><BadgeCheck size={18} /> Transparent care</span>
            <span><ShieldCheck size={18} /> Gentle approach</span>
            <span><CalendarDays size={18} /> Flexible scheduling</span>
            <span><HeartHandshake size={18} /> Family friendly</span>
          </div>
         </Reveal>
      </section>

      <section className="section" id="about" aria-labelledby="about-heading">
         <Reveal className="container-sdc story-grid">
          <div className="story-image">
             <img src="https://images.pexels.com/photos/3845734/pexels-photo-3845734.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Male dentist carefully treating a patient in a bright dental clinic" />
            <div className="image-tag"><strong>Here, you’re heard.</strong><span>Every visit starts with a conversation.</span></div>
          </div>
          <div className="story-copy">
            <div className="eyebrow">The SDC difference</div>
            <h2 id="about-heading" className="display">Good dentistry begins with feeling understood.</h2>
            <p>We believe a dental practice should feel like a trusted part of your life, not a place you brace yourself for. Our approach is unhurried, honest, and tailored to what matters to you.</p>
            <div className="story-points">
              <div className="story-point"><span className="point-icon"><HeartHandshake size={16} /></span><div><strong>We take time to listen</strong><span>Your concerns, preferences, and questions guide the plan.</span></div></div>
              <div className="story-point"><span className="point-icon"><ShieldCheck size={16} /></span><div><strong>We keep things clear</strong><span>No jargon or surprises — just considered recommendations.</span></div></div>
              <div className="story-point"><span className="point-icon"><Smile size={16} /></span><div><strong>We care for the whole family</strong><span>From first visits to long-term maintenance and everything between.</span></div></div>
            </div>
            <a href="#contact" className="button-ghost" data-testid="link-about-contact">Meet your neighborhood clinic <ArrowRight size={15} /></a>
          </div>
         </Reveal>
      </section>

      <section className="section section-tint" id="care" aria-labelledby="care-heading">
        <div className="container-sdc">
          <div className="section-head">
            <div><div className="eyebrow">Our care</div><h2 id="care-heading">Everything your smile needs.<br />Nothing it doesn’t.</h2></div>
            <p>Personalized treatment, delivered with a light touch. Explore the ways we can help you feel at home in your smile.</p>
          </div>
           <Reveal className="services-grid">
            {services.map(({ title, copy, icon: Icon }, index) => (
              <article className="service-card" key={title} data-testid={`card-service-${index}`}>
                <div><span className="service-icon"><Icon size={20} /></span><h3>{title}</h3><p>{copy}</p></div>
                <a href="#contact" className="service-link" data-testid={`link-service-${index}`}>Learn more <ArrowRight size={14} /></a>
              </article>
            ))}
           </Reveal>
        </div>
      </section>

      <section className="section care-band" aria-labelledby="process-heading">
         <Reveal className="container-sdc care-grid">
          <div>
            <div className="eyebrow">A calmer way forward</div>
            <h2 id="process-heading">Your visit, at your pace.</h2>
            <p>Whether it’s been six months or six years, you can start exactly where you are. We’ll meet you there — with patience, practical guidance, and a plan that makes sense.</p>
            <button className="button-light" onClick={() => setAppointmentOpen(true)} data-testid="button-process-appointment">Start with a conversation <ArrowRight size={15} /></button>
          </div>
          <div className="care-steps" aria-label="What to expect">
            <div className="care-step"><span className="care-step-number">01</span><h3>Tell us what’s on your mind</h3><p>We begin with your experience, not a checklist.</p></div>
            <div className="care-step"><span className="care-step-number">02</span><h3>Get a clear picture</h3><p>We explain what we see, simply and without pressure.</p></div>
            <div className="care-step"><span className="care-step-number">03</span><h3>Choose your next step</h3><p>You’ll leave knowing exactly what happens next.</p></div>
            <div className="care-step"><span className="care-step-number">04</span><h3>Keep your smile thriving</h3><p>We’re here for the long term, not just today.</p></div>
          </div>
         </Reveal>
      </section>

      <section className="section" id="team" aria-labelledby="team-heading">
        <div className="container-sdc">
          <div className="section-head">
            <div><div className="eyebrow">The people behind the care</div><h2 id="team-heading">Warm people.<br />Exceptional dentistry.</h2></div>
            <p>Our small, dedicated team believes clinical excellence and kindness belong in the same room.</p>
          </div>
           <Reveal className="team-grid">
             <article className="team-card team-card-featured" data-testid="card-team-somil"><img src="https://images.pexels.com/photos/3845737/pexels-photo-3845737.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="Dr Somil V. Gupta treating a patient in the dental clinic" /><div className="team-meta"><strong>Dr Somil V. Gupta</strong><span>Lead dentist · BDS, MDS</span></div></article>
           </Reveal>
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="reasons-heading">
         <Reveal className="container-sdc reasons-grid">
           <div className="reasons-image"><img src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=85" alt="Close-up dental examination with a mirror and dental instrument" /></div>
          <div>
            <div className="eyebrow">Why patients choose SDC</div>
            <h2 id="reasons-heading" className="display" style={{ color: 'hsl(var(--primary))', fontSize: 'clamp(2rem, 3.4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-.06em', margin: '12px 0 0' }}>The little things make a big difference.</h2>
            <div className="reason-list">
              <div className="reason"><span>01</span><div><h3>Calm by design</h3><p>From the first hello to the last instruction, your comfort is part of the treatment.</p></div></div>
              <div className="reason"><span>02</span><div><h3>Honest recommendations</h3><p>We’ll always tell you what we would tell someone we love — with options, not pressure.</p></div></div>
              <div className="reason"><span>03</span><div><h3>Modern, thoughtful care</h3><p>Contemporary techniques and technology, used only when they genuinely help.</p></div></div>
            </div>
          </div>
         </Reveal>
      </section>

      <section className="section testimonial-section" aria-labelledby="testimonial-heading">
         <Reveal className="container-sdc testimonial-layout">
          <div className="testimonial-copy">
            <div className="quote-mark" aria-hidden="true">“</div>
            <div className="eyebrow">From our patients</div>
            <h2 id="testimonial-heading">The kind words we never take for granted.</h2>
            <p>Every review is a reminder of why we do this: to make good care feel a little more human.</p>
          </div>
          <div className="testimonial-card" data-testid="testimonial-current">
            <div className="stars" aria-label="Five star review">{Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} size={14} fill="currentColor" />)}</div>
            <blockquote>“{testimonial.quote}”</blockquote>
            <div className="patient">
              <div className="patient-name"><strong>{testimonial.name}</strong><span>{testimonial.detail}</span></div>
              <div className="testimonial-controls">
                <button className="circle-button" onClick={previousTestimonial} aria-label="Previous testimonial" data-testid="button-testimonial-previous"><ChevronLeft size={17} /></button>
                <button className="circle-button" onClick={nextTestimonial} aria-label="Next testimonial" data-testid="button-testimonial-next"><ChevronRight size={17} /></button>
              </div>
            </div>
          </div>
         </Reveal>
      </section>

      <section className="section contact-section" id="contact" aria-labelledby="contact-heading">
        <div className="container-sdc">
           <Reveal className="contact-card">
            <div className="contact-copy">
              <div className="eyebrow">Come say hello</div>
              <h2 id="contact-heading">Your next best step starts here.</h2>
              <p>Have a question, need a checkup, or simply want to meet us first? We’d love to welcome you in.</p>
              <div className="contact-details">
                <a className="contact-detail" href="tel:+912240123456" data-testid="link-contact-phone"><Phone size={17} /> +91 22 4012 3456</a>
                <span className="contact-detail"><MapPin size={17} /> 14, Somil Avenue, Bandra West, Mumbai</span>
                <span className="contact-detail"><Clock3 size={17} /> Mon–Sat · 9:00 am – 7:00 pm</span>
              </div>
              <button className="button-primary" onClick={() => setAppointmentOpen(true)} data-testid="button-contact-appointment">Book your visit <ArrowRight size={15} /></button>
            </div>
            <div className="contact-map" aria-label="Illustrated map showing Somil Dental Clinic location">
              <div className="map-pin"><MapPin size={19} /></div><div className="map-label">Somil Dental Clinic</div>
             </div>
           </Reveal>
          </div>
      </section>

      <footer className="footer">
        <div className="container-sdc">
          <div className="footer-grid">
            <div><a className="brand" href="#top" data-testid="link-footer-brand"><span className="brand-mark">SDC</span><span className="brand-copy"><strong>SOMIL</strong><span>Dental clinic</span></span></a><p className="footer-intro">Modern dentistry with a more human touch. Proudly caring for the neighborhood since 2009.</p></div>
            <div><h3>Explore</h3><div className="footer-links"><a href="#about" data-testid="link-footer-about">About us</a><a href="#care" data-testid="link-footer-care">Our care</a><a href="#team" data-testid="link-footer-team">Our team</a><a href="#contact" data-testid="link-footer-contact">Contact</a></div></div>
            <div><h3>Visit us</h3><div className="footer-hours"><span>Monday–Friday <b>9–7</b></span><span>Saturday <b>9–4</b></span><span>Sunday <b>Closed</b></span></div></div>
            <div><h3>Start a conversation</h3><div className="footer-links"><a href="tel:+912240123456" data-testid="link-footer-phone">+91 22 4012 3456</a><a href="mailto:hello@somildental.in" data-testid="link-footer-email">hello@somildental.in</a><a href="#contact" data-testid="link-footer-book">Book an appointment <ArrowRight size={13} /></a></div></div>
          </div>
          <div className="footer-bottom"><span>© 2024 Somil Dental Clinic. All rights reserved.</span><span><a href="#contact" data-testid="link-footer-privacy">Privacy</a> &nbsp;·&nbsp; Made for better visits.</span></div>
        </div>
      </footer>

      {appointmentOpen && (
        <div className="appointment-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAppointmentOpen(false); }}>
          <section className="appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-heading">
            <button className="modal-close" onClick={() => setAppointmentOpen(false)} aria-label="Close appointment details" data-testid="button-close-appointment"><X size={18} /></button>
            <div className="eyebrow">Let’s find a good time</div>
            <h2 id="appointment-heading">A calmer dental visit is one call away.</h2>
            <p>This is a static preview of the booking experience. Call our care team and we’ll find a time that works for you.</p>
            <a className="button-primary modal-call" href="tel:+912240123456" data-testid="link-modal-phone"><Phone size={16} /> Call +91 22 4012 3456</a>
            <span className="modal-hours"><Clock3 size={14} /> Mon–Sat, 9:00 am – 7:00 pm</span>
          </section>
        </div>
      )}
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;