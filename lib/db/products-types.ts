/**
 * Type-only module — safe to import from client components.
 * Server-only data access lives in `./products.ts` (imports server.ts).
 */

export type HandlerType =
  | "2fa_account"
  | "steam_guard_account"
  | "email_code_account"
  | "normal_account"
  | "recharge_card"
  | "digital_file";

export type Product = {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  youtube_url: string | null;
  image_url: string | null;
  handler_type: HandlerType;
  status: "active" | "inactive";
  salla_product_id: number | null;
  notification_channels: {
    email: boolean;
    whatsapp: boolean;
    telegram: boolean;
    whatsapp_template?: string;
    email_template?: string;
  };
  sort_order: number;
  created_at: string;
  updated_at: string;
  options?: ProductOption[];
  account_count?: number;
};

export type ProductOption = {
  id: string;
  product_id: string;
  name: string;
  name_ar: string | null;
  salla_option_value: string | null;
  sort_order: number;
  created_at: string;
};

export const HANDLER_LABELS: Record<HandlerType, string> = {
  "2fa_account": "حساب 2FA",
  steam_guard_account: "Steam Guard",
  email_code_account: "كود إيميل",
  normal_account: "حساب عادي",
  recharge_card: "بطاقة شحن",
  digital_file: "ملف رقمي",
};

/** "none" means "do not send on this channel for this product". */
export const WHATSAPP_TEMPLATE_OPTIONS = [
  { value: "none", label: "بدون إرسال" },
  { value: "order_ready_v1", label: "طلب جاهز (order_ready_v1)" },
  { value: "order_cancel", label: "إلغاء طلب (order_cancel)" },
] as const;

export const EMAIL_TEMPLATE_OPTIONS = [
  { value: "none", label: "بدون إرسال" },
  { value: "order_ready", label: "رسالة الطلب جاهز" },
] as const;
