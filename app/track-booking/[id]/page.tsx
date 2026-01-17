'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import BookingStatusTracker from '@/components/booking/BookingStatusTracker';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  Share2,
  Download,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

interface BookingDetails {
  id: string;
  status: string;
  payment_status: string;
  scheduled_at: string;
  total_amount: number;
  currency: string;
  customer_address: any;
  notes?: string;
  service: {
    name: string;
    name_ar: string;
    description?: string;
  };
  provider: {
    name: string;
    name_ar: string;
    rating?: number;
    phone?: string;
  };
}

export default function TrackBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    const shareData = {
      title: language === 'ar' ? 'تتبع الحجز' : 'Track Booking',
      text: language === 'ar' ? `تابع حجزك رقم ${booking?.id}` : `Track your booking ${booking?.id}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: language === 'ar' ? 'تم المشاركة' : 'Shared',
          description: language === 'ar' ? 'تم مشاركة رابط الحجز بنجاح' : 'Booking link shared successfully',
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: language === 'ar' ? 'تم النسخ' : 'Copied',
          description: language === 'ar' ? 'تم نسخ رابط الحجز إلى الحافظة' : 'Booking link copied to clipboard',
        });
      });
    }
  };

  const handleDownloadInvoice = () => {
    if (!booking) return;

    const doc = new jsPDF();

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(language === 'ar' ? 'فاتورة الحجز' : 'Booking Invoice', 105, 20, { align: 'center' });

    // Company info (placeholder)
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Saas Market', 20, 40);
    doc.text(language === 'ar' ? 'منصة السوق السعودي' : 'Saudi Market Platform', 20, 50);

    // Booking details
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details', 20, 70);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`${language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'} ${booking.id}`, 20, 85);
    doc.text(`${language === 'ar' ? 'الحالة:' : 'Status:'} ${booking.status}`, 20, 95);
    doc.text(`${language === 'ar' ? 'تاريخ الخدمة:' : 'Service Date:'} ${new Date(booking.scheduled_at).toLocaleDateString()}`, 20, 105);

    // Service details
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details', 20, 125);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`${language === 'ar' ? 'الخدمة:' : 'Service:'} ${language === 'ar' ? booking.service.name_ar : booking.service.name}`, 20, 140);
    doc.text(`${language === 'ar' ? 'مقدم الخدمة:' : 'Provider:'} ${language === 'ar' ? booking.provider.name_ar : booking.provider.name}`, 20, 150);

    // Customer info
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(language === 'ar' ? 'معلومات العميل' : 'Customer Information', 20, 170);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (customerAddress.name) doc.text(`${language === 'ar' ? 'الاسم:' : 'Name:'} ${customerAddress.name}`, 20, 185);
    if (customerAddress.phone) doc.text(`${language === 'ar' ? 'الهاتف:' : 'Phone:'} ${customerAddress.phone}`, 20, 195);
    if (customerAddress.email) doc.text(`${language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'} ${customerAddress.email}`, 20, 205);
    if (customerAddress.address) doc.text(`${language === 'ar' ? 'العنوان:' : 'Address:'} ${customerAddress.address}`, 20, 215);

    // Total
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`${language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'} ${booking.total_amount} ${booking.currency}`, 20, 235);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(language === 'ar' ? 'شكراً لاستخدامك منصة السوق السعودي' : 'Thank you for using Saas Market', 105, 280, { align: 'center' });

    // Save the PDF
    doc.save(`invoice-${booking.id}.pdf`);

    toast({
      title: language === 'ar' ? 'تم التحميل' : 'Downloaded',
      description: language === 'ar' ? 'تم تحميل الفاتورة بنجاح' : 'Invoice downloaded successfully',
    });
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings/${params.id}/status`);
      const data = await response.json();

      if (response.ok && data.success) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'فشل في تحميل بيانات الحجز');
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text={language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading...'} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorMessage
              title={language === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}
              message={error || (language === 'ar' ? 'لم يتم العثور على الحجز' : 'Booking not found')}
              onRetry={fetchBookingDetails}
              retryText={language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  let customerAddress = booking.customer_address;
  if (typeof customerAddress === 'string') {
    try {
      customerAddress = JSON.parse(customerAddress);
    } catch (e) {
      customerAddress = { address: customerAddress };
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8 px-4 border-b">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
              <ArrowLeft className="h-4 w-4 ml-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Button>
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'تتبع الحجز' : 'Track Booking'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'تابع حالة حجزك لحظة بلحظة' : 'Track your booking status in real-time'}
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
          <BookingStatusTracker
            bookingId={params.id as string}
            onStatusChange={(status) => {
              console.log('Status changed:', status);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'الخدمة' : 'Service'}
                  </p>
                  <p className="font-semibold">
                    {language === 'ar' ? booking.service.name_ar : booking.service.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'مقدم الخدمة' : 'Service Provider'}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {language === 'ar' ? booking.provider.name_ar : booking.provider.name}
                    </p>
                    {booking.provider.rating && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {booking.provider.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'موعد الخدمة' : 'Scheduled Date'}
                  </p>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {new Date(booking.scheduled_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {booking.total_amount} {language === 'ar' ? 'ريال' : booking.currency}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h2>
              <div className="space-y-3">
                {customerAddress.name && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'الاسم' : 'Name'}
                      </p>
                      <p className="font-medium">{customerAddress.name}</p>
                    </div>
                  </div>
                )}
                {customerAddress.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'الهاتف' : 'Phone'}
                      </p>
                      <p className="font-medium" dir="ltr">{customerAddress.phone}</p>
                    </div>
                  </div>
                )}
                {customerAddress.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </p>
                      <p className="font-medium">{customerAddress.email}</p>
                    </div>
                  </div>
                )}
                {customerAddress.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'العنوان' : 'Address'}
                      </p>
                      <p className="font-medium">{customerAddress.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {booking.notes && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-3">
                {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
              </h2>
              <p className="text-muted-foreground">{booking.notes}</p>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                {language === 'ar' ? 'مشاركة' : 'Share'}
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleDownloadInvoice}>
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تحميل الفاتورة' : 'Download Invoice'}
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
