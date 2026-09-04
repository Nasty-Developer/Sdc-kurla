import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'wouter';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const clinicAddress = 'Chawl bazar ward, Jai Ambika nagar, near Rolex hotel, Halav Pool, Kunchi kurway, Mumbai, Maharashtra 400070';
const clinicPhone = '+91 8591434914';
const clinicEmail = 'somilg449@gmail.com';
const clinicHours = 'Monday - Saturday, 6:30 PM - 10:00 PM';

const treatmentOptions = [
  'General Consultation',
  'Dental Checkup',
  'Teeth Cleaning',
  'Tooth Extraction',
  'Root Canal Treatment',
  'Dental Filling',
  'Teeth Whitening',
  'Braces / Orthodontics',
  'Dental Crown',
  'Dental Implant',
  'Pediatric Dentistry',
  'Dentures And RPD',
] as const;

const appointmentTimes = [
  '6:30 PM',
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
  '9:30 PM',
  '10:00 PM',
] as const;

const bookingSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(80, 'Please keep your name under 80 characters.'),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{10,18}$/, 'Enter a valid phone number.'),
  email: z.string().trim().email('Enter a valid email address.'),
  age: z.string().trim().regex(/^\d{1,3}$/, 'Enter your age in years.').refine((value) => Number(value) >= 1 && Number(value) <= 120, 'Age must be between 1 and 120.'),
  treatment: z.enum(treatmentOptions, { errorMap: () => ({ message: 'Please choose a treatment.' }) }),
  preferredDate: z.string().min(1, 'Please choose a preferred date.').refine((value) => {
    const chosen = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(chosen.getTime()) && chosen >= today;
  }, 'Choose today or a future date.'),
  preferredTime: z.string().min(1, 'Please choose a preferred time.').refine((value) => appointmentTimes.includes(value as typeof appointmentTimes[number]), 'Choose one of the available appointment times.'),
  message: z.string().trim().max(500, 'Please keep your message under 500 characters.'),
});

type BookingValues = z.infer<typeof bookingSchema>;

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

const formatDate = (value: string) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(`${value}T00:00:00`));

