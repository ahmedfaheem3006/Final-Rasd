import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  time?: string;
}

@Component({
  selector: 'app-sales-rep-ai-assistant',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class SalesRepAiAssistant {
  messages = signal<ChatMessage[]>([
    { role: 'assistant', text: 'مرحباً رنا! أنا مساعد المبيعات الذكي الخاص بك. يمكنني مساعدتك في صياغة رسائل المتابعة للعملاء، تحليل عقود التفاوض، أو إعداد عروض الأسعار بنقرة زر. كيف يمكنني مساعدتك اليوم؟', time: '10:00 ص' }
  ]);

  suggestions = signal([
    'اكتب رسالة بريد إلكتروني لمتابعة عرض سعر مع العميل',
    'كيف أقنع عميل متردد في مرحلة التفاوض؟',
    'لخص حالة صفقاتي الحالية المفتوحة',
    'اكتب عرض ترحيبي لعميل محتمل جديد'
  ]);

  inputText = '';
  isTyping = signal(false);

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    // Add user message
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    this.messages.update(prev => [...prev, { role: 'user', text: messageText, time: timeStr }]);
    
    if (!text) {
      this.inputText = '';
    }

    // Trigger AI response simulation
    this.isTyping.set(true);
    setTimeout(() => {
      this.isTyping.set(false);
      this.generateAIResponse(messageText);
    }, 1200);
  }

  selectSuggestion(suggestion: string) {
    this.sendMessage(suggestion);
  }

  private generateAIResponse(userText: string) {
    let replyText = 'عذراً، لم أفهم سؤالك تماماً. يمكنك أن تطلب مني صياغة بريد إلكتروني، أو نصائح لإقناع العملاء، أو تلخيص لصفقاتك الحالية.';
    
    const text = userText.toLowerCase();
    
    if (text.includes('بريد') || text.includes('رسالة') || text.includes('أرسل')) {
      replyText = 'إليك مسودة رسالة متابعة مهنية للعميل:\n\n"عزيزي [اسم العميل]،\nأتمنى أن تكون بخير. أردت فقط متابعة العرض المالي والفني الذي أرسلناه الأسبوع الماضي لمشروع [اسم المشروع]. نحن متحمسون جداً للعمل معكم ومساعدتكم في تحقيق أهدافكم.\nيرجى إعلامي إذا كان لديك أي استفسار أو إذا كنت ترغب في جدولة مكالمة سريعة لمناقشة التفاصيل.\n\nأطيب التحيات،\nرنا علي - مندوب المبيعات"';
    } else if (text.includes('متردد') || text.includes('إقناع') || text.includes('تفاوض')) {
      replyText = 'للتعامل مع العميل المتردد في مرحلة التفاوض، أنصحك بالاستراتيجيات التالية:\n\n1️⃣ **التركيز على القيمة بدلاً من السعر:** ركزي على كيف يحل نظام رصد مشاكله التشغيلية الحالية ووفر الوقت.\n2️⃣ **تقديم عرض حصري لفترة محدودة:** (مثال: خصم 10% أو شهر إضافي مجاني إذا تم التوقيع قبل نهاية الأسبوع).\n3️⃣ **عرض دراسة حالة نجاح (Case Study):** اعرضي له نجاح شركة مشابهة في مجاله باستخدام نفس النظام.';
    } else if (text.includes('صفقات') || text.includes('صفقة') || text.includes('لخص')) {
      replyText = 'إليك ملخص سريع لصفقاتك المفتوحة الحالية:\n\n💰 **سعودي كورب** ($24,000) - في مرحلة التفاوض، تحتاج لتأكيد موعد الاجتماع القادم.\n✉️ **الشركة الوطنية للحلول** ($15,000) - تم إرسال عرض السعر وبانتظار الرد.\n🔍 **مجموعة التكامل التقني** ($12,500) - عميل محتمل، جاري التجهيز للتواصل الأولي.';
    } else if (text.includes('ترحيب') || text.includes('جديد')) {
      replyText = 'إليك نموذج رسالة ترحيبية لعميل جديد:\n\n"مرحباً [اسم العميل]،\nسعدنا جداً باهتمامكم بنظام رصد لإدارة العمليات والمبيعات. يسعدني أن أكون مستشار المبيعات الخاص بك لمساعدتك في استكشاف كيف يمكن لمنصتنا رفع كفاءة فريقك بنسبة تصل إلى 40%.\nهل يناسبك موعد غداً في الحادية عشرة صباحاً لعرض تجريبي سريع؟\n\nتحياتي،\nرنا علي"';
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    this.messages.update(prev => [...prev, { role: 'assistant', text: replyText, time: timeStr }]);
  }
}

