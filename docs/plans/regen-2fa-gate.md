# 🛡️ خطة تنفيذ: بوابة التحقق الثنائي عند إعادة توليد الأكواد

خطة لإلزام المستخدم بإدخال كود المصادقة الثنائية (2FA) المكون من 6 أرقام قبل السماح له بإعادة توليد أكواد النسخ الاحتياطي في إعدادات الحساب.

---

## 🧐 المشكلة وسبب التعديل

حالياً، عند دخول المستخدم الإداري المفعّل للمصادقة الثنائية إلى صفحة الإعدادات الأمنية، يمكنه الضغط على زر **"توليد أكواد جديدة"** ليقوم النظام فوراً بإلغاء الأكواد القديمة وتوليد دفعة جديدة من 8 أكواد نسخ احتياطي وعرضها. هذا يمثل ثغرة أمنية في حال ترك المستخدم متصفحه مفتوحاً أو تم اختراق جلسته مؤقتاً، إذ يمكن لأي شخص لديه وصول مؤقت توليد أكواد جديدة والحصول عليها للسيطرة الدائمة على الحساب.

لضمان الأمان الأقصى وإثبات ملكية الحساب (Proof of Ownership)، يجب مطالبة المستخدم بإدخال كود الـ TOTP المكون من 6 أرقام من تطبيق المصادقة الخاص به قبل الموافقة على توليد الأكواد الجديدة.

---

## 🛠️ التغييرات المقترحة

سنقوم بتعديل طبقة الخادم (Server Action) وطبقة العميل (React UI component) لتطبيق بوابة التحقق.

### 1. طبقة الخادم (Server Actions)

#### [x] [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/profile/actions.ts)
- تعديل أكشن `regenerateBackupCodesAction` لقبول مدخل من نوع `unknown` بدلاً من عدم وجود وسائط.
- بناء مخطط تحقق Zod للتحقق من أن الكود المدخل مكوّن من 6 أرقام تماماً:
  ```typescript
  const regenerateBackupCodesSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
  });
  ```
- جلب عامل التحقق المفعّل للمستخدم عبر `sb.auth.mfa.listFactors()`.
- التحقق من وجود عامل مفعل (Verified Factor).
- إنشاء تحدي للتحقق (MFA Challenge) عبر `sb.auth.mfa.challenge({ factorId })`.
- إرسال كود TOTP المدخل للتحقق عبر `sb.auth.mfa.verify({ factorId, challengeId, code })`.
- في حال نجاح التحقق، يتم استدعاء الدالة الداخلية لتوليد الأكواد `regenerateBackupCodesInternal(user.id)` وإرجاعها للعميل.

---

### 2. طبقة العميل (React Components)

#### [x] [two-factor-card.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/profile/two-factor-card.tsx)
- إضافة حالات React جديدة داخل دالة `TwoFactorCard`:
  - `confirmRegenerate` (boolean): للتحكم في ظهور نافذة التحقق المنبثقة.
  - `regenCode` (string): لحفظ الكود المدخل أثناء التوليد.
  - `regenError` (string | null): لحفظ وإظهار أي خطأ أثناء التحقق داخل النافذة المنبثقة.
- تعديل زر **"توليد أكواد جديدة"**:
  - بدلاً من استدعاء `handleRegenerate` مباشرة، سيقوم بفتح نافذة التأكيد: `onClick={() => setConfirmRegenerate(true)}`.
- بناء المكون الفرعي الجديد `RegenerateConfirmDialog`:
  - يظهر في شكل نافذة منبثقة (Dialog) متوافقة مع الـ Design System (Glassmorphic Minimalist).
  - يحتوي على عنوان ووصف واضحين باللغة العربية (RTL).
  - يحتوي على حقل إدخال الأرقام الستة `<OtpInput>` المخصص والمصمم بشكل رائع.
  - يعرض الأخطاء بشكل فوري وجذاب داخل النافذة دون إغلاقها عند إدخال كود خاطئ.
  - يوفر زري "إلغاء" و"تأكيد التوليد" مع حالات التحميل والتأطير النيون الدقيق عند التركيز.
- تعديل وتمرير الدالة الجديدة `handleRegenerate` لتمرير الكود المدخل للأكشن:
  ```typescript
  function handleRegenerate(submittedCode: string) {
    setRegenError(null);
    startTransition(async () => {
      const res = await regenerateBackupCodesAction({ code: submittedCode });
      if (!res.ok) {
        setRegenError(res.error);
        return;
      }
      setConfirmRegenerate(false);
      setRegenCode("");
      setStep({ kind: "backup", codes: res.backupCodes });
    });
  }
  ```

---

## 🧪 خطة التحقق والضمان (Verification Plan)

### [x] التحقق التلقائي وبناء المشروع
- تشغيل `npm run build` للتحقق من سلامة أنواع TypeScript وخلو الكود تماماً من أي أخطاء لغوية أو تحذيرات للمترجم.

---

## ## Review

تم تنفيذ الميزة بالكامل وبنجاح فائق:
1. **أمان معزز بالكامل**: لا يمكن لأي مستخدم أو هجوم خارجي توليد أكواد نسخ احتياطي جديدة دون توفير كود TOTP نشط وصحيح.
2. **تجربة مستخدم راقية (UX)**: نافذة منبثقة ممتازة تدعم إدخال الكود خطوة بخطوة مع عرض الأخطاء فورياً بلغة عربية فصحى وتصميم منسجم.
3. **سلامة الكود**: تم إطلاق واجتياز مرحلة البناء والتحقق النهائي `npm run build` بنجاح كامل بدون أي خطأ أو تحذير (TypeScript & Turbopack 100% clean).

- **المسؤول المعتمد**: Razex Xelite
- **التاريخ**: 28 مايو 2026