export default function BookingPage() {
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<BookingValues | null>(null);
  const today = useMemo(getToday, []);
  const treatmentFromQuery = useMemo(() => {
    const query = location.split('?')[1] ?? '';
    const value = new URLSearchParams(query).get('treatment');
    return value && treatmentOptions.includes(value as typeof treatmentOptions[number]) ? value as typeof treatmentOptions[number] : 'General Consultation';
  }, [location]);

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      age: '',
      treatment: treatmentFromQuery,
      preferredDate: '',
      preferredTime: '',
      message: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    form.setValue('treatment', treatmentFromQuery, { shouldValidate: true });
  }, [form, treatmentFromQuery]);

  const handleSubmit = async (values: BookingValues) => {
    setIsSubmitting(true);
    try {
      const apiPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/appointments`;
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'We could not save your appointment.');
      }
      setSubmittedValues(values);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'We could not save your appointment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSubmittedValues(null);
    form.reset({
      fullName: '',
      phone: '',
      email: '',
      age: '',
      treatment: treatmentFromQuery,
      preferredDate: '',
      preferredTime: '',
      message: '',
    });
  };

  return (
    <main className="booking-page">
      <header className="booking-header">
        <div className="container-sdc booking-header-inner">
          <Link href="/" className="brand booking-brand" data-testid="link-booking-brand">
            <span className="brand-mark">SDC</span>
            <span className="brand-copy"><strong>SOMIL</strong><span>Dental clinic</span></span>
          </Link>
          <Link href="/" className="booking-back" data-testid="link-booking-home"><ArrowLeft size={15} /> Back to clinic</Link>
        </div>
      </header>

      <section className="booking-hero">
        <div className="booking-hero-lines" aria-hidden="true"><span /><span /><span /></div>
        <div className="container-sdc booking-intro">
          <div className="eyebrow">Somil Dental Clinic / Appointment desk</div>
          <h1>Book your appointment.</h1>
          <p>Choose your treatment and preferred time. Our clinic team will confirm your appointment.</p>
              <div className="booking-meta">
                <span><ShieldCheck size={16} /> Secure booking request</span>
            <span><Clock3 size={16} /> {clinicHours}</span>
          </div>
        </div>
      </section>

      <section className="booking-content">
        <div className="container-sdc booking-layout">
          {submittedValues ? (
            <section className="booking-confirmation" aria-live="polite" data-testid="status-booking-confirmation">
              <div className="confirmation-icon"><CheckCircle2 size={28} /></div>
              <div className="eyebrow">Request prepared</div>
              <h2>Thank you, {submittedValues.fullName}.</h2>
              <p className="confirmation-lede">Your appointment request has been securely sent to the clinic team. They will contact you to confirm availability.</p>
              <div className="confirmation-summary">
                <div><span>Treatment</span><strong data-testid="text-confirmation-treatment">{submittedValues.treatment}</strong></div>
                <div><span>Preferred date</span><strong data-testid="text-confirmation-date">{formatDate(submittedValues.preferredDate)}</strong></div>
                <div><span>Preferred time</span><strong data-testid="text-confirmation-time">{submittedValues.preferredTime}</strong></div>
                <div><span>Patient</span><strong data-testid="text-confirmation-name">{submittedValues.fullName}</strong></div>
              </div>
              <div className="confirmation-note">
                <strong>To confirm your visit</strong>
                <p>Please call Somil Dental Clinic on <a href={`tel:${clinicPhone.replace(/\s/g, '')}`} data-testid="link-confirmation-phone">{clinicPhone}</a>. The team can confirm availability and the next step.</p>
              </div>
              <div className="confirmation-actions">
                <button className="button-primary" onClick={resetBooking} data-testid="button-book-another">Make another request <ArrowRight size={15} /></button>
                <Link href="/" className="button-ghost" data-testid="link-confirmation-home">Return to home</Link>
              </div>
            </section>
          ) : (
            <section className="booking-form-card" aria-labelledby="booking-form-title">
              <div className="form-card-heading">
                <div>
                  <div className="eyebrow">Patient information</div>
                  <h2 id="booking-form-title">Tell us a little about your visit.</h2>
                </div>
                <span className="required-note">* Required</span>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="booking-form" noValidate>
                  <div className="booking-field-grid">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem className="booking-field">
                        <FormLabel>Full Name <span>*</span></FormLabel>
                        <FormControl><input {...field} autoComplete="name" placeholder="e.g. Aisha Mehta" data-testid="input-booking-full-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem className="booking-field">
                        <FormLabel>Phone Number <span>*</span></FormLabel>
                        <FormControl><input {...field} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 85914 34914" data-testid="input-booking-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem className="booking-field">
                        <FormLabel>Email <span>*</span></FormLabel>
                        <FormControl><input {...field} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" data-testid="input-booking-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="age" render={({ field }) => (
                      <FormItem className="booking-field">
                        <FormLabel>Age <span>*</span></FormLabel>
                        <FormControl><input {...field} type="number" inputMode="numeric" min="1" max="120" placeholder="Your age" data-testid="input-booking-age" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="form-section-label"><span>Appointment details</span><i /></div>
                  <FormField control={form.control} name="treatment" render={({ field }) => (
                    <FormItem className="booking-field">
                      <FormLabel>Select Treatment <span>*</span></FormLabel>
                      <FormControl>
                        <select {...field} data-testid="select-booking-treatment">
                          {treatmentOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                        </select>
                      </FormControl>
                      <FormDescription>Choose the closest match. We can clarify the plan during your visit.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="booking-field-grid">
                    <FormField control={form.control} name="preferredDate" render={({ field }) => (
                      <FormItem className="booking-field">
                        <FormLabel>Preferred Date <span>*</span></FormLabel>
                        <FormControl><input {...field} type="date" min={today} data-testid="input-booking-date" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="preferredTime" render={({ field }) => (
                      <FormItem className="booking-field">
                        <FormLabel>Preferred Time <span>*</span></FormLabel>
                        <FormControl>
                          <select {...field} data-testid="select-booking-time">
                            <option value="">Choose a time</option>
                            {appointmentTimes.map((time) => <option value={time} key={time}>{time}</option>)}
                          </select>
                        </FormControl>
                        <FormDescription>Clinic hours: 6:30 PM – 10:00 PM.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem className="booking-field">
                      <FormLabel>Additional Message / Problem Description</FormLabel>
                      <FormControl><textarea {...field} rows={4} placeholder="Tell us briefly what you would like help with." data-testid="textarea-booking-message" /></FormControl>
                      <FormDescription>Optional · 500 characters maximum.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <button className="button-primary booking-submit" type="submit" disabled={isSubmitting} data-testid="button-submit-booking">
                    {isSubmitting ? <><span className="button-loading" aria-hidden="true" /> Preparing your request…</> : <>Review request <ArrowRight size={16} /></>}
                  </button>
                  {form.formState.errors.root?.message ? <p className="booking-form-error" role="alert">{form.formState.errors.root.message}</p> : null}
                  <p className="booking-disclaimer">Your details are stored securely so the clinic team can manage your request.</p>
                </form>
              </Form>
            </section>
          )}

          <aside className="booking-aside">
            <div className="aside-card aside-contact">
              <div className="eyebrow">Need a hand?</div>
              <h2>Prefer to speak directly?</h2>
              <p>Call or email the clinic if you have a question about your care.</p>
              <a href={`tel:${clinicPhone.replace(/\s/g, '')}`} className="aside-contact-link" data-testid="link-booking-phone"><Phone size={16} /> {clinicPhone}</a>
              <a href={`mailto:${clinicEmail}`} className="aside-contact-link" data-testid="link-booking-email"><Mail size={16} /> {clinicEmail}</a>
            </div>
            <div className="aside-card aside-hours">
              <div className="aside-icon"><CalendarDays size={18} /></div>
              <div><div className="eyebrow">Clinic hours</div><strong>Monday – Saturday</strong><span>6:30 PM – 10:00 PM</span><strong>Sunday</strong><span>Closed for Maintenance</span></div>
            </div>
            <div className="aside-address"><MapPin size={16} /><span>{clinicAddress}</span></div>
          </aside>
        </div>
      </section>
    </main>
  );
}