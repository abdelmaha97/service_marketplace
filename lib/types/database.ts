import { BookingStatus } from "@/models/Booking";

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'card' | 'bank_transfer' | 'wallet';

export interface Booking {
  id: string;
  tenant_id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_type: 'one_time' | 'recurring' | 'emergency';
  status: BookingStatus;
  scheduled_at: Date;
  completed_at?: Date;
  total_amount: number;
  commission_amount?: number;
  currency: string;
  payment_status: PaymentStatus;
  customer_address?: any;
  notes?: string;
  metadata?: any;
  cancellation_reason?: string;
  cancelled_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: string;
  tenant_id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_type: 'one_time' | 'recurring' | 'emergency';
  status: BookingStatus;
  scheduled_at: Date;
  completed_at?: Date;
  total_amount: number;
  commission_amount?: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_type: PaymentType;
  customer_address?: any;
  notes?: string;
  metadata?: any;
  cancellation_reason?: string;
  cancelled_by?: string;
  created_at: Date;
  updated_at: Date;
}
