import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-mark">SDC</span>
        <div className="eyebrow">Somil Dental Clinic</div>
        <p className="not-found-code">404</p>
        <h1>That page is not part of this visit.</h1>
        <p className="not-found-copy">Return to Somil Dental Clinic to explore treatments, pricing, and appointment information.</p>
        <Link href="/" className="button-primary" data-testid="link-not-found-home"><ArrowLeft size={15} /> Back to home</Link>
        <span className="not-found-location"><MapPin size={13} /> Mumbai, Maharashtra 400070</span>
      </div>
    </main>
  );
}