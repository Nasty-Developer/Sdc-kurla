import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  Baby,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  HeartHandshake,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import BookingPage from '@/pages/booking';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

const clinicAddress = 'Chawl bazar ward, Jai Ambika nagar, near Rolex hotel, Halav Pool, Kunchi kurway, Mumbai, Maharashtra 400070';
const clinicPhone = '+91 8591434914';
const clinicEmail = 'somilg449@gmail.com';
const clinicHours = 'Monday - Saturday, 6:30 PM - 10:00 PM';

const treatments = [
  { title: 'Dental Checkup', price: '₹100', copy: 'Complete oral examination and consultation.', icon: Stethoscope },
  { title: 'Teeth Cleaning', price: '₹500', copy: 'Professional scaling and polishing to remove plaque.', icon: Sparkles },
  { title: 'Tooth Extraction', price: '₹500', copy: 'Safe and painless removal of damaged teeth.', icon: ShieldCheck },
  { title: 'Root Canal Treatment', price: '₹3000', copy: 'Advanced endodontic therapy to save infected teeth.', icon: Stethoscope },
  { title: 'Dental Filling', price: '₹500', copy: 'Tooth-colored composite restorations for cavities.', icon: CheckCircle2 },
  { title: 'Teeth Whitening', price: '₹3000', copy: 'Advanced bleaching for a brighter, confident smile.', icon: Smile },
  { title: 'Braces / Orthodontics', price: '₹20000', copy: 'Straighten your teeth and correct your bite.', icon: Smile },
  { title: 'Dental Crown', price: '₹1500', copy: 'Ceramic caps to restore tooth shape and strength.', icon: ShieldCheck },
  { title: 'Dental Implant', price: '₹10000', copy: 'Permanent replacement for missing teeth.', icon: CircleDollarSign },
  { title: 'Pediatric Dentistry', price: '₹300', copy: 'Specialized, gentle dental care for children.', icon: Baby },
  { title: 'Dentures And RPD', price: '₹1500', copy: 'Removable bridge replacing missing teeth and gaps.', icon: Smile },
];

const testimonials = [
  { quote: 'Sample patient story — replace with a verified review from a Somil Dental Clinic patient.', name: 'Demo testimonial', detail: 'Placeholder content' },
  { quote: 'Sample patient story — this space is reserved for feedback shared with the clinic.', name: 'Demo testimonial', detail: 'Placeholder content' },
  { quote: 'Sample patient story — thoughtful care deserves to be described in a patient’s own words.', name: 'Demo testimonial', detail: 'Placeholder content' },
];

