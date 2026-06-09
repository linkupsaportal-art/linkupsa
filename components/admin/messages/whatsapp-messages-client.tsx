"use client";

import { useState, useTransition, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Zap,
  Info,
  Smartphone,
  FileText,
  Clock,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Search,
  Eye,
  X,
  RefreshCw,
  Send,
} from "lucide-react";
import { EmojiPickerPopover } from "./emoji-picker-popover";
import { CustomSelect } from "@/components/ui/select";
import type {
  NotificationChannel,
  NotificationDispatchSummary,
} from "@/lib/db/notifications";
import { WhatsAppConfigDialog } from "@/components/admin/notifications/whatsapp-config-dialog";
import { saveWhatsAppTemplatesAction } from "@/app/admin/notifications/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Main Component ─────────────────────────────────────────────────── */

export function WhatsAppMessagesClient({
  channel,
  dispatches,
}: {
  channel: NotificationChannel | null;
  dispatches: NotificationDispatchSummary[];
}) {
  const [activeMode, setActiveMode] = useState<"api" | "standard">("api");
  const [openApiConfig, setOpenApiConfig] = useState(false);

  const apiConfigured = !!channel;
  const apiEnabled = !!channel?.enabled;

  const modes = [
    {
      id: "api" as const,
      label: "واتساب API المؤسسي",
      subtitle: "Enterprise",
      icon: Zap,
      iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    },
    {
      id: "standard" as const,
      label: "واتساب بزنس العادي",
      subtitle: "Standard",
      icon: Smartphone,
      iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`text-start p-4 sm:p-5 rounded-2xl border transition-all duration-150 relative cursor-pointer outline-none select-none flex flex-col justify-between ${
                isActive
                  ? "bg-surface border-accent shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-accent/15"
                  : "bg-surface/50 border-[hsl(var(--hairline))] hover:bg-surface hover:border-[hsl(var(--hairline-strong))]"
              }`}
            >
              {isActive && (
                <div className="absolute top-4 left-4 size-5 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                  <CheckCircle2 className="size-3" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 border ${m.iconBg}`}>
                  <Icon className="size-5 sm:size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-fg text-sm sm:text-base">
                      {m.label}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg-faint bg-surface-2 px-2 py-0.5 rounded-full">
                      {m.subtitle}
                    </span>
                  </div>

                  {m.id === "api" ? (
                    <StatusBadge configured={apiConfigured} enabled={apiEnabled} />
                  ) : (
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-black border border-amber-500/25 mt-1">
                      قريباً
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeMode === "api" ? (
        <ApiModeContent
          channel={channel}
          configured={apiConfigured}
          enabled={apiEnabled}
          onOpenConfig={() => setOpenApiConfig(true)}
          dispatches={dispatches}
        />
      ) : (
        <StandardModeContent channel={channel} />
      )}

      {/* ── Config Dialog (API) ────────────────────────────────────── */}
      <WhatsAppConfigDialog
        open={openApiConfig}
        onOpenChange={setOpenApiConfig}
        initial={
          (channel?.config as Record<string, unknown> | undefined) ?? {}
        }
        initialEnabled={apiEnabled}
      />
    </div>
  );
}

/* ─── API Mode (Enterprise) Content ──────────────────────────────────── */

function ApiModeContent({
  channel,
  configured,
  enabled,
  onOpenConfig,
  dispatches,
}: {
  channel: NotificationChannel | null;
  configured: boolean;
  enabled: boolean;
  onOpenConfig: () => void;
  dispatches: NotificationDispatchSummary[];
}) {
  const cfg = channel?.config as Record<string, unknown> | undefined;
  const tpl =
    (cfg?.default_template as string | undefined) ?? "order_ready_v1";
  const host =
    (cfg?.host as string | undefined) ?? "akgroup.api.karzoun.chat";
  const storeName = (cfg?.store_name as string | undefined) ?? "—";

  return (
    <div className="space-y-4">
      {/* Enterprise API Warning Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-fg text-sm">تنبيه حول واتساب API المؤسسي (Enterprise)</h4>
          <p className="text-xs text-fg-muted leading-relaxed" dir="rtl">
            لا يمكن بدء المحادثات مع العملاء إلا باستخدام **قوالب رسائل معتمدة من ميتا**. ومع ذلك، إذا قام العميل بإرسال رسالة إليك خلال الـ 24 ساعة الماضية، يمكنك الرد عليه بحرية وبدون استخدام قوالب.
          </p>
          <p className="text-[11px] text-fg-faint leading-relaxed font-mono" dir="ltr">
            ⚠️ WhatsApp Business API (Enterprise): Cannot initiate conversations with customers unless using Meta-approved message templates. However, if the customer has sent a message within the last 24 hours, you can reply using regular free-form messages.
          </p>
        </div>
      </div>

      {/* Config Overview Card */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border-b border-[hsl(var(--hairline))]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-400 shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-fg text-sm sm:text-base">
                واتساب API — كرزون شات
              </h3>
              <p className="text-xs text-fg-muted">
                إرسال إشعارات تلقائية عبر قوالب ميتا المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-surface-2 hover:bg-surface text-fg text-xs font-bold border border-[hsl(var(--hairline-strong))] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Settings className="size-3.5" />
            {configured ? "تعديل الإعدادات" : "إعداد القناة"}
          </button>
        </div>

        {/* Config Details Grid */}
        {configured ? (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ConfigItem
                label="الحالة"
                value={enabled ? "مفعّل" : "موقوف"}
                valueClass={enabled ? "text-accent" : "text-amber-500"}
              />
              <ConfigItem label="السيرفر" value={host} mono />
              <ConfigItem label="اسم المتجر" value={storeName} />
            </div>

            {/* How it works */}
            <div className="mt-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-fg-muted leading-relaxed">
                  <strong className="text-fg block mb-1">كيف يعمل؟</strong>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      عند تنفيذ أي طلب، يُرسل قالب الواتساب المعتمد من ميتا والمحدد في إعدادات ذلك المنتج تلقائياً.
                    </li>
                    <li>
                      إذا رد العميل خلال 24 ساعة، يمكن الرد برسائل حرة بدون
                      قالب.
                    </li>
                    <li>خارج نافذة الـ 24 ساعة، القوالب المعتمدة فقط.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
              <Shield className="size-6 text-fg-muted" />
            </div>
            <h3 className="font-semibold text-fg mb-1">لم يتم الإعداد بعد</h3>
            <p className="text-sm text-fg-muted max-w-md mx-auto">
              أدخل بيانات حسابك في كرزون شات لتفعيل الإشعارات التلقائية عبر
              واتساب API.
            </p>
          </div>
        )}
      </div>

      {/* Dispatch History */}
      <DispatchTable dispatches={dispatches} />
    </div>
  );
}

/* ─── Standard Mode Content ──────────────────────────────────────────── */

/* ─── Standard Mode Content ──────────────────────────────────────────── */

type CustomTemplate = {
  id: string;
  name: string;
  body: string;
  created_at: string;
};

const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    id: "tpl_1",
    name: "طلب لعبة",
    body: "مرحباً عزيزي {customer_name} 👋\n\nشكرًا لطلبك من متجر {store_name} 🌸\n\nتفاصيل طلبك كالتالي:\n📦 رقم الطلب: #{order_number}\n🎮 اسم المنتج: {product_name}\n🎮 معرف اللاعب: {player_id}\n🔑 مفتاح اللعبة: {game_key}\n\nرابط استلام الطلب والتعليمات 📥:\n{pickup_url}\n\nاستمتع باللعب! 🎉",
    created_at: "2026-04-17T13:10:00Z",
  },
  {
    id: "tpl_2",
    name: "طلب جديد شات جي تي بي مشترك",
    body: "مرحباً عزيزي {customer_name} 👋\n\nتم تفعيل اشتراكك في ChatGPT المشترك بنجاح! ⚡️\n\nتفاصيل الحساب 🔐:\n📧 البريد الإلكتروني: {email}\n🔑 كلمة المرور: {password}\n🛡️ رمز التحقق: {code_2fa}\n\nرابط الاستلام والتعليمات 📥:\n{pickup_url}",
    created_at: "2026-04-17T13:09:00Z",
  },
  {
    id: "tpl_3",
    name: "طلب تقييم لعبة",
    body: "عزيزي {customer_name}،\n\nنأمل أن تكون مستمتعاً بـ {product_name} 🎮!\n\nيسعدنا جداً تقييمك لخدمتنا عبر الرابط:\n{store_url}/reviews\n\nتقييمك يساعدنا على تقديم الأفضل دائماً 🤍",
    created_at: "2026-03-27T05:41:00Z",
  },
  {
    id: "tpl_4",
    name: "طلب تقييم",
    body: "مرحباً {customer_name} 👋\n\nتمت خدمتك أسرع من البرق! ⚡️\nيهمنا تقييمك الجميل 💖\n\nشاركنا صورة للتقييم وراح يتم إضافة 20 يوم مجاناً على اشتراكك مباشرة! 🎉",
    created_at: "2026-03-27T05:41:00Z",
  },
];

function StandardModeContent({ channel }: { channel: NotificationChannel | null }) {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isPending, startTransition] = useTransition();

  // Builder Modal States
  const [builderOpen, setBuilderOpen] = useState(false);
  const [currentTpl, setCurrentTpl] = useState<CustomTemplate | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Textarea Ref for Variable Injection
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Load custom templates on mount
  useEffect(() => {
    const custom = (channel?.config?.custom_templates as CustomTemplate[] | undefined) ?? [];
    if (custom.length === 0) {
      setTemplates(DEFAULT_TEMPLATES);
    } else {
      setTemplates(custom);
    }
  }, [channel]);

  // Persist templates helper
  function saveTemplates(list: CustomTemplate[]) {
    startTransition(async () => {
      const res = await saveWhatsAppTemplatesAction(list);
      if (!res.ok) {
        setError("فشل حفظ التغييرات في قاعدة البيانات.");
      } else {
        setTemplates(list);
      }
    });
  }

  // Search and Filter templates
  const filteredTemplates = useMemo(() => {
    let list = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.body.toLowerCase().includes(search.toLowerCase())
    );

    list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [templates, search, sortOrder]);

  // Open builder for creating a new template
  function handleOpenCreate() {
    setCurrentTpl(null);
    setTplName("");
    setTplBody("");
    setError(null);
    setBuilderOpen(true);
  }

  // Open builder for editing a template
  function handleOpenEdit(tpl: CustomTemplate) {
    setCurrentTpl(tpl);
    setTplName(tpl.name);
    setTplBody(tpl.body);
    setError(null);
    setBuilderOpen(true);
  }

  // Duplicate a template
  function handleDuplicate(tpl: CustomTemplate) {
    const dup: CustomTemplate = {
      id: "tpl_" + Math.random().toString(36).substr(2, 9),
      name: `${tpl.name} - نسخة`,
      body: tpl.body,
      created_at: new Date().toISOString(),
    };
    saveTemplates([dup, ...templates]);
  }

  // Delete a template
  function handleDelete(id: string) {
    if (confirm("هل أنت متأكد تماماً من رغبتك في حذف هذا القالب؟")) {
      const list = templates.filter((t) => t.id !== id);
      saveTemplates(list);
    }
  }

  // Save template from Dialog
  function handleSaveTemplate() {
    if (!tplName.trim()) {
      setError("اسم القالب مطلوب.");
      return;
    }
    if (!tplBody.trim()) {
      setError("محتوى القالب مطلوب.");
      return;
    }

    let updatedList: CustomTemplate[];

    if (currentTpl) {
      // Edit
      updatedList = templates.map((t) =>
        t.id === currentTpl.id
          ? { ...t, name: tplName, body: tplBody, created_at: new Date().toISOString() }
          : t
      );
    } else {
      // Create new
      const newTpl: CustomTemplate = {
        id: "tpl_" + Math.random().toString(36).substr(2, 9),
        name: tplName,
        body: tplBody,
        created_at: new Date().toISOString(),
      };
      updatedList = [newTpl, ...templates];
    }

    setBuilderOpen(false);
    saveTemplates(updatedList);
  }

  // Inject dynamic variables at cursor position
  function injectVariable(variableName: string) {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = tplBody.substring(0, startPos);
    const textAfter = tplBody.substring(endPos, tplBody.length);

    const injected = `{${variableName}}`;
    setTplBody(textBefore + injected + textAfter);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + injected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  }

  // Inject emoji from picker at cursor position
  const handleEmojiInsert = useCallback((emoji: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setTplBody((prev) => prev + emoji);
      return;
    }
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = tplBody.substring(0, startPos);
    const textAfter = tplBody.substring(endPos);
    setTplBody(textBefore + emoji + textAfter);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  }, [tplBody]);

  // Dynamic Variable buttons config
  const variableGroups = [
    {
      title: "معلومات المتجر",
      variables: [
        { key: "store_name", label: "اسم المتجر" },
        { key: "store_url", label: "رابط المتجر" },
        { key: "store_phone", label: "هاتف المتجر" },
      ],
    },
    {
      title: "معلومات العميل",
      variables: [
        { key: "customer_name", label: "اسم العميل" },
        { key: "customer_phone", label: "هاتف العميل" },
        { key: "customer_email", label: "بريد العميل" },
      ],
    },
    {
      title: "معلومات الطلب",
      variables: [
        { key: "order_number", label: "رقم الطلب" },
        { key: "order_status", label: "حالة الطلب" },
        { key: "product_name", label: "اسم المنتج" },
        { key: "product_options", label: "خيارات المنتج" },
        { key: "pickup_url", label: "رابط الاستلام" },
      ],
    },
    {
      title: "معلومات SMM",
      variables: [
        { key: "smm_order_id", label: "رقم تنفيذ الطلب" },
        { key: "smm_status", label: "حالة التنفيذ" },
      ],
    },
    {
      title: "الحسابات الرقمية",
      variables: [
        { key: "username", label: "اسم المستخدم" },
        { key: "password", label: "كلمة المرور" },
        { key: "email", label: "البريد الإلكتروني" },
        { key: "code_2fa", label: "رمز التحقق 2FA" },
        { key: "data_link", label: "رابط البيانات" },
        { key: "usage_limit", label: "حد الاستخدام" },
      ],
    },
    {
      title: "شحن الألعاب",
      variables: [
        { key: "charging_type", label: "نوع الشحن" },
        { key: "player_id", label: "معرف اللاعب" },
        { key: "game_key", label: "مفتاح اللعبة" },
        { key: "card_code", label: "كود البطاقة" },
        { key: "provider_order_id", label: "رقم طلب المزود" },
      ],
    },
    {
      title: "الأكواد",
      variables: [
        { key: "code_value", label: "قيمة الكود" },
        { key: "code_type", label: "نوع الكود" },
      ],
    },
  ];

  // Preview helper – replace {var} with styled highlight
  const previewBody = useMemo(() => {
    if (!tplBody) return "";
    return tplBody.replace(/\{([^}]+)\}/g, "[$1]");
  }, [tplBody]);

  // Count variables used
  const varsUsed = useMemo(() => {
    const matches = tplBody.match(/\{([^}]+)\}/g);
    return matches ? matches.length : 0;
  }, [tplBody]);

  return (
    <div className="space-y-6">
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-[hsl(var(--hairline))]">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl flex items-center justify-center bg-emerald-500/12 text-emerald-400 shrink-0 border border-emerald-500/20">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-fg text-sm sm:text-base mb-0.5">
              إدارة قوالب الرسائل
            </h3>
            <p className="text-xs text-fg-muted">
              قم بإنشاء وتنظيم قوالب رسائل احترافية للواتساب والبريد الإلكتروني.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hi transition-all cursor-pointer shadow-sm shadow-accent/10 hover:shadow-md hover:shadow-accent/15 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          إضافة قالب جديد
        </button>
      </div>

      {/* Templates Filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fg-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في القوالب…"
            className="h-10 w-full ps-9 pe-8 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-xs text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent/50 transition-shadow"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-fg-faint font-semibold">
            {filteredTemplates.length} قالب
          </span>
          <CustomSelect
            value={sortOrder}
            onChange={(val) => setSortOrder(val as "newest" | "oldest")}
            options={[
              { value: "newest", label: "الأحدث" },
              { value: "oldest", label: "الأقدم" },
            ]}
            className="w-full sm:w-36"
          />
        </div>
      </div>

      {/* Templates Cards Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
            <FileText className="size-6 text-fg-muted" />
          </div>
          <h3 className="font-semibold text-fg mb-1">لا توجد قوالب مطابقة</h3>
          <p className="text-sm text-fg-muted">حاول تعديل كلمات البحث أو أنشئ قالباً جديداً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group rounded-2xl bg-surface border border-[hsl(var(--hairline))] hover:border-accent/25 hover:shadow-lg hover:shadow-accent/[0.03] transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 shrink-0">
                      <MessageCircle className="size-3.5" />
                    </div>
                    <h4 className="font-bold text-fg text-sm sm:text-base truncate">
                      {tpl.name}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                    <Send className="size-2.5" />
                    واتساب
                  </span>
                </div>

                {/* Message body preview — styled like a WhatsApp chat bubble */}
                <div className="relative bg-[hsl(142_70%_30%/0.08)] border border-emerald-500/10 rounded-xl rounded-tr-sm p-3.5 text-xs text-fg-muted leading-relaxed font-sans whitespace-pre-wrap select-text max-h-40 overflow-y-auto">
                  {tpl.body}
                  <div className="absolute top-0 end-0 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-emerald-500/10" />
                </div>
              </div>

              <div className="px-4 sm:px-5 py-3 bg-surface-2/30 border-t border-[hsl(var(--hairline))] flex items-center justify-between gap-4">
                <span className="text-[10px] text-fg-faint font-num">
                  آخر تحديث:{" "}
                  {new Date(tpl.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>

                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                    title="تعديل القالب"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="p-2 rounded-lg text-fg-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                    title="تكرار القالب"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-2 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="حذف القالب"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Custom Template Builder Dialog ───────────────────────────── */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="theme-admin max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="size-7 rounded-lg flex items-center justify-center bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                <MessageCircle className="size-3.5" />
              </div>
              {currentTpl ? "تعديل القالب" : "إضافة قالب جديد"}
            </DialogTitle>
            <DialogDescription>
              اكتب محتوى الرسالة، ويمكنك إدراج المتغيرات الديناميكية والإيموجي بالنقر عليها.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Field label="اسم القالب *">
              <input
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="مثال: طلب جديد شات جي تي بي مشترك"
                className="h-11 px-4 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-xs w-full focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-semibold placeholder:text-fg-faint"
              />
            </Field>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Editor + Toolbar */}
              <div className="lg:col-span-3 space-y-3">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-semibold text-fg-muted">محتوى القالب *</label>
                  <div className="flex items-center gap-2">
                    <EmojiPickerPopover onEmojiSelect={handleEmojiInsert} />
                    <span className="text-[10px] text-fg-faint font-num bg-surface-2 px-2 py-1 rounded-md border border-[hsl(var(--hairline))]">
                      {tplBody.length} حرف • {varsUsed} متغير
                    </span>
                  </div>
                </div>

                <textarea
                  ref={bodyRef}
                  value={tplBody}
                  onChange={(e) => setTplBody(e.target.value)}
                  rows={14}
                  dir="rtl"
                  placeholder="مرحباً عزيزي {customer_name} 👋\n\nشكرًا لطلبك من متجر {store_name}..."
                  className="px-4 py-3.5 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-xs w-full focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 font-sans resize-none leading-relaxed transition-all placeholder:text-fg-faint font-medium"
                />

                {/* Live Preview */}
                {tplBody && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-fg-faint flex items-center gap-1">
                      <Eye className="size-3" />
                      معاينة حية
                    </label>
                    <div className="relative bg-[hsl(142_70%_30%/0.06)] border border-emerald-500/10 rounded-xl rounded-tr-sm p-4 text-xs text-fg leading-relaxed whitespace-pre-wrap">
                      {tplBody.split(/\{([^}]+)\}/).map((part, i) =>
                        i % 2 === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <span
                            key={i}
                            className="inline-flex items-center gap-0.5 h-5 px-1.5 mx-0.5 rounded bg-accent/15 text-accent text-[10px] font-bold border border-accent/20"
                          >
                            {part}
                          </span>
                        )
                      )}
                      <div className="absolute top-0 end-0 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-emerald-500/10" />
                    </div>
                  </div>
                )}
              </div>

              {/* Variable Injection panels */}
              <div className="lg:col-span-2 space-y-3">
                <label className="text-[11px] font-bold text-fg-muted block">
                  المتغيرات المتاحة
                </label>
                <div className="h-[440px] overflow-y-auto border border-[hsl(var(--hairline))] rounded-xl bg-surface-2/30 p-3.5 space-y-3.5 scrollbar-thin">
                  {variableGroups.map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <span className="text-[10px] font-bold text-fg-faint uppercase tracking-wider block">
                        {group.title}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.variables.map((v) => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => injectVariable(v.key)}
                            className="h-7 px-2.5 bg-surface border border-[hsl(var(--hairline-strong))] hover:border-accent/35 hover:bg-accent/5 rounded-lg text-[10px] font-bold text-fg-muted hover:text-accent transition-all cursor-pointer select-none font-mono"
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setBuilderOpen(false)}
              className="h-10 px-4 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-xs font-semibold text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={isPending}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-accent text-accent-fg text-xs font-bold hover:bg-accent-hi transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-accent/10"
            >
              {isPending ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  حفظ القالب
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Shared Sub-Components ──────────────────────────────────────────── */

function ConfigItem({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3">
      <div className="text-[11px] text-fg-faint font-bold uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`text-sm font-semibold truncate ${valueClass ?? "text-fg"} ${
          mono ? "font-mono text-xs" : ""
        }`}
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 sm:p-4 flex items-start gap-3">
      <div className="size-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-fg text-xs sm:text-sm mb-0.5">
          {title}
        </h4>
        <p className="text-[11px] sm:text-xs text-fg-muted leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  configured,
  enabled,
}: {
  configured: boolean;
  enabled: boolean;
}) {
  if (!configured) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-fg-faint/15 text-fg-faint border border-fg-faint/25 mt-1">
        غير معد
      </span>
    );
  }
  if (!enabled) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-black border border-amber-500/25 mt-1">
        موقوف
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-black border border-accent/25 mt-1">
      مفعّل
    </span>
  );
}

function DispatchTable({
  dispatches,
}: {
  dispatches: NotificationDispatchSummary[];
}) {
  if (dispatches.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-8 sm:p-12 text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
          <MessageCircle className="size-6 text-fg-muted" />
        </div>
        <h3 className="font-semibold text-fg mb-1">
          لا توجد رسائل واتساب مرسلة بعد
        </h3>
        <p className="text-sm text-fg-muted">
          ستظهر هنا كل رسائل الواتساب المرسلة تلقائياً مع حالة كل رسالة.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-bold text-fg">آخر رسائل الواتساب</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
            <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
              <th className="text-start px-4 py-3 font-semibold">#الطلب</th>
              <th className="text-start px-4 py-3 font-semibold hidden sm:table-cell">
                العميل
              </th>
              <th className="text-start px-4 py-3 font-semibold hidden md:table-cell">
                المنتج
              </th>
              <th className="text-start px-4 py-3 font-semibold">الحالة</th>
              <th className="text-start px-4 py-3 font-semibold">الوقت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--hairline))]">
            {dispatches.map((d) => {
              const succeeded = d.succeeded.includes("whatsapp");
              const failed = d.failed.some((f) => f.channel === "whatsapp");
              const failError =
                d.failed.find((f) => f.channel === "whatsapp")?.error ?? "";

              return (
                <tr
                  key={d.order_id}
                  className="hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3 font-num font-semibold text-fg">
                    #{d.order_reference ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg hidden sm:table-cell">
                    {d.customer_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg hidden md:table-cell">
                    {d.product_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {succeeded ? (
                      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-black border border-accent/25">
                        <CheckCircle2 className="size-2.5" />
                        نجح
                      </span>
                    ) : failed ? (
                      <span
                        className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25"
                        title={failError}
                      >
                        <XCircle className="size-2.5" />
                        فشل
                      </span>
                    ) : (
                      <span className="text-[10px] text-fg-faint">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-xs text-fg-muted font-num"
                    dir="ltr"
                  >
                    {new Date(d.notification_sent_at).toLocaleString("en-US", {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-semibold text-fg-muted">{label}</label>
      {children}
    </div>
  );
}

