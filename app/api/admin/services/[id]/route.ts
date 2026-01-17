import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';

export const PUT = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const serviceId = params.id;
      const body = await request.json();
      const {
        name, nameAr, description, descriptionAr,
        basePrice, currency, durationMinutes, pricingType, isActive
      } = body;

      if (!name || !basePrice) {
        return NextResponse.json(
          { error: 'Name and base price are required' },
          { status: 400 }
        );
      }

      // Check if service exists and belongs to tenant
      const existingService = await query<any[]>(
        'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
        [serviceId, request.user!.tenantId]
      );

      if (existingService.length === 0) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      await query(
        `UPDATE services SET
          name = ?, name_ar = ?, description = ?, description_ar = ?,
          base_price = ?, currency = ?, duration_minutes = ?,
          pricing_type = ?, is_active = ?, updated_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [
          name,
          nameAr || null,
          description || null,
          descriptionAr || null,
          basePrice,
          currency || 'SAR',
          durationMinutes || null,
          pricingType || 'fixed',
          isActive !== false,
          serviceId,
          request.user!.tenantId,
        ]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.service.update',
        resourceType: 'service',
        resourceId: serviceId,
        changes: { name, basePrice, isActive },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Update admin service error:', error);
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = requireRole(['admin', 'super_admin'])(
  async (request: AuthenticatedRequest, { params }: { params: { id: string } }) => {
    try {
      const serviceId = params.id;

      // Check if service exists and belongs to tenant
      const existingService = await query<any[]>(
        'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
        [serviceId, request.user!.tenantId]
      );

      if (existingService.length === 0) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      await query(
        'DELETE FROM services WHERE id = ? AND tenant_id = ?',
        [serviceId, request.user!.tenantId]
      );

      const clientInfo = extractClientInfo(request);
      await createAuditLog({
        tenantId: request.user!.tenantId,
        userId: request.user!.userId,
        action: 'admin.service.delete',
        resourceType: 'service',
        resourceId: serviceId,
        changes: { deleted: true },
        ...clientInfo,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete admin service error:', error);
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      );
    }
  }
);
