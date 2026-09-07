import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight,
  BadgeCheck,
  Baby,
  CalendarDays,
  Check,
  CheckCircle2,
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
  Stethoscope,
  X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { ErrorBoundary } from '@/components/error-boundary';
import BookingPage from '@/pages/booking';
import NotFound from '@/pages/not-found';
import DentalAssistant from '@/components/dental-assistant';
import InquiryForm from '@/components/inquiry-form';
import AdminPage from '@/pages/admin';
import { Redirect, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

type ClinicSettings = {
  clinicName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  sundayHours: string;
  mapUrl: string;
};

type PublicTreatment = {
  id: number;
  title: string;
  price: string;
  description: string;
  icon: string;
  imagePath: string | null;
};

const iconMap = { Baby, CheckCircle2, CircleDollarSign, ShieldCheck, Smile, Sparkles, Stethoscope };
const baseApiPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

const treatmentIcon = (name: string) => iconMap[name as keyof typeof iconMap] ?? Stethoscope;

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
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [treatments, setTreatments] = useState<PublicTreatment[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetch(`${baseApiPath}/settings`).then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load clinic settings.'))),
      fetch(`${baseApiPath}/treatments`).then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load treatments.'))),
    ]).then(([settingsResult, treatmentsResult]) => {
      if (cancelled) return;
      setSettings(settingsResult.settings);
      setTreatments(treatmentsResult.treatments);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const clinicPhone = settings?.phone || '';
  const clinicWhatsApp = (settings?.whatsapp || settings?.phone || '').replace(/\D/g, '');
  const clinicEmail = settings?.email || '';
  const clinicAddress = settings?.address || '';

  const openAppointment = (treatment = 'General Consultation') => {
    setMenuOpen(false);
    setLocation(`/book?treatment=${encodeURIComponent(treatment)}`);
  };
  const goTo = (target: string) => {
    setMenuOpen(false);
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <main className="sdc-site">
      <header className="sdc-header">
        <div className="container-sdc sdc-header-inner">
          <a className="brand" href="#top" aria-label="Somil Dental Clinic home">
            <img className="brand-logo" src="/sdc-logo.png" alt="Somil Dental Clinic" />
            <span className="brand-copy"><strong>SOMIL</strong><span>DENTAL CLINIC</span></span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#top">Home</a>
            <a href="#about">About</a>
            <a href="#treatments">Treatments &amp; Pricing</a>
            <a href="#team">Team</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="header-call-button" href={`tel:${clinicPhone.replace(/\s/g, '')}`}>
            <Phone size={14} />
            <span>Call</span>
          </a>
          <button className="outline-top-button" onClick={() => openAppointment()}>Book Appointment <ArrowRight size={14} /></button>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>
            {menuOpen ? <X size={22} /> : <Menu size={23} />}
          </button>
          {menuOpen && (
            <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
              <a href="#top" onClick={() => goTo('top')}>Home</a>
              <a href="#about" onClick={() => goTo('about')}>About</a>
              <a href="#treatments" onClick={() => goTo('treatments')}>Treatments &amp; Pricing</a>
              <a href="#team" onClick={() => goTo('team')}>Team</a>
              <a href="#contact" onClick={() => goTo('contact')}>Contact</a>
              <button onClick={() => openAppointment()}>Book Appointment <ArrowRight size={15} /></button>
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
            <h1 id="hero-title" className="hero-step hero-step-two">Dr. Somil V Gupta<br /><em>Dentist at Somil Dental Clinic</em></h1>
            <p className="hero-lede hero-step hero-step-three">Your perfect smile starts here. Experience world-class dental care in a comfortable, relaxing environment. From routine checkups to advanced cosmetic dentistry, we've got you covered.</p>
            <div className="button-row hero-step hero-step-four">
              <button className="button-primary" onClick={() => openAppointment()}>Book Appointment <ArrowRight size={16} /></button>
              <a className="button-light" href="#treatments">View Treatments <ChevronRight size={16} /></a>
            </div>
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
            <a href="#contact" className="button-ghost">Find the clinic <ArrowRight size={15} /></a>
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
            {treatments.map(({ title, price, description, icon, imagePath }, index) => {
              const Icon = treatmentIcon(icon);
              return (
              <article className="treatment-card" key={title}>
                <div className="treatment-top"><span className="service-icon">{imagePath ? <img src={`${baseApiPath}/storage${imagePath}`} alt="" /> : <Icon size={19} />}</span><span className="treatment-number">{String(index + 1).padStart(2, '0')}</span></div>
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="treatment-bottom"><strong>From {price}</strong><button className="treatment-book" onClick={() => openAppointment(title)} aria-label={`Book ${title}`}>Book now <ArrowRight size={14} /></button></div>
              </article>
            );})}
          </Reveal>
          <Reveal className="custom-plan">
            <div className="custom-plan-icon"><CalendarDays size={20} /></div>
            <div><div className="eyebrow">Personalized care</div><h3>Need a Custom Treatment Plan?</h3><p>Every smile is unique. Book a basic consultation and our experts will provide a detailed diagnosis and custom pricing plan.</p></div>
            <button className="button-primary" onClick={() => openAppointment('General Consultation')}>Book General Consultation <ArrowRight size={15} /></button>
          </Reveal>
        </div>
      </section>

      <section className="section care-band" aria-labelledby="process-heading">
        <Reveal className="container-sdc care-grid">
          <div>
            <div className="eyebrow">Your care, your pace</div>
            <h2 id="process-heading">A visit that makes sense from the first conversation.</h2>
            <p>Whether you need a routine checkup or focused treatment, we’ll meet you where you are with practical guidance and a plan you can feel good about.</p>
            <button className="button-light" onClick={() => openAppointment()}>Book Appointment <ArrowRight size={15} /></button>
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
              <button className="button-primary" onClick={() => openAppointment()}>Book Consultation <ArrowRight size={15} /></button>
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
             <div className="charity-copy"><div className="eyebrow">Care that reaches further</div><h2 id="charity-heading">Help Poor Patients</h2><p>100% of your donation is used to provide free or heavily subsidized dental treatments to those who cannot afford them.</p></div>
           <div className="charity-side"><div><strong>50+</strong><span>Patients Treated</span></div><div><strong>100%</strong><span>Transparent</span></div><button className="button-light" onClick={() => openAppointment('Dental Checkup')}>Donate for Free Checkup <ArrowRight size={15} /></button></div>
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
                <a className="contact-detail" href={`tel:${clinicPhone.replace(/\s/g, '')}`}><Phone size={17} /> {clinicPhone}</a>
                <a className="contact-detail" href={`mailto:${clinicEmail}`}><Mail size={17} /> {clinicEmail}</a>
                <span className="contact-detail"><MapPin size={17} /> {clinicAddress}</span>
                <span className="contact-detail"><Clock3 size={17} /> {settings?.hours}<br /><span className="hours-subline">{settings?.sundayHours}</span></span>
              </div>
              <button className="button-primary" onClick={() => openAppointment()}>Book Appointment <ArrowRight size={15} /></button>
              <InquiryForm />
            </div>
            <div className="contact-map" aria-label={`Location: ${clinicAddress}`}>
              <div className="map-grid" aria-hidden="true" /><div className="map-pin"><MapPin size={19} /></div><div className="map-label"><strong>Somil Dental Clinic</strong><span>{clinicAddress}</span>{settings?.mapUrl ? <a href={settings.mapUrl} target="_blank" rel="noreferrer">Open map</a> : null}</div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="container-sdc">
          <div className="footer-grid">
            <div><a className="brand" href="#top"><span className="brand-mark">SDC</span><span className="brand-copy"><strong>SOMIL</strong><span>Dental clinic</span></span></a><p className="footer-intro">Providing world-class dental care with a gentle touch. Your smile is our top priority.</p></div>
            <div><h3>Quick Links</h3><div className="footer-links"><a href="#top">Home</a><a href="#treatments">Treatments &amp; Pricing</a><button onClick={() => openAppointment()}>Book Appointment</button><a href="#contact">Contact Us</a></div></div>
            <div><h3>Clinic Hours</h3><div className="footer-hours"><span>{settings?.hours}</span><span>{settings?.sundayHours}</span></div></div>
            <div><h3>Contact</h3><div className="footer-links contact-footer"><span>{clinicAddress}</span><a href={`tel:${clinicPhone.replace(/\s/g, '')}`}>{clinicPhone}</a><a href={`mailto:${clinicEmail}`}>{clinicEmail}</a></div></div>
          </div>
          <div className="footer-bottom"><span>© 2026 Somil Dental Clinic. All rights reserved.</span><span>SDC · Mumbai, Maharashtra</span></div>
        </div>
      </footer>
      <a
        className="whatsapp-float"
        href={`https://wa.me/${clinicWhatsApp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Somil Dental Clinic on WhatsApp"
      >
        <FaWhatsapp aria-hidden="true" />
        <span>WhatsApp</span>
      </a>
      <DentalAssistant onBookAppointment={() => openAppointment()} settings={settings} treatments={treatments} />

    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/book" component={BookingPage} />
        <Route path="/admin" component={AdminRoute} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="auth-loading"><div className="admin-spinner" /></div>;
  return isSignedIn ? <Redirect to="/admin" /> : <Home />;
}

function AdminRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="auth-loading"><div className="admin-spinner" /></div>;
  return isSignedIn ? <AdminPage /> : <Redirect to="/sign-in" />;
}

function SignInPage() {
  return <div className="auth-page"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="auth-page"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        theme: shadcn,
        options: {
          logoPlacement: 'inside',
          logoLinkUrl: basePath || '/',
          logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
        },
        variables: {
          colorPrimary: 'hsl(190 66% 34%)',
          colorForeground: 'hsl(211 58% 20%)',
          colorMutedForeground: 'hsl(204 18% 45%)',
          colorDanger: 'hsl(0 70% 50%)',
          colorBackground: 'hsl(203 40% 98%)',
          colorInput: '#ffffff',
          colorInputForeground: 'hsl(211 58% 20%)',
          colorNeutral: 'hsl(191 38% 79%)',
          fontFamily: "'Manrope', sans-serif",
          borderRadius: '0.75rem',
        },
        elements: {
          cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden',
          card: '!shadow-none !border-0 !bg-transparent !rounded-none',
          footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
          headerTitle: 'text-slate-900',
          headerSubtitle: 'text-slate-600',
          socialButtonsBlockButtonText: 'text-slate-800',
          formFieldLabel: 'text-slate-800',
          footerActionLink: 'text-teal-700',
          footerActionText: 'text-slate-600',
          dividerText: 'text-slate-500',
          formButtonPrimary: 'bg-teal-700 hover:bg-teal-800',
          formFieldInput: 'border-slate-200 text-slate-900',
          socialButtonsBlockButton: 'border-slate-200 bg-white',
          alertText: 'text-red-700',
          main: 'bg-transparent',
        },
      }}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => window.history.pushState({}, '', to)}
      routerReplace={(to) => window.history.replaceState({}, '', to)}
    >
      <WouterRouter base={basePath}>
        <Router />
      </WouterRouter>
    </ClerkProvider>
  );
}

export default App;