import { BackgroundGrid } from "@/components/landing/background-grid";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { SpotlightCursor } from "@/components/effects/spotlight-cursor";
import { Mail, Clock, MessageSquare, Send, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الدعم الفني والمساعدة",
  description: "تواصل مع الدعم الفني لمنصة Portalio SA لحل أي مشكلات تتعلق بتسليم الطلبات الحسابات الرقمية.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-bg relative">
      <ScrollProgress />
      <SpotlightCursor />
      <BackgroundGrid />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-4">
            <MessageSquare className="size-6" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-fg">
            الدعم الفني والمساعدة
          </h1>
          <p className="mt-3 text-sm md:text-base text-fg-muted max-w-xl mx-auto">
            فريق الدعم الفني متواجد لمساعدتك في حل أي إشكاليات تتعلق بالطلب أو الاستلام أو تفعيل الأكواد.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quick contact methods */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface/40 backdrop-blur-xl border border-[hsl(var(--hairline))] rounded-2xl p-6 relative overflow-hidden card-soft">
              <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                <Clock className="size-4.5 text-accent" />
                ساعات العمل والاستجابة
              </h2>
              <p className="text-sm text-fg-subtle leading-relaxed">
                نعمل على مدار الساعة لتلقي ومعالجة طلباتكم. بالنسبة لبطاقات الدعم الفني والرسائل اليدوية، يتم الرد عليها في غضون:
              </p>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold py-2 border-b border-[hsl(var(--hairline))]">
                <span className="text-fg-subtle">الطلبات الفورية:</span>
                <span className="text-accent">آلية بالكامل (خلال ثوانٍ)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold py-2">
                <span className="text-fg-subtle">تذاكر الدعم الفني:</span>
                <span className="text-accent">أقل من ساعتين</span>
              </div>
            </div>

            <div className="bg-surface/40 backdrop-blur-xl border border-[hsl(var(--hairline))] rounded-2xl p-6 relative overflow-hidden card-soft">
              <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                <Mail className="size-4.5 text-accent" />
                قنوات التواصل المباشرة
              </h2>
              <div className="space-y-4">
                <a
                  href="mailto:hello@portaliosa.com"
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="size-9 rounded-lg bg-white/5 flex items-center justify-center text-fg-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-fg-faint">البريد الإلكتروني المباشر</span>
                    <span className="block text-sm font-semibold text-fg font-mono" dir="ltr">
                      hello@portaliosa.com
                    </span>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="size-9 rounded-lg bg-white/5 flex items-center justify-center text-fg-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                    <Send className="size-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-fg-faint">بوت الدعم الفني (Telegram)</span>
                    <span className="block text-sm font-semibold text-fg">
                      @PortalioSaBot
                    </span>
                  </div>
                </a>

                <a
                  href="/pickup"
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="size-9 rounded-lg bg-white/5 flex items-center justify-center text-fg-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-fg-faint">بوابة استلام المنتجات</span>
                    <span className="block text-sm font-semibold text-fg">
                      portaliosa.com/pickup
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Contact form mockup or details */}
          <div className="lg:col-span-7 bg-surface/40 backdrop-blur-xl border border-[hsl(var(--hairline))] rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden card-soft">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--fg)_1px,_transparent_1px)] bg-[size:16px_16px]" />
            
            <h2 className="text-xl font-bold text-fg mb-2">تذاكر الدعم السريع</h2>
            <p className="text-sm text-fg-subtle mb-6 leading-relaxed">
              إذا واجهتك مشكلة في استلام حسابك أو كود التحقق، يرجى ملء الحقول أدناه وسيقوم النظام بتفحص طلبك وحله فوراً أو توجيهه للدعم البشري.
            </p>

            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-fg-muted mb-1.5">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    placeholder="عبدالله..."
                    className="w-full h-11 px-4 text-sm bg-surface-2 border border-[hsl(var(--hairline-strong))] rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-fg-muted mb-1.5">رقم الطلب (سلة)</label>
                  <input
                    type="text"
                    required
                    placeholder="12345678"
                    className="w-full h-11 px-4 text-sm bg-surface-2 border border-[hsl(var(--hairline-strong))] rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors font-mono"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1.5">البريد الإلكتروني للطلب</label>
                <input
                  type="email"
                  required
                  placeholder="you@store.sa"
                  className="w-full h-11 px-4 text-sm bg-surface-2 border border-[hsl(var(--hairline-strong))] rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg-muted mb-1.5">وصف المشكلة</label>
                <textarea
                  rows={4}
                  required
                  placeholder="أدخل وصفاً دقيقاً للمشكلة، مثل (كود التحقق لم يصل، الحساب لا يفتح...)"
                  className="w-full p-4 text-sm bg-surface-2 border border-[hsl(var(--hairline-strong))] rounded-md text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              <button
                type="button"
                className="w-full h-12 bg-accent hover:bg-accent-hi text-accent-fg font-extrabold text-sm rounded-md tracking-wider transition-colors shadow-[0_8px_20px_-8px_hsl(var(--accent)/0.6)]"
              >
                إرسال الطلب للدعم الفني
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
