import { BackgroundGrid } from "@/components/landing/background-grid";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { SpotlightCursor } from "@/components/effects/spotlight-cursor";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية وسرية البيانات لمنصة Portalio SA للتسليم الرقمي التلقائي.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg relative">
      <ScrollProgress />
      <SpotlightCursor />
      <BackgroundGrid />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-4">
            <Shield className="size-6" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-fg">
            سياسة الخصوصية وسرية البيانات
          </h1>
          <p className="mt-3 text-sm md:text-base text-fg-muted">
            آخر تحديث: يونيو ٢٠٢٦
          </p>
        </header>

        <div className="space-y-10 text-fg-subtle leading-relaxed bg-surface/40 backdrop-blur-xl border border-[hsl(var(--hairline))] rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--fg)_1px,_transparent_1px)] bg-[size:16px_16px]" />

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2.5">
              <FileText className="size-5 text-accent" />
              ١. مقدمة تمهيدية
            </h2>
            <p>
              أهلاً بك في منصة <strong>Portalio SA</strong> (المشار إليها بـ &quot;المنصة&quot; أو &quot;نحن&quot;). نلتزم التزاماً كاملاً بحماية خصوصية بيانات عملائنا وتجارنا. توضح هذه السياسة طبيعة البيانات الشخصية والطلبات التي نقوم بمعالجتها، وكيفية حمايتها عند استخدام تطبيقنا المرتبط بمتجر سلة (Salla).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2.5">
              <Eye className="size-5 text-accent" />
              ٢. البيانات التي نجمعها ونعالجها
            </h2>
            <p>
              لكي تتم عملية تسليم المنتجات الرقمية (حسابات، بطاقات شحن، ملفات) تلقائياً، نقوم بجمع ومعالجة الحد الأدنى من البيانات الضرورية للتحقق والتسليم:
            </p>
            <ul className="list-disc list-inside space-y-2 pr-4 text-sm">
              <li><strong>بيانات الطلب:</strong> رقم الطلب الفريد، والمنتج المطلوب وخيار المنتج المختار.</li>
              <li><strong>بيانات العميل الأساسية:</strong> البريد الإلكتروني ورقم الجوال لتوجيه رسائل التسليم والتحقق.</li>
              <li><strong>التحقق الآمن:</strong> لتسهيل عملية استلام العميل لطلبه، نطلب إدخال رقم الطلب وآخر 4 أرقام من رقم الجوال، ويتم حفظ سجلات التحقق لغرض الحماية ضد إساءة الاستخدام.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2.5">
              <Lock className="size-5 text-accent" />
              ٣. حماية وأمن البيانات
            </h2>
            <p>
              نطبق تدابير أمنية صارمة للغاية لحماية معلوماتك الحساسة:
            </p>
            <ul className="list-disc list-inside space-y-2 pr-4 text-sm">
              <li><strong>تشفير متقدم (AES-256-GCM):</strong> تُشفر كلمات مرور الحسابات، ورموز التحقق الثنائية (2FA Seeds) والملفات الرقمية الحساسة تشفيراً كاملاً في قاعدة البيانات.</li>
              <li><strong>الحماية من الكشف:</strong> لا يتم إظهار الأكواد البرمجية الحساسة أو الـ secrets للعميل أو للواجهة، ويتم توليد رموز الـ OTP لحظياً على الخادم وإتلافها بعد الاستخدام.</li>
              <li><strong>حدود الأمان:</strong> نفرض حماية ضد التخمين (Rate Limiting) ونظام حظر للمحاولات المتكررة المشبوهة، مع استخدام Cloudflare Turnstile لحماية العمليات.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2.5">
              <Shield className="size-5 text-accent" />
              ٤. مشاركة البيانات مع أطراف ثالثة
            </h2>
            <p>
              لا نقوم ببيع، تأجير، أو مشاركة بياناتك الشخصية أو بيانات عملائك مع أي جهات تسويقية أو أطراف خارجية. نستخدم البيانات فقط لإرسال التنبيهات الضرورية عبر القنوات المعتمدة التي يحددها التاجر (مثل رسائل البريد الإلكتروني عبر Resend، رسائل الواتساب الرسمية، أو إشعارات تيليجرام).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-fg flex items-center gap-2.5">
              <Shield className="size-5 text-accent" />
              ٥. حقوق المستخدم والتاجر
            </h2>
            <p>
              يمتلك التجار التحكم الكامل ببيانات متجرهم والطلبات الرقمية، ولديهم الحق الكامل في حذف الطلبات، وتعديل إعدادات التوزيع والأرشفة التلقائية في أي وقت عبر لوحة التحكم الإدارية المؤمنة. كما يمكن للعملاء التواصل للحصول على الدعم الفني لحل أي إشكالات تتعلق باستلام الطلبات.
            </p>
          </section>

          <div className="border-t border-[hsl(var(--hairline))] pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-fg-faint">
              إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا.
            </p>
            <a
              href="mailto:hello@portaliosa.com"
              className="text-xs font-semibold text-accent hover:underline font-mono"
            >
              hello@portaliosa.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
