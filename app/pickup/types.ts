import type { HandlerType } from "@/lib/db/products-types";

export type PickupResult = {
  orderId: string;
  orderNumber: string;
  productName: string;
  handlerType: HandlerType;
  optionName: string | null;
  /** Echo of the customer's input — needed by the TOTP refresh action so
   * we re-verify identity on every code request. Never stored elsewhere. */
  lastFour: string;
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
