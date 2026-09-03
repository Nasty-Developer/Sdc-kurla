<<<<<<< HEAD
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
=======
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              404 Page Not Found
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
>>>>>>> origin/main