const stats = [
  ['500+', 'Happy Patients'],
  ['1000+', 'Treatments Done'],
  ['5+', 'Years Experience'],
  ['98%', 'Patient Satisfaction'],
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
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [, setLocation] = useLocation();
  const testimonial = testimonials[testimonialIndex];

  const openAppointment = (treatment = 'General Consultation') => {
    setMenuOpen(false);
    setLocation(`/book?treatment=${encodeURIComponent(treatment)}`);
  };
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
            <img className="brand-logo" src="/sdc-logo.png" alt="Somil Dental Clinic" />
            <span className="brand-copy"><strong>SOMIL</strong><span>DENTAL CLINIC</span></span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#top" data-testid="link-nav-home">Home</a>
            <a href="#about" data-testid="link-nav-about">About</a>
            <a href="#treatments" data-testid="link-nav-treatments">Treatments &amp; Pricing</a>
            <a href="#team" data-testid="link-nav-team">Team</a>
            <a href="#testimonials" data-testid="link-nav-testimonials">Testimonials</a>
            <a href="#contact" data-testid="link-nav-contact">Contact</a>
          </nav>
          <button className="outline-top-button" onClick={() => openAppointment()} data-testid="button-header-appointment">Book Appointment <ArrowRight size={14} /></button>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} data-testid="button-mobile-menu">
            {menuOpen ? <X size={22} /> : <Menu size={23} />}
          </button>
          {menuOpen && (
            <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
              <a href="#top" onClick={() => goTo('top')} data-testid="link-mobile-home">Home</a>
              <a href="#about" onClick={() => goTo('about')} data-testid="link-mobile-about">About</a>
              <a href="#treatments" onClick={() => goTo('treatments')} data-testid="link-mobile-treatments">Treatments &amp; Pricing</a>
              <a href="#team" onClick={() => goTo('team')} data-testid="link-mobile-team">Team</a>
              <a href="#testimonials" onClick={() => goTo('testimonials')} data-testid="link-mobile-testimonials">Testimonials</a>
              <a href="#contact" onClick={() => goTo('contact')} data-testid="link-mobile-contact">Contact</a>
              <button onClick={() => openAppointment()} data-testid="button-mobile-appointment">Book Appointment <ArrowRight size={15} /></button>
            </nav>
          )}
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="container-sdc hero-content">
          <div className="hero-copy">
            <div className="hero-kicker eyebrow hero-step hero-step-one">Top Rated Dental Clinic in Mumbai</div>
            <h1 id="hero-title" className="hero-step hero-step-two">Dr Somil Dental Clinic<br /><em>Your Perfect Smile Starts Here</em></h1>
            <p className="hero-lede hero-step hero-step-three">Experience world-class dental care in a comfortable, relaxing environment. From routine checkups to advanced cosmetic dentistry, we've got you covered.</p>
            <div className="button-row hero-step hero-step-four">
              <button className="button-primary" onClick={() => openAppointment()} data-testid="button-hero-appointment">Book Appointment <ArrowRight size={16} /></button>
              <a className="button-light" href="#treatments" data-testid="link-hero-treatments">View Treatments <ChevronRight size={16} /></a>
            </div>
            <div className="hero-trust hero-step hero-step-five"><span className="trust-seal"><BadgeCheck size={15} /></span><span><strong>500+</strong> Happy Patients</span><i>Comfort-led care</i></div>
          </div>
          <div className="hero-side hero-step hero-step-seven">
            <div className="hero-visual" aria-label="Somil Dental Clinic care team">
              <div className="hero-visual-ring hero-visual-ring-one" aria-hidden="true" />
              <div className="hero-visual-ring hero-visual-ring-two" aria-hidden="true" />
              <div className="hero-visual-media">
                <img src="/doctor-real.jpeg" alt="Dr. Somil V Gupta, dentist at Somil Dental Clinic" loading="eager" fetchPriority="high" decoding="sync" />
                <div className="hero-visual-wash" aria-hidden="true" />
                <div className="hero-visual-caption">
                  <span>SDC / CARE 01</span>
                  <strong>Comfort-led dentistry</strong>
                </div>
              </div>
              <div className="hero-floating-card hero-floating-card-patients">
                <span className="hero-floating-icon"><BadgeCheck size={15} /></span>
                <span><strong>500+</strong><small>Happy patients</small></span>
              </div>
              <div className="hero-floating-card hero-floating-card-care">
                <span className="hero-floating-icon"><HeartHandshake size={15} /></span>
                <span><strong>Pain-free</strong><small>Treatment approach</small></span>
              </div>
              <div className="hero-floating-card hero-floating-card-satisfaction">
                <strong>98%</strong>
                <small>Patient satisfaction</small>
              </div>
            </div>
            <div className="hero-side-label">A considered approach to dental care</div>
            <div className="hero-side-line" />
            <p>Comfort first. Clear guidance. Treatment shaped around you.</p>
          </div>
          <div className="hero-proof hero-step hero-step-six" aria-label="Clinic statistics">
            {stats.slice(0, 3).map(([value, label]) => <div className="proof-item" key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Clinic statistics">
        <Reveal className="container-sdc stats-grid">
          {stats.map(([value, label], index) => <div className="stat-item" key={label} data-testid={`stat-clinic-${index}`}><strong>{value}</strong><span>{label}</span></div>)}
        </Reveal>
      </section>

      <section className="section" id="about" aria-labelledby="about-heading">
        <Reveal className="container-sdc story-grid">
          <div className="story-copy">
            <div className="eyebrow">About Somil Dental Clinic</div>
            <h2 id="about-heading" className="display">A healthier smile starts with feeling understood.</h2>
            <p>At Somil Dental Clinic, every treatment begins with listening. Dr. Somil is a highly skilled endodontist dedicated to providing pain-free root canal treatments and comprehensive dental care. He believes in a patient-first approach, ensuring comfort and excellent results.</p>
            <div className="story-points">
              <div className="story-point"><span className="point-icon"><HeartHandshake size={16} /></span><div><strong>Patient-first care</strong><span>Your comfort and concerns shape every recommendation.</span></div></div>
              <div className="story-point"><span className="point-icon"><ShieldCheck size={16} /></span><div><strong>Clear treatment guidance</strong><span>We explain your options in a way that is easy to understand.</span></div></div>
              <div className="story-point"><span className="point-icon"><Check size={16} /></span><div><strong>Comfort-focused visits</strong><span>Thoughtful care for routine needs and complex treatment alike.</span></div></div>
            </div>
            <a href="#contact" className="button-ghost" data-testid="link-about-contact">Find the clinic <ArrowRight size={15} /></a>
          </div>
        </Reveal>
      </section>

      <section className="section section-tint" id="treatments" aria-labelledby="treatments-heading">
        <div className="container-sdc">
          <div className="section-head">
            <div><div className="eyebrow">Treatments &amp; Pricing</div><h2 id="treatments-heading">The right care,<br />clearly explained.</h2></div>
            <p>Explore our treatments and starting prices. Final pricing depends on your diagnosis and care plan.</p>
          </div>
          <Reveal className="treatments-grid">
            {treatments.map(({ title, price, copy, icon: Icon }, index) => (
              <article className="treatment-card" key={title} data-testid={`card-treatment-${index}`}>
                <div className="treatment-top"><span className="service-icon"><Icon size={19} /></span><span className="treatment-number">0{index + 1}</span></div>
                <h3>{title}</h3>
                <p>{copy}</p>
                <div className="treatment-bottom"><strong>From {price}</strong><button className="treatment-book" onClick={() => openAppointment(title)} aria-label={`Book ${title}`} data-testid={`button-book-treatment-${index}`}>Book now <ArrowRight size={14} /></button></div>
              </article>
            ))}
          </Reveal>
          <Reveal className="custom-plan">
            <div className="custom-plan-icon"><CalendarDays size={20} /></div>
            <div><div className="eyebrow">Personalized care</div><h3>Need a Custom Treatment Plan?</h3><p>Every smile is unique. Book a basic consultation and our experts will provide a detailed diagnosis and custom pricing plan.</p></div>
            <button className="button-primary" onClick={() => openAppointment('General Consultation')} data-testid="button-general-consultation">Book General Consultation <ArrowRight size={15} /></button>
          </Reveal>
        </div>
      </section>

      <section className="section care-band" aria-labelledby="process-heading">
        <Reveal className="container-sdc care-grid">
          <div>
            <div className="eyebrow">Your care, your pace</div>
            <h2 id="process-heading">A visit that makes sense from the first conversation.</h2>
            <p>Whether you need a routine checkup or focused treatment, we’ll meet you where you are with practical guidance and a plan you can feel good about.</p>
            <button className="button-light" onClick={() => openAppointment()} data-testid="button-process-appointment">Book Appointment <ArrowRight size={15} /></button>
          </div>
          <div className="care-steps" aria-label="What to expect">
            <div className="care-step"><span className="care-step-number">01</span><h3>Share what’s on your mind</h3><p>We begin with your experience and concerns.</p></div>
            <div className="care-step"><span className="care-step-number">02</span><h3>Understand your options</h3><p>We explain what we see, simply and clearly.</p></div>
            <div className="care-step"><span className="care-step-number">03</span><h3>Choose your next step</h3><p>You’ll know exactly what happens next.</p></div>
            <div className="care-step"><span className="care-step-number">04</span><h3>Keep your smile healthy</h3><p>We’re here for your ongoing dental care.</p></div>
          </div>
        </Reveal>
      </section>

      <section className="section" id="team" aria-labelledby="team-heading">
        <div className="container-sdc">
          <div className="section-head">
            <div><div className="eyebrow">The team</div><h2 id="team-heading">Skill, patience,<br />and a lighter touch.</h2></div>
            <p>Meet the clinician behind Somil Dental Clinic and the patient-first approach that shapes every visit.</p>
          </div>
          <Reveal className="doctor-profile">
            <div className="doctor-visual"><img src="/doctor-real.jpeg" alt="Dr. Somil V Gupta, lead dentist and endodontist" /><span className="doctor-visual-label">SDC / 01</span></div>
            <div className="doctor-copy">
              <div className="eyebrow">Lead Dentist / Endodontist</div>
              <h3>Dr. Somil V Gupta</h3>
              <div className="qualification">BDS (JJ College)</div>
              <p>Dr. Somil is a highly skilled endodontist dedicated to providing pain-free root canal treatments and comprehensive dental care. He believes in a patient-first approach, ensuring comfort and excellent results.</p>
              <div className="expertise"><span>Expertise</span><div><b>Root Canal Treatment</b><b>Cosmetic Dentistry</b><b>Pain Management</b></div></div>
              <button className="button-primary" onClick={() => openAppointment()} data-testid="button-doctor-appointment">Book Consultation <ArrowRight size={15} /></button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-tint" aria-labelledby="reasons-heading">
        <Reveal className="container-sdc reasons-grid">
          <div className="reasons-intro">
            <div className="eyebrow">Why choose SDC</div>
            <h2 id="reasons-heading" className="display reasons-heading">Good care is in the details.</h2>
            <p className="reasons-lede">Thoughtful systems, honest guidance, and a lighter touch at every stage of your care.</p>
            <div className="reasons-signature"><span className="reasons-signature-mark">SDC</span><div><strong>Care, considered</strong><span>From first conversation to follow-up.</span></div></div>
          </div>
          <div className="reason-list">
            <article className="reason"><div className="reason-badge"><span>01</span><Stethoscope size={17} /></div><div><h3>Modern Equipment</h3><p>State-of-the-art dental technology for painless treatments.</p></div></article>
            <article className="reason"><div className="reason-badge"><span>02</span><BadgeCheck size={17} /></div><div><h3>Experienced Team</h3><p>Highly qualified professionals dedicated to your smile.</p></div></article>
            <article className="reason"><div className="reason-badge"><span>03</span><CircleDollarSign size={17} /></div><div><h3>Affordable Prices</h3><p>Quality care that doesn't break the bank.</p></div></article>
            <article className="reason"><div className="reason-badge"><span>04</span><HeartHandshake size={17} /></div><div><h3>Emergency Care</h3><p>Prompt attention for severe toothaches and injuries.</p></div></article>
          </div>
        </Reveal>
      </section>

      <section className="charity-section" aria-labelledby="charity-heading">
        <Reveal className="container-sdc charity-card">
          <div className="charity-mark"><HeartHandshake size={24} /></div>
          <div className="charity-copy"><div className="eyebrow">Care that reaches further</div><h2 id="charity-heading">Help Poor Patients 💛</h2><p>100% of your donation is used to provide free or heavily subsidized dental treatments to those who cannot afford them.</p></div>
          <div className="charity-side"><div><strong>50+</strong><span>Patients Treated</span></div><div><strong>100%</strong><span>Transparent</span></div><button className="button-light" onClick={() => openAppointment('Dental Checkup')} data-testid="button-charity-donate">Donate for Free Checkup <ArrowRight size={15} /></button></div>
        </Reveal>
      </section>

      <section className="section testimonial-section" id="testimonials" aria-labelledby="testimonial-heading">
        <Reveal className="container-sdc testimonial-layout">
          <div className="testimonial-copy">
            <div className="quote-mark" aria-hidden="true">“</div>
            <div className="eyebrow">Testimonials</div>
            <h2 id="testimonial-heading">A space for patient voices.</h2>
            <p>These are demo placeholders until verified patient feedback is added. We believe every real story should be shared with permission.</p>
            <span className="placeholder-note"><BadgeCheck size={14} /> Demo content — not a verified review</span>
          </div>
          <div className="testimonial-card" data-testid="testimonial-current">
            <div className="stars" aria-label="Sample five star rating">{Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} size={14} fill="currentColor" />)}</div>
            <blockquote>“{testimonial.quote}”</blockquote>
            <div className="patient"><div className="patient-name"><strong>{testimonial.name}</strong><span>{testimonial.detail}</span></div><div className="testimonial-controls"><button className="circle-button" onClick={previousTestimonial} aria-label="Previous testimonial" data-testid="button-testimonial-previous"><ChevronLeft size={17} /></button><button className="circle-button" onClick={nextTestimonial} aria-label="Next testimonial" data-testid="button-testimonial-next"><ChevronRight size={17} /></button></div></div>
          </div>
        </Reveal>
      </section>

      <section className="section contact-section" id="contact" aria-labelledby="contact-heading">
        <div className="container-sdc">
          <Reveal className="contact-card">
            <div className="contact-copy">
              <div className="eyebrow">Contact Somil Dental Clinic</div>
              <h2 id="contact-heading">Your next visit starts here.</h2>
              <p>Call, email, or send an appointment request. We’ll help you take the next step with confidence.</p>
              <div className="contact-details">
                <a className="contact-detail" href={`tel:${clinicPhone.replace(/\s/g, '')}`} data-testid="link-contact-phone"><Phone size={17} /> {clinicPhone}</a>
                <a className="contact-detail" href={`mailto:${clinicEmail}`} data-testid="link-contact-email"><Mail size={17} /> {clinicEmail}</a>
                <span className="contact-detail"><MapPin size={17} /> {clinicAddress}</span>
                <span className="contact-detail"><Clock3 size={17} /> Monday - Saturday: 6:30 PM - 10:00 PM<br /><span className="hours-subline">Sunday: Closed for Maintenance</span></span>
              </div>
              <button className="button-primary" onClick={() => openAppointment()} data-testid="button-contact-appointment">Book Appointment <ArrowRight size={15} /></button>
            </div>
            <div className="contact-map" aria-label={`Location: ${clinicAddress}`}>
              <div className="map-grid" aria-hidden="true" /><div className="map-pin"><MapPin size={19} /></div><div className="map-label"><strong>Somil Dental Clinic</strong><span>Mumbai 400070</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="container-sdc">
          <div className="footer-grid">
            <div><a className="brand" href="#top" data-testid="link-footer-brand"><span className="brand-mark">SDC</span><span className="brand-copy"><strong>SOMIL</strong><span>Dental clinic</span></span></a><p className="footer-intro">Providing world-class dental care with a gentle touch. Your smile is our top priority.</p></div>
            <div><h3>Quick Links</h3><div className="footer-links"><a href="#top" data-testid="link-footer-home">Home</a><a href="#treatments" data-testid="link-footer-treatments">Treatments &amp; Pricing</a><button onClick={() => openAppointment()} data-testid="button-footer-appointment">Book Appointment</button><a href="#contact" data-testid="link-footer-contact">Contact Us</a><a href="#testimonials" data-testid="link-footer-feedback">Leave Feedback</a></div></div>
            <div><h3>Clinic Hours</h3><div className="footer-hours"><span>Monday - Saturday <b>6:30 PM - 10:00 PM</b></span><span>Sunday <b>Closed for Maintenance</b></span></div></div>
            <div><h3>Contact</h3><div className="footer-links contact-footer"><span>{clinicAddress}</span><a href={`tel:${clinicPhone.replace(/\s/g, '')}`} data-testid="link-footer-phone">{clinicPhone}</a><a href={`mailto:${clinicEmail}`} data-testid="link-footer-email">{clinicEmail}</a></div></div>
          </div>
          <div className="footer-bottom"><span>© 2026 Somil Dental Clinic. All rights reserved.</span><span>SDC · Mumbai, Maharashtra</span></div>
        </div>
      </footer>

    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/book" component={BookingPage} />
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