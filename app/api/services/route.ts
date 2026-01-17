import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getTenantFromRequest } from '@/lib/middleware/tenant';

// قائمة الحقول المسموح بالفلترة
const filterableFields: Record<string, string> = {
  category_id: 's.category_id',
  name: 's.name',
  provider_name: 'sp.business_name',
  base_price: 's.base_price',
  rating: 'sp.rating',
  duration_minutes: 's.duration_minutes',
};

const sortableFields: Record<string, string> = {
  created_at: 's.created_at',
  base_price: 's.base_price',
  name: 's.name',
  rating: 'sp.rating',
  reviews: 'sp.total_reviews',
};

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12', 10));
    const offset = (page - 1) * limit;

    // Sort
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = (searchParams.get('sort_order') || 'DESC').toUpperCase();
    const sortField = sortableFields[sortBy] || 's.created_at';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // بناء شروط WHERE ديناميكي
    const whereConditions: string[] = ['s.tenant_id = ?', 's.is_active = ?'];
    const params: any[] = [String(tenant.id), 1];

    console.log('=== TENANT DEBUG ===');
    console.log('Tenant Object:', tenant);
    console.log('Tenant ID:', tenant.id);
    console.log('Tenant ID Type:', typeof tenant.id);
    console.log('String Tenant ID:', String(tenant.id));

    // فلترة ديناميكية لجميع الحقول
    Object.keys(filterableFields).forEach(field => {
      const column = filterableFields[field];

      // range: min_field / max_field
      const minValRaw = searchParams.get(`min_${field}`);
      const maxValRaw = searchParams.get(`max_${field}`);

      if (minValRaw !== null && minValRaw !== '' && !isNaN(parseFloat(minValRaw))) {
        whereConditions.push(`${column} >= ?`);
        params.push(parseFloat(minValRaw));
      }

      if (maxValRaw !== null && maxValRaw !== '' && !isNaN(parseFloat(maxValRaw))) {
        whereConditions.push(`${column} <= ?`);
        params.push(parseFloat(maxValRaw));
      }

      // exact match (string)
      const val = searchParams.get(field);
      if (val && val.trim() !== '' && !minValRaw && !maxValRaw) {
        whereConditions.push(`${column} = ?`);
        params.push(val.trim());
      }
    });

    // search نصي عام (LIKE)
    const search = searchParams.get('search');
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions.push(`(
        s.name LIKE ? OR s.name_ar LIKE ? OR
        s.description LIKE ? OR s.description_ar LIKE ? OR
        sp.business_name LIKE ? OR sp.business_name_ar LIKE ?
      )`);
      params.push(term, term, term, term, term, term);
    }

    const whereClause = whereConditions.join(' AND ');

    console.log('=== QUERY DEBUG ===');
    console.log('WHERE Clause:', whereClause);
    console.log('Query Params:', params);
    console.log('Params Count:', params.length);
    console.log('Params Detailed:', params.map((p, i) => `[${i}] ${typeof p}: ${JSON.stringify(p)}`));

    // الاستعلام الرئيسي
    const sql = `SELECT 
        s.id, 
        s.name, 
        s.name_ar, 
        s.description, 
        s.description_ar,
        s.base_price, 
        s.currency, 
        s.duration_minutes,
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
        sp.rating as provider_rating, 
        sp.total_reviews as provider_total_reviews,
        sp.logo as provider_logo, 
        sp.verification_status as provider_verification_status,
        sp.featured as provider_featured
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_providers sp ON s.provider_id = sp.id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT ${limit} OFFSET ${offset}`;

    const servicesResult = await query(sql, params);
    const services = Array.isArray(servicesResult) ? servicesResult : servicesResult[0] || [];

    console.log('Query executed successfully, rows:', services.length);

    // العدد الكلي بدون LIMIT/OFFSET
    const countQuery = `SELECT COUNT(*) as total
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_providers sp ON s.provider_id = sp.id
      WHERE ${whereClause}`;

    const countResultData = await query<any[]>(countQuery, params);
    const countResult = Array.isArray(countResultData) ? countResultData : countResultData[0] || [];

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // معالجة الصور
    const formattedServices = services.map((service: { images: string | string[]; id: any; name: any; name_ar: any; description: any; description_ar: any; base_price: any; currency: any; duration_minutes: any; pricing_type: any; is_active: any; created_at: any; category_id: any; category_name: any; category_name_ar: any; provider_id: any; provider_name: any; provider_name_ar: any; provider_rating: any; provider_total_reviews: any; provider_logo: any; provider_verification_status: any; provider_featured: any; }) => {
      let images: string[] = [];
      if (service.images) {
        try {
          images = typeof service.images === 'string' ? JSON.parse(service.images) : service.images;
        } catch {
          images = [];
        }
      }

      return {
        id: service.id,
        name: service.name,
        nameAr: service.name_ar,
        description: service.description,
        descriptionAr: service.description_ar,
        price: parseFloat(service.base_price || 0),
        currency: service.currency || 'USD',
        duration: service.duration_minutes,
        pricingType: service.pricing_type,
        images,
        isActive: Boolean(service.is_active),
        createdAt: service.created_at,
        category: service.category_id ? {
          id: service.category_id,
          name: service.category_name,
          nameAr: service.category_name_ar,
        } : null,
        provider: service.provider_id ? {
          id: service.provider_id,
          name: service.provider_name,
          nameAr: service.provider_name_ar,
          rating: parseFloat(service.provider_rating || 0),
          totalReviews: service.provider_total_reviews || 0,
          logo: service.provider_logo,
          verificationStatus: service.provider_verification_status,
          featured: Boolean(service.provider_featured),
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        services: formattedServices,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get services',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}