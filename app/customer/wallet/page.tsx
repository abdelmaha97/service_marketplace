'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CustomerWalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 useEffect(() => {
  const fetchWallet = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response: any = await api.get('/wallet');

      // تحقق آمن من البيانات
      setWallet(response?.data?.wallet ?? null);
      setTransactions(response?.data?.transactions ?? []);
    } catch (error: any) {
      console.error(error);
      setWallet(null);
      setTransactions([]);
      setError(
        error?.message || (language === 'ar' ? 'فشل في تحميل المحفظة' : 'Failed to load wallet')
      );
    } finally {
      setLoading(false);
    }
  };

  fetchWallet();
}, [user, language]);


 const handleRefresh = async () => {
  setLoading(true);
  setError('');
  try {
    const response: any = await api.get('/wallet');
    setWallet(response?.data?.wallet ?? null);
    setTransactions(response?.data?.transactions ?? []);
  } catch (error: any) {
    console.error(error);
    setWallet(null);
    setTransactions([]);
    setError(
      error?.message || (language === 'ar' ? 'فشل في تحديث المحفظة' : 'Failed to refresh wallet')
    );
  } finally {
    setLoading(false);
  }
};


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {language === 'ar' ? 'الرجاء تسجيل الدخول' : 'Please login'}
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Header />
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/customer/profile')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'العودة' : 'Back'}
            </Button>
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'محفظتي' : 'My Wallet'}
            </h1>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : wallet ? (
          <div className="space-y-6">
            {/* Wallet Balance */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}
                  </h2>
                  <p className="text-3xl font-bold text-green-600">
                    {wallet.balance} {wallet.currency}
                  </p>
                </div>
                <Wallet className="w-12 h-12 text-green-600" />
              </div>
            </Card>

            {/* Transactions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {language === 'ar' ? 'العمليات الأخيرة' : 'Recent Transactions'}
              </h2>

              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد عمليات' : 'No transactions yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{transaction.amount} {transaction.currency}
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لم يتم العثور على المحفظة' : 'Wallet not found'}
            </p>
          </Card>
        )}
      </div>
       <Footer />
    </div>
  );
}
