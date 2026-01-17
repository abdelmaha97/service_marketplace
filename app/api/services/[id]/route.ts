import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant' },
        { status: 400 }
      );
    }

    // Fetch service details
    let services: any[];
    try {
      services = await query<any[]>(`
        SELECT
          s.id,
          s.name,
          s.name_ar,
          s.description,
          s.description_ar,
          COALESCE(s.base_price, 0) as price,
          s.currency,
          s.duration_minutes as duration,
          s.pricing_type,
          s.images,
          s.is_active,
          s.created_at,
          sc.id as category_id,
          sc.name as category_name,
          sc.name_ar as category_name_ar,
          sp.id as provider_id,
          sp.business_name as provider_name,
          sp.business_name_ar as provider_name_ar,
          sp.description as provider_description,
          COALESCE(sp.rating, 0) as provider_rating,
          COALESCE(sp.total_reviews, 0) as provider_total_reviews,
          COALESCE(sp.total_bookings, 0) as provider_total_bookings,
          sp.logo as provider_logo,
          sp.verification_status as provider_verification_status,
          sp.featured as provider_featured,
          sp.user_id as provider_user_id
        FROM services s
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN service_providers sp ON s.provider_id = sp.id
        WHERE s.id = ? AND s.tenant_id = ? AND s.is_active = TRUE
        LIMIT 1
      `, [params.id, tenant.id]);
      console.log('Service query successful');
    } catch (error) {
      console.error('Service query failed:', error);
      throw new Error('Failed to fetch service data');
    }

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const service = services[0];

    // Fetch addons
    let addons: any[];
    try {
      addons = await query<any[]>(`
        SELECT
          id,
          name,
          name_ar,
          COALESCE(price, 0) as price,
          is_required
        FROM service_addons
        WHERE service_id = ?
        ORDER BY is_required DESC, name ASC
      `, [params.id]);
      console.log('Addons query successful');
    } catch (error) {
      console.error('Addons query failed:', error);
      throw new Error('Failed to fetch addons data');
    }

    // Fetch reviews
    let reviews: any[];
    try {
      reviews = await query<any[]>(`
        SELECT
          r.id,
          r.rating,
          r.comment,
          r.media,
          r.is_verified,
          r.created_at,
          r.updated_at,
          u.id as customer_id,
          u.first_name,
          u.last_name,
          u.avatar_url
        FROM reviews r
        JOIN users u ON r.customer_id = u.id
        WHERE r.service_id = ? AND r.tenant_id = ?
        ORDER BY r.is_verified DESC, r.created_at DESC
        LIMIT 10
      `, [params.id, tenant.id]);
      console.log('Reviews query successful');
    } catch (error) {
      console.error('Reviews query failed:', error);
      throw new Error('Failed to fetch reviews data');
    }

    // Fetch rating stats
    let ratingStats: any[];
    try {
      ratingStats = await query<any[]>(`
        SELECT
          rating,
          COUNT(*) as count
        FROM reviews
        WHERE service_id = ? AND tenant_id = ?
        GROUP BY rating
        ORDER BY rating DESC
      `, [params.id, tenant.id]);
      console.log('Rating stats query successful');
    } catch (error) {
      console.error('Rating stats query failed:', error);
      throw new Error('Failed to fetch rating statistics');
    }

    const totalReviews = ratingStats.reduce((sum, stat) => sum + stat.count, 0);
    const ratingBreakdown = {
      5: totalReviews > 0 ? Math.round((ratingStats.find(s => s.rating === 5)?.count || 0) / totalReviews * 100) : 0,
      4: totalReviews > 0 ? Math.round((ratingStats.find(s => s.rating === 4)?.count || 0) / totalReviews * 100) : 0,
      3: totalReviews > 0 ? Math.round((ratingStats.find(s => s.rating === 3)?.count || 0) / totalReviews * 100) : 0,
      2: totalReviews > 0 ? Math.round((ratingStats.find(s => s.rating === 2)?.count || 0) / totalReviews * 100) : 0,
      1: totalReviews > 0 ? Math.round((ratingStats.find(s => s.rating === 1)?.count || 0) / totalReviews * 100) : 0,
    };

    let parsedImages: string[] = [];
    if (service.images) {
      try {
        parsedImages = typeof service.images === 'string'
          ? JSON.parse(service.images)
          : service.images;
      } catch (e) {
        console.warn('Failed to parse service images');
        parsedImages = [];
      }
    }

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      media: review.media ? (typeof review.media === 'string' ? JSON.parse(review.media) : review.media) : [],
      isVerified: review.is_verified,
      createdAt: review.created_at,
      user: {
        id: review.customer_id,
        name: `${review.first_name} ${review.last_name}`,
        avatar: review.avatar_url,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          nameAr: service.name_ar,
          description: service.description,
          descriptionAr: service.description_ar,
          price: parseFloat(service.price),
          currency: service.currency,
          duration: service.duration,
          pricingType: service.pricing_type,
          images: parsedImages,
          isActive: service.is_active,
          createdAt: service.created_at,
          category: {
            id: service.category_id,
            name: service.category_name,
            nameAr: service.category_name_ar,
          },
          provider: {
            id: service.provider_id,
            name: service.provider_name,
            nameAr: service.provider_name_ar,
            description: service.provider_description,
            rating: parseFloat(service.provider_rating),
            totalReviews: service.provider_total_reviews,
            totalBookings: service.provider_total_bookings,
            logo: service.provider_logo,
            verificationStatus: service.provider_verification_status,
            featured: service.provider_featured,
            userId: service.provider_user_id,
          },
        },
        addons: addons.map(addon => ({
          id: addon.id,
          name: addon.name,
          nameAr: addon.name_ar,
          price: parseFloat(addon.price),
          isRequired: addon.is_required,
        })),
        reviews: formattedReviews,
        ratingBreakdown,
        totalReviews,
        operationsSuccessful: true, // Confirmation that all database operations succeeded
      },
    });

  } catch (error) {
    console.error('Get service details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get service details',
        message: error instanceof Error ? error.message : 'Unknown error',
        operationsSuccessful: false
      },
      { status: 500 }
    );
  }
}
