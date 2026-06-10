/**
 * Order Notifier
 *
 * Resolves the product's per-channel notification toggles and dispatches the
 * "order ready" multi-channel notification. Shared by the webhook ingestor
 * and the allocation-retry pass.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { notifyOrderReady } from "@/lib/notifications/dispatch";

/** Resolves the public origin for pickup links. */
export function getOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://www.portaliosa.com";
}

export async function sendOrderReadyNotification(args: {
  orderId: string;
  storeId: number;
  email: string | null | undefined;
  mobile: string | null | undefined;
  customerName: string;
  orderNumber: string;
  productName: string;
  productId: string | null;
  origin: string;
}): Promise<void> {
  // Resolve the product's per-channel toggles and template overrides.
  // Default to email-only when we couldn't map the order to one of our
  // products (best-effort fallback).
  let channels = { email: true, whatsapp: false };
  let whatsappTemplate: string | undefined;
  let emailTemplate: string | undefined;

  if (args.productId) {
    const sb = createServiceClient();
    const { data: product } = await sb
      .from("products")
      .select("notification_channels")
      .eq("id", args.productId)
      .single();
    if (product?.notification_channels) {
      const nc = product.notification_channels as {
        email?: boolean;
        whatsapp?: boolean;
        whatsapp_template?: string;
        email_template?: string;
      };
      channels = { ...channels, email: nc.email ?? true, whatsapp: nc.whatsapp ?? false };
      if (nc.whatsapp_template && nc.whatsapp_template !== "none") {
        whatsappTemplate = nc.whatsapp_template;
      }
      if (nc.email_template && nc.email_template !== "none") {
        emailTemplate = nc.email_template;
      }
    }
  }

  await notifyOrderReady({
    orderId: args.orderId,
    storeId: args.storeId,
    customerName: args.customerName,
    customerEmail: args.email ?? null,
    customerMobile: args.mobile ?? null,
    orderNumber: args.orderNumber,
    productName: args.productName,
    productNotificationChannels: channels,
    pickupUrl: `${args.origin}/pickup`,
    whatsappTemplate,
    emailTemplate,
  });
}
