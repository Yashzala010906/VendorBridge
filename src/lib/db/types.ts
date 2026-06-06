// Domain types mirroring the Postgres schema (supabase/migrations/0001_init.sql).

export type UserRole = 'admin' | 'procurement_officer' | 'manager' | 'vendor'
export type VendorStatus = 'active' | 'inactive' | 'pending' | 'blacklisted'
export type RfqStatus = 'draft' | 'published' | 'closed' | 'awarded' | 'cancelled'
export type QuotationStatus =
  | 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type PoStatus = 'issued' | 'acknowledged' | 'fulfilled' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  vendor_id: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  category: string | null
  gst_number: string | null
  email: string | null
  phone: string | null
  contact_person: string | null
  address: string | null
  city: string | null
  status: VendorStatus
  rating: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Rfq {
  id: string
  rfq_number: string | null
  title: string
  description: string | null
  category: string | null
  status: RfqStatus
  deadline: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RfqItem {
  id: string
  rfq_id: string
  product_name: string
  description: string | null
  quantity: number
  unit: string
  target_price: number | null
  position: number
  created_at: string
}

export interface RfqVendor {
  id: string
  rfq_id: string
  vendor_id: string
  invited_at: string
  has_responded: boolean
}

export interface RfqAttachment {
  id: string
  rfq_id: string
  file_name: string
  file_path: string
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface Quotation {
  id: string
  quotation_number: string | null
  rfq_id: string
  vendor_id: string
  status: QuotationStatus
  delivery_days: number | null
  notes: string | null
  total_amount: number
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface QuotationItem {
  id: string
  quotation_id: string
  rfq_item_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface Approval {
  id: string
  rfq_id: string | null
  quotation_id: string
  status: ApprovalStatus
  remarks: string | null
  requested_by: string | null
  decided_by: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  po_number: string | null
  quotation_id: string | null
  rfq_id: string | null
  vendor_id: string
  status: PoStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  expected_delivery: string | null
  notes: string | null
  issued_by: string | null
  created_at: string
  updated_at: string
}

export interface PoItem {
  id: string
  po_id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string | null
  po_id: string | null
  vendor_id: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  issue_date: string
  due_date: string | null
  sent_at: string | null
  sent_to: string | null
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface ActivityLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: string
  link: string | null
  is_read: boolean
  created_at: string
}

// ---- common joined shapes ----
export type RfqWithCounts = Rfq & {
  rfq_items: { count: number }[]
  quotations: { count: number }[]
}
export type QuotationWithVendor = Quotation & { vendor: Vendor | null }
export type VendorRef = Pick<Vendor, 'id' | 'name' | 'rating' | 'status' | 'category'>
