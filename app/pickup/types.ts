import type { HandlerType } from "@/lib/db/products";

export type PickupResult = {
  orderId: string;
  orderNumber: string;
  productName: string;
  handlerType: HandlerType;
  optionName: string | null;
  // Account fields — populated based on handler type
  email?: string;
  password?: string;
  instructions?: string;
  cardCode?: string;
  fileUrl?: string;
  // Limits
  otpRequestCount: number;
  otpRequestLimit: number;
};
