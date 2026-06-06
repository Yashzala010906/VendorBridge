import {
  LayoutDashboard, Building2, FileText, ReceiptText, ClipboardCheck,
  PackageCheck, Receipt, Activity, BarChart3, Users, type LucideIcon,
} from 'lucide-react'
import type {
  UserRole, VendorStatus, RfqStatus, QuotationStatus,
  ApprovalStatus, PoStatus, InvoiceStatus,
} from '@/lib/db/types'

export type BadgeTone =
  | 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'indigo' | 'slate' | 'teal'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  procurement_officer: 'Procurement Officer',
  manager: 'Manager / Approver',
  vendor: 'Vendor',
}

export const STAFF_ROLES: UserRole[] = ['admin', 'procurement_officer', 'manager']

type StatusMeta<T extends string> = Record<T, { label: string; tone: BadgeTone }>

export const VENDOR_STATUS: StatusMeta<VendorStatus> = {
  active: { label: 'Active', tone: 'green' },
  pending: { label: 'Pending', tone: 'amber' },
  inactive: { label: 'Inactive', tone: 'gray' },
  blacklisted: { label: 'Blacklisted', tone: 'red' },
}

export const RFQ_STATUS: StatusMeta<RfqStatus> = {
  draft: { label: 'Draft', tone: 'gray' },
  published: { label: 'Published', tone: 'blue' },
  closed: { label: 'Closed', tone: 'slate' },
  awarded: { label: 'Awarded', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

export const QUOTATION_STATUS: StatusMeta<QuotationStatus> = {
  draft: { label: 'Draft', tone: 'gray' },
  submitted: { label: 'Submitted', tone: 'blue' },
  under_review: { label: 'Under Review', tone: 'amber' },
  shortlisted: { label: 'Shortlisted', tone: 'purple' },
  accepted: { label: 'Accepted', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}

export const APPROVAL_STATUS: StatusMeta<ApprovalStatus> = {
  pending: { label: 'Pending', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}

export const PO_STATUS: StatusMeta<PoStatus> = {
  issued: { label: 'Issued', tone: 'blue' },
  acknowledged: { label: 'Acknowledged', tone: 'indigo' },
  fulfilled: { label: 'Fulfilled', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

export const INVOICE_STATUS: StatusMeta<InvoiceStatus> = {
  draft: { label: 'Draft', tone: 'gray' },
  sent: { label: 'Sent', tone: 'blue' },
  paid: { label: 'Paid', tone: 'green' },
  overdue: { label: 'Overdue', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
}

export const VENDOR_CATEGORIES = [
  'Industrial', 'Electronics', 'IT Hardware', 'Office Supplies',
  'Packaging', 'Safety', 'Logistics', 'Services', 'Raw Materials', 'Other',
]

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/vendors', label: 'Vendors', icon: Building2, roles: ['admin', 'procurement_officer', 'manager'] },
  { href: '/rfqs', label: 'RFQs', icon: FileText, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/quotations', label: 'Quotations', icon: ReceiptText, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['admin', 'procurement_officer', 'manager'] },
  { href: '/purchase-orders', label: 'Purchase Orders', icon: PackageCheck, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/invoices', label: 'Invoices', icon: Receipt, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/activity', label: 'Activity', icon: Activity, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'procurement_officer', 'manager'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['admin'] },
]

export const DEFAULT_TAX_RATE = 18
