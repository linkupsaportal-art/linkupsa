import "server-only";
import * as OTPAuth from "otpauth";

/**
 * Generates a TOTP code from the stored secret.
 *
 * SECURITY: This function ONLY returns the 6-digit code + remaining seconds.
 * The secret itself NEVER leaves the server (per spec: "منع إظهار 2FA Secret للعميل").
 * If the customer ever got the secret, they could clone the account and use
 * the verification code from their own device — defeating the whole point.
 *
 * @param secret  Base32-encoded TOTP seed (e.g. "JBSWY3DPEHPK3PXP")
 * @returns       Current 6-digit code, plus seconds until next rotation.
 */
export function generateTotpCode(secret: string): {
  code: string;
  expiresInSeconds: number;
  totalPeriod: number;
} {
  // Trim spaces/dashes (Google Authenticator export sometimes adds them)
  const cleaned = secret.replace(/[\s-]/g, "").toUpperCase();

  const totp = new OTPAuth.TOTP({
    issuer: "PortalIosa",
    label: "account",
    algorithm: "SHA1",   // RFC 6238 default — what Google Authenticator uses
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(cleaned),
  });

  const code = totp.generate();
  // Remaining seconds in current 30-second window
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = 30 - (now % 30);

  return { code, expiresInSeconds, totalPeriod: 30 };
}
