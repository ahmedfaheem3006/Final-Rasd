import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  time?: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class SalesManagerAiAssistant {
  messages = signal<ChatMessage[]>([
    { role: 'assistant', text: 'مرحباً بك في مساعد المبيعات الذكي RASD AI. يمكنني مساعدتك في تحليل أداء فريقك، استكشاف صفقات خط المبيعات، وتقديم توقعات وتوصيات لتحقيق الأهداف البيعية. كيف يمكنني مساعدتك اليوم؟', time: '10:00 ص' },
  ]);

  suggestions = signal([
    'ما هي أفضل الفرص المبيعية حالياً؟',
    'أعطني تقريراً عن أداء فهد المطيري',
    'ما هو معدل تحويل الصفقات هذا الشهر؟',
    'توقع إجمالي الإيرادات للشهر القادم',
  ]);

  inputText = '';
  isTyping = signal(false);

  sendMessage(text?: string) {
    const messageText = text || this.inputText.trim();
    if (!messageText) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    this.messages.update(prev => [...prev, { role: 'user', text: messageText, time: timeStr }]);
    
    if (!text) {
      this.inputText = '';
    }

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
    let replyText = 'عذراً، لم أفهم استفسارك تماماً كمدير مبيعات. يمكنك سؤالي عن أداء مندوبي المبيعات، تفاصيل الصفقات الكبيرة، معدل التحويل، أو توقعات الإيرادات.';
    
    const text = userText.toLowerCase();

    if (text.includes('فرص') || text.includes('أفضل') || text.includes('الصفقات الكبيرة')) {
      replyText = 'بناءً على الصفقات النشطة في خط المبيعات، إليك أهم وأقرب الفرص للإغلاق:\n\n1. **شركة سعودي كورب للخدمات:** صفقة بقيمة **$24,000** مع المندوب *خالد الدوسري*. نسبة الإغلاق المرجحة: **85%** (مرحلة التفاوض النهائي).\n2. **منظومة الأعمال الذكية:** صفقة بقيمة **$18,500** مع المندوبة *منى العسيري*. نسبة الإغلاق: **70%** (بانتظار الموافقة على الخصم).\n3. **مجموعة الخليج للتجارة:** صفقة بقيمة **$22,000** مع المندوب *خالد الدوسري*. نسبة الإغلاق: **65%** (مرحلة إرسال العروض).\n\n💡 *توصية المساعد:* أوصي بالتركيز على إتمام عرض شركة سعودي كورب فوراً لتأمين السيولة المطلوبة.';
    } else if (text.includes('فهد') || text.includes('المطيري') || text.includes('أداء فهد')) {
      replyText = 'تقرير أداء المندوب **فهد المطيري**:\n\n💵 **إجمالي المبيعات المحققة:** $47,500.\n🎯 **نسبة تحقيق الهدف الفردي:** 95%.\n💼 **عدد الصفقات النشطة:** 8 صفقات.\n✅ **الصفقات المغلقة بنجاح:** 6 صفقات.\n📅 **تاريخ الانضمام:** 10 يناير 2026.\n\n📈 *التقييم:* أداء فهد متميز جداً وثابت، ولديه أعلى نسبة مبيعات محققة في الفريق حالياً.';
    } else if (text.includes('تحويل') || text.includes('معدل') || text.includes('التحويل')) {
      replyText = 'معدل تحويل الصفقات (Conversion Rate) لشهر يونيو 2026:\n\n📊 **معدل التحويل الحالي:** 34.5% (بزيادة +4.1% عن الشهر الماضي).\n📥 **إجمالي الفرص الواردة:** 23 فرصة.\n🤝 **الصفقات المغلقة بنجاح:** 8 صفقات.\n❌ **الصفقات المفقودة:** 2 صفقة.\n🕒 **متوسط الدورة البيعية:** 14 يوماً من أول تواصل حتى الإغلاق.';
    } else if (text.includes('توقع') || text.includes('إيرادات') || text.includes('القادم') || text.includes('المستقبل')) {
      replyText = 'توقعات المبيعات للشهر القادم (يوليو 2026):\n\n🔮 **الإيرادات المتوقعة:** $142,300.\n📈 **نسبة النمو المتوقعة:** +18.2%.\n💰 **الصفقات ذات الاحتمالية العالية (>70%):** 5 صفقات بقيمة إجمالية $64,500.\n📉 **معدل المخاطر:** منخفض بسبب تنوع المحفظة البيعية وتدفق العملاء المستمر.';
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    this.messages.update(prev => [...prev, { role: 'assistant', text: replyText, time: timeStr }]);
  }
}
