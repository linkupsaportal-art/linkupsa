"use client";

import { useState } from "react";
import { BackgroundGrid } from "@/components/landing/background-grid";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollProgress } from "@/components/effects/scroll-progress";
import { SpotlightCursor } from "@/components/effects/spotlight-cursor";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "كيف تعمل عملية التسليم التلقائي؟",
    answer: "بمجرد إتمام الدفع بنجاح في متجرك (سلة)، يرسل متجرك إشعاراً آلياً لمنصتنا (Webhook). تقوم المنصة بمعالجة الطلب، واختيار حساب متاح من المخزون بناءً على الخيار المحدد، وربطه بطلبك فوراً. بعد ذلك يتم إرسال رابط استلام مخصص إليك عبر الواتساب أو الإيميل."
  },
  {
    question: "كيف يمكنني استلام بيانات طلبي الرقمي؟",
    answer: "عبر زيارة صفحة الاستلام (portaliosa.com/pickup) وإدخال: 1) رقم الطلب الخاص بك، 2) آخر 4 أرقام من رقم جوالك المسجل بالطلب. سيتحقق النظام من مطابقة البيانات وعرض الحساب، كلمة المرور، وأي تعليمات أو أكواد تفعيل مرتبطة بالمنتج."
  },
  {
    question: "ما هي أنواع المنتجات الرقمية المدعومة؟",
    answer: "ندعم 6 أنواع متطورة: الحسابات ذات التحقق الثنائي (Google 2FA)، حسابات Steam Guard ذات الأكواد التفاعلية، الحسابات التي تتطلب كود تحقق مرسل للإيميل، الحسابات العادية (بدون كود)، بطاقات شحن المنتجات الرقمية، والملفات الرقمية للتنزيل المباشر بروابط موثقة ومؤمنة."
  },
  {
    question: "كيف أحصل على كود التحقق الثنائي (2FA / Steam Guard / Email)؟",
    answer: "في صفحة تفاصيل الطلب، ستجد زراً مخصصاً مكتوب عليه (الحصول على كود). بمجرد الضغط عليه، يتصل الخادم لحظياً بمفتاح الأمان المشفر ويولد لك كوداً جديداً وصالحاً لمدة 30 ثانية. يمكنك توليد الكود مباشرة من متصفحك دون الحاجة للتواصل مع الدعم الفني."
  },
  {
    question: "ماذا أفعل في حال تجاوز الحد الأقصى لطلب الأكواد؟",
    answer: "كإجراء أمني لحماية الحسابات من إساءة الاستخدام، يتم وضع حد أقصى لعدد المرات التي يمكن فيها طلب أكواد التحقق (مثلاً 5 مرات). إذا تم تجاوز هذا الحد، يرجى فتح تذكرة عبر صفحة الدعم الفني لمراجعة الطلب ورفع الحد من قبل المشرفين."
  },
  {
    question: "هل بيانات الحسابات والبطاقات مشفرة وآمنة؟",
    answer: "نعم بالكامل. نستخدم معيار تشفير البيانات المعتمد عالمياً AES-256-GCM. كلمات المرور ومفاتيح الأمان للـ 2FA مشفرة داخل قاعدة البيانات بمفاتيح سرية معزولة تماماً، ولا يمكن لأي شخص (بما في ذلك موظفو الدعم الفني) قراءتها بصيغتها الأصلية، ويتم فك التشفير لحظياً فقط عند طلب الكود."
  }
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-bg relative">
      <ScrollProgress />
      <SpotlightCursor />
      <BackgroundGrid />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-4">
            <HelpCircle className="size-6" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-fg">
            الأسئلة الشائعة ومساعدة العملاء
          </h1>
          <p className="mt-3 text-sm md:text-base text-fg-muted max-w-xl mx-auto">
            ابحث عن إجابات سريعة للأسئلة الأكثر شيوعاً حول كيفية عمل منصة التسليم الذاتي واستلام طلباتك.
          </p>
        </header>

        <div className="space-y-4 max-w-3xl mx-auto">
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={cn(
                  "border rounded-2xl transition-all duration-300 overflow-hidden",
                  isOpen
                    ? "bg-surface/50 border-accent/40 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
                    : "bg-surface/20 border-[hsl(var(--hairline))] hover:bg-surface/30"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-start font-display font-bold text-base md:text-lg text-fg hover:text-accent transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className={cn("size-4 shrink-0 transition-transform", isOpen ? "text-accent scale-110" : "text-fg-faint")} />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 text-fg-faint shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180 text-accent"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out px-6 overflow-hidden",
                    isOpen ? "max-h-[300px] pb-6 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="text-sm md:text-base text-fg-subtle leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
