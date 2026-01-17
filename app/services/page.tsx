'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Star,
  Clock,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Service {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  currency: string;
  duration: number;
  images: string[];
  category: {
    id: string;
    name: string;
    nameAr: string;
  };
  provider: {
    id: string;
    name: string;
    nameAr: string;
    rating: number;
    totalReviews: number;
    logo: string;
    verificationStatus: string;
  };
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();

  // جلب الفئات عند التحميل الأولي
  useEffect(() => {
    fetchCategories();
  }, []);

  // جلب الخدمات عند تغيير الفلاتر
  useEffect(() => {
    fetchServices();
  }, [selectedCategory, currentPage, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data?.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      
      if (selectedCategory) {
        params.append('category_id', selectedCategory);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/services?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const result = await response.json();

      if (result.success) {
        setServices(result.data?.services || []);
        setPagination(result.data?.pagination || null);
      } else {
        setError(result.error || (language === 'ar' ? 'فشل تحميل الخدمات' : 'Failed to load services'));
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : (language === 'ar' ? 'حدث خطأ في تحميل الخدمات' : 'Error loading services'));
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getDisplayText = (textEn: string, textAr: string) => {
    return language === 'ar' ? textAr : textEn;
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4 overflow-hidden border-b">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
                {language === 'ar' ? 'الخدمات المتاحة' : 'Available Services'}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {language === 'ar' ? 'اكتشف أفضل الخدمات المحترفة' : 'Discover the best professional services'}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                {language === 'ar' ? 'عدد النتائج:' : 'Total Results:'}{' '}
                <span className="font-semibold text-foreground">
                  {pagination?.total || 0}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن خدمة...' : 'Search for a service...'}
                value={searchTerm}
                onChange={handleSearch}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 ml-2" />
                {language === 'ar' ? 'التصفية' : 'Filters'}
              </Button>
            </div>
          </div>

          {error && (
            <Card className="p-4 mb-6 border-destructive">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive">{error}</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
              <Card className="p-6 sticky top-24 rounded-2xl shadow-lg border-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">
                    {language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="rounded-xl">
                    {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                  </Button>
                </div>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b hover:bg-muted/50 rounded-lg px-2 transition-colors">
                    <span className="font-semibold">
                      {language === 'ar' ? 'الفئات' : 'Categories'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 pb-6 space-y-3">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => {
                            setSelectedCategory(category.id);
                            setCurrentPage(1);
                          }}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">
                          {getDisplayText(category.name, category.nameAr)}
                        </span>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === null}
                        onChange={() => {
                          setSelectedCategory(null);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm">
                        {language === 'ar' ? 'جميع الفئات' : 'All Categories'}
                      </span>
                    </label>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              {services.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {services.map((service) => (
                      <Link key={service.id} href={`/services/${service.id}`}>
                        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border-2 hover:border-primary h-full flex flex-col rounded-2xl">
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-2xl">
                            {service.images?.[0] ? (
                              <img
                                src={service.images[0]}
                                alt={service.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Wrench className="h-16 w-16 text-primary/40" />
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                              {getDisplayText(service.name, service.nameAr)}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
                              {getDisplayText(service.description, service.descriptionAr)}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                              <Shield className="h-4 w-4" />
                              <span className="line-clamp-1">
                                {getDisplayText(
                                  service.provider.name,
                                  service.provider.nameAr
                                )}
                              </span>
                            </p>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">
                                  {service.provider.rating?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                ({service.provider.totalReviews || 0})
                              </span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {getDisplayText(
                                  service.category.name,
                                  service.category.nameAr
                                )}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t mt-auto">
                              <div>
                                <div className="text-2xl font-bold text-primary">
                                  {service.price}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.duration} {language === 'ar' ? 'دقيقة' : 'minute'}
                                </div>
                              </div>
                              <Link href={`/booking/${service.id}`}>
                                <Button className="btn-primary">
                                  {language === 'ar' ? 'احجز الآن' : 'Book Now'}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-6">
                      <Button
                        variant="outline"
                        disabled={!pagination.hasPrevPage}
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                      >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </Button>
                      <span className="px-4 py-2">
                        {language === 'ar' 
                          ? `الصفحة ${pagination.page} من ${pagination.totalPages}` 
                          : `Page ${pagination.page} of ${pagination.totalPages}`
                        }
                      </span>
                      <Button
                        variant="outline"
                        disabled={!pagination.hasNextPage}
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              pagination.totalPages,
                              currentPage + 1
                            )
                          )
                        }
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {language === 'ar' ? 'لا توجد نتائج' : 'No Results'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {language === 'ar' 
                      ? 'لم يتم العثور على خدمات تطابق معايير البحث' 
                      : 'No services found matching your search criteria'
                    }
                  </p>
                  <Button onClick={resetFilters}>
                    {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}