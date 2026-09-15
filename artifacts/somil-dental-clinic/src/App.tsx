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

const configuredClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPubKey = configuredClerkKey
  ? publishableKeyFromHost(window.location.hostname, configuredClerkKey)
  : undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const hasClerk = Boolean(clerkPubKey);
const assetPath = (name: string) => `${import.meta.env.BASE_URL}${name}`;

type ClinicSettings = {
  clinicName: string;
  phone: string;
  alternatePhone: string;
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

type PublicBranch = {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  sundayHours: string;
  mapUrl: string;
  imagePath: string | null;
};

const iconMap = { Baby, CheckCircle2, CircleDollarSign, ShieldCheck, Smile, Sparkles, Stethoscope };
const baseApiPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

const treatmentIcon = (name: string) => iconMap[name as keyof typeof iconMap] ?? Stethoscope;
const treatmentPrice = (price: string) => /^from\b/i.test(price.trim()) ? price : `From ${price}`;
const phoneHref = (value: string) => `tel:${value.replace(/[^\d+]/g, '')}`;

const siteUrl = 'https://somildentalclinic.com';

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [treatments, setTreatments] = useState<PublicTreatment[]>([]);
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [dataError, setDataError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;
    setIsLoadingData(true);
    setDataError('');
    void Promise.allSettled([
      fetch(`${baseApiPath}/settings`).then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load clinic settings.'))),
      fetch(`${baseApiPath}/treatments`).then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load treatments.'))),
      fetch(`${baseApiPath}/branches`).then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load clinic branches.'))),
    ]).then(([settingsResult, treatmentsResult, branchesResult]) => {
      if (cancelled) return;
      let hasFailure = false;
      if (settingsResult.status === 'fulfilled') setSettings(settingsResult.value.settings);
      else hasFailure = true;
      if (treatmentsResult.status === 'fulfilled') setTreatments(treatmentsResult.value.treatments);
      else hasFailure = true;
      if (branchesResult.status === 'fulfilled') setBranches(branchesResult.value.branches);
      else hasFailure = true;
      if (hasFailure) setDataError('Some clinic information is temporarily unavailable.');
       setIsLoadingData(false);
    });
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const clinicPhone = settings?.phone || '';
  const alternatePhone = settings?.alternatePhone || '';
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
            <img className="brand-logo" src={assetPath('sdc-logo.png')} alt="Somil Dental Clinic" />
            <span className="brand-copy"><strong>SOMIL</strong><span>DENTAL CLINIC</span></span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#top">Home</a>
            <a href="#about">About</a>
            <a href="#treatments">Treatments &amp; Pricing</a>
            <a href="#team">Team</a>
            <a href="#contact">Contact</a>
          </nav>
           {clinicPhone ? <a className="header-call-button" href={phoneHref(clinicPhone)}>
             <Phone size={14} />
             <span>Call</span>
           </a> : null}
          <button className="outline-top-button" onClick={() => openAppointment()}>Book Appointment <ArrowRight size={14} /></button>
           <button ref={menuButtonRef} className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>
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
            <div className="hero-kicker eyebrow hero-step hero-step-one">Dental care in Mumbai</div>
            <h1 id="hero-title" className="hero-step hero-step-two">Dr. Somil V Gupta<br /><em>Dentist at Somil Dental Clinic</em></h1>
            <p className="hero-lede hero-step hero-step-three">Thoughtful dental care in a comfortable environment, from routine checkups to focused treatment planning.</p>
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
                <img src={assetPath('doctor-real.jpeg')} alt="Dr. Somil V Gupta, dentist at Somil Dental Clinic" loading="eager" fetchPriority="high" decoding="sync" />
                <div className="hero-visual-wash" aria-hidden="true" />
                <div className="hero-visual-caption">
                  <span>SDC / CARE 01</span>
                  <strong>Comfort-led dentistry</strong>
                </div>
              </div>
               <div className="hero-floating-card hero-floating-card-patients">
                <span className="hero-floating-icon"><BadgeCheck size={15} /></span>
                 <span><strong>Clear guidance</strong><small>For your next step</small></span>
              </div>
              <div className="hero-floating-card hero-floating-card-care">
                <span className="hero-floating-icon"><HeartHandshake size={15} /></span>
                 <span><strong>Comfort-focused</strong><small>Patient-first care</small></span>
              </div>
              <div className="hero-floating-card hero-floating-card-satisfaction">
                 <strong>Care</strong>
                 <small>Shaped around you</small>
              </div>
            </div>
            <div className="hero-side-label">A considered approach to dental care</div>
            <div className="hero-side-line" />
            <p>Comfort first. Clear guidance. Treatment shaped around you.</p>
          </div>
           <div className="hero-proof hero-step hero-step-six" aria-label="Clinic services">
             {[
               ['Routine', 'Checkups'],
               ['Focused', 'Treatment'],
               ['Online', 'Booking'],
             ].map(([value, label]) => <div className="proof-item" key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </div>
      </section>
      {dataError ? (
        <div className="container-sdc public-data-alert" role="alert">
          <span>{dataError}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button>
        </div>
      ) : null}

      <section className="section" id="about" aria-labelledby="about-heading">
        <Reveal className="container-sdc story-grid">
          <div className="story-copy">
            <div className="eyebrow">About Somil Dental Clinic</div>
            <h2 id="about-heading" className="display">A healthier smile starts with feeling understood.</h2>
             <p>At Somil Dental Clinic, every treatment begins with listening. Dr. Somil provides endodontic and comprehensive dental care with a patient-first approach, clear explanations, and attention to comfort.</p>
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
           {isLoadingData ? <p className="public-data-loading" role="status">Loading treatment options…</p> : (
             <Reveal className="treatments-grid">
               {treatments.map(({ title, price, description, icon, imagePath }, index) => {
                 const Icon = treatmentIcon(icon);
                 return (
                 <article className="treatment-card" key={title}>
                   <div className="treatment-top"><span className="service-icon">{imagePath ? <img src={`${baseApiPath}/storage${imagePath}`} alt={`${title} treatment`} loading="lazy" decoding="async" /> : <Icon size={19} />}</span><span className="treatment-number">{String(index + 1).padStart(2, '0')}</span></div>
                   <h3>{title}</h3>
                   <p>{description}</p>
                   <div className="treatment-bottom"><strong>{treatmentPrice(price)}</strong><button className="treatment-book" onClick={() => openAppointment(title)} aria-label={`Book ${title}`}>Book now <ArrowRight size={14} /></button></div>
                 </article>
               );})}
             </Reveal>
           )}
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
            <div className="doctor-visual"><img src={assetPath('doctor-real.jpeg')} alt="Dr. Somil V Gupta, lead dentist and endodontist" /><span className="doctor-visual-label">SDC / 01</span></div>
            <div className="doctor-copy">
              <div className="eyebrow">Lead Dentist / Endodontist</div>
              <h3>Dr. Somil V Gupta</h3>
              <div className="qualification">BDS (JJ College)</div>
               <p>Dr. Somil provides endodontic and comprehensive dental care with a patient-first approach, clear explanations, and attention to comfort.</p>
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
             <article className="reason"><div className="reason-badge"><span>01</span><Stethoscope size={17} /></div><div><h3>Clear treatment planning</h3><p>Understand your options before deciding on the next step.</p></div></article>
             <article className="reason"><div className="reason-badge"><span>02</span><BadgeCheck size={17} /></div><div><h3>Patient-first visits</h3><p>Your questions and concerns are part of the conversation.</p></div></article>
             <article className="reason"><div className="reason-badge"><span>03</span><CircleDollarSign size={17} /></div><div><h3>Transparent starting prices</h3><p>Explore treatment starting prices before requesting an appointment.</p></div></article>
             <article className="reason"><div className="reason-badge"><span>04</span><HeartHandshake size={17} /></div><div><h3>Ongoing dental care</h3><p>Keep a clear plan for routine and focused dental needs.</p></div></article>
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
                  {clinicPhone ? <a className="contact-detail" href={phoneHref(clinicPhone)}><Phone size={17} /> <span>Primary: {clinicPhone}</span></a> : null}
                  {alternatePhone ? <a className="contact-detail" href={phoneHref(alternatePhone)}><Phone size={17} /> <span>Alternate: {alternatePhone}</span></a> : null}
                 {clinicEmail ? <a className="contact-detail" href={`mailto:${clinicEmail}`}><Mail size={17} /> {clinicEmail}</a> : null}
                 {clinicAddress ? <span className="contact-detail"><MapPin size={17} /> {clinicAddress}</span> : null}
                 {settings?.hours ? <span className="contact-detail"><Clock3 size={17} /> {settings.hours}<br /><span className="hours-subline">{settings.sundayHours}</span></span> : null}
                <div className="contact-branches"><span className="contact-branches-label">Our branches</span>{branches.map((branch) => <span className="contact-branch" key={branch.id}><strong>{branch.name}</strong><small>{branch.address}</small></span>)}</div>
              </div>
              <button className="button-primary" onClick={() => openAppointment()}>Book Appointment <ArrowRight size={15} /></button>
              <InquiryForm />
            </div>
             <div className="contact-map" aria-label={clinicAddress ? `Location: ${clinicAddress}` : 'Clinic location'}>
               <div className="map-grid" aria-hidden="true" /><div className="map-pin"><MapPin size={19} /></div><div className="map-label"><strong>Somil Dental Clinic</strong><span>{clinicAddress || 'Clinic location loading'}</span>{settings?.mapUrl ? <a href={settings.mapUrl} target="_blank" rel="noreferrer">Open map</a> : null}</div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="container-sdc">
          <div className="footer-grid">
             <div><a className="brand" href="#top"><span className="brand-mark">SDC</span><span className="brand-copy"><strong>SOMIL</strong><span>Dental clinic</span></span></a><p className="footer-intro">Thoughtful dental care with clear guidance and attention to comfort.</p></div>
            <div><h3>Quick Links</h3><div className="footer-links"><a href="#top">Home</a><a href="#treatments">Treatments &amp; Pricing</a><button onClick={() => openAppointment()}>Book Appointment</button><a href="#contact">Contact Us</a></div></div>
             <div><h3>Clinic Hours</h3><div className="footer-hours"><span>{settings?.hours || 'Hours loading'}</span><span>{settings?.sundayHours || ''}</span></div></div>
              <div><h3>Contact</h3><div className="footer-links contact-footer"><span>{clinicAddress || 'Clinic location loading'}</span>{clinicPhone ? <a href={phoneHref(clinicPhone)}>Primary: {clinicPhone}</a> : null}{alternatePhone ? <a href={phoneHref(alternatePhone)}>Alternate: {alternatePhone}</a> : null}{clinicEmail ? <a href={`mailto:${clinicEmail}`}>{clinicEmail}</a> : null}</div></div>
          </div>
           <div className="footer-bottom"><span>© {new Date().getFullYear()} Somil Dental Clinic. All rights reserved.</span><span>SDC · {clinicAddress || 'Clinic location'}</span></div>
        </div>
      </footer>
       {clinicWhatsApp ? <a
        className="whatsapp-float"
        href={`https://wa.me/${clinicWhatsApp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Somil Dental Clinic on WhatsApp"
      >
        <FaWhatsapp aria-hidden="true" />
        <span>WhatsApp</span>
       </a> : null}
      <DentalAssistant onBookAppointment={() => openAppointment()} settings={settings} treatments={treatments} />

    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <SeoMetadata />
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

function PublicRouter() {
  return (
    <RoutedErrorBoundary>
      <SeoMetadata />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/book" component={BookingPage} />
        <Route path="/admin" component={AuthSetupRequired} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function SeoMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.split('?')[0] || '/';
    const isHome = path === '/';
    const isBook = path === '/book';
    const isPublicPage = isHome;
    const title = isHome
      ? 'Somil Dental Clinic | Dental Care in Mumbai'
      : isBook
        ? 'Book an Appointment | Somil Dental Clinic'
        : 'Somil Dental Clinic';
    const description = isHome
      ? 'Somil Dental Clinic provides thoughtful dental care in Mumbai with clear treatment guidance and appointment requests online.'
      : isBook
        ? 'Request an appointment with Somil Dental Clinic in Mumbai.'
        : 'Somil Dental Clinic.';
    const canonical = `${siteUrl}${path === '/' ? '/' : path}`;
    document.title = title;
    const setMeta = (selector: string, attributes: Record<string, string>, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', { name: 'description' }, description);
    setMeta('meta[name="robots"]', { name: 'robots' }, isPublicPage ? 'index,follow' : 'noindex,follow');
    setMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    setMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, `${siteUrl}/sdc-logo.png`);
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, `${siteUrl}/sdc-logo.png`);
    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
    let structuredData = document.getElementById('clinic-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'clinic-structured-data';
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      '@id': `${siteUrl}/#clinic`,
      name: 'Somil Dental Clinic',
      url: siteUrl,
      image: `${siteUrl}/doctor-real.jpeg`,
      employee: {
        '@type': 'Person',
        name: 'Dr. Somil V Gupta',
      },
      sameAs: [],
    });
  }, [location]);

  return null;
}

function AuthSetupRequired() {
  return (
    <main className="auth-loading" style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Admin sign-in is not configured</h1>
      <p>The public clinic website is available, but admin access needs Clerk authentication configured for this deployment.</p>
      <a href={basePath || "/"}>Return to the clinic website</a>
    </main>
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
  if (!hasClerk) {
    return (
      <WouterRouter base={basePath}>
        <PublicRouter />
      </WouterRouter>
    );
  }

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