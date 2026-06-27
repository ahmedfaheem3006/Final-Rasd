# رصد AI — منصة SaaS الذكية للمبيعات وإدارة الأعمال (Backend)

أهلاً بكم في المستودع البرمجي الخاص بالخلفية (Backend) لمشروع تخرج **رصد AI**. تم إعداد هذا الهيكل ليكون جاهزاً للعمل مباشرة من قِبل أعضاء الفريق الستة بالتوازي.

---

## 🏗️ البنية المعمارية للمشروع (3-Layer Architecture)

تم تقسيم المشروع إلى 3 طبقات رئيسية لضمان فصل المسؤوليات وسهولة الصيانة:

1. **`RasdAI.DAL` (Data Access Layer):** 
   * تحتوي على الكيانات والجداول الأساسية (Entities) وسياق اتصال قاعدة البيانات (DbContext).
2. **`RasdAI.BLL` (Business Logic Layer):**
   * تحتوي على منطق العمل، الخدمات (Services)، واجهات الخدمات (Interfaces)، وهياكل نقل البيانات (DTOs)، ومحولات البيانات والتحقق (Mappings & Validators).
3. **`RasdAI.API` (Presentation Layer):**
   * مشروع Web API الذي يحتوي على المتحكمات (Controllers) ونقاط الاتصال الخارجية والـ Middlewares المشتركة.

---

## 🛠️ متطلبات التشغيل الأساسية (Prerequisites)

يرجى التأكد من تثبيت الأدوات التالية على أجهزتكم قبل البدء:
* **.NET 9 SDK** (أو أحدث).
* **Docker Desktop** (لتشغيل قاعدة البيانات دون الحاجة لتثبيت PostgreSQL محلياً).
* بيئة تطوير مثل **Visual Studio 2022**, **VS Code**, أو **JetBrains Rider**.

---

## 🚀 طريقة البدء والتشغيل الفوري للمشروع

اتبع الخطوات التالية لتشغيل المشروع على جهازك:

### 1. تشغيل قاعدة البيانات (PostgreSQL + pgvector)
قمنا بإعداد ملف `docker-compose.yml` جاهز يحتوي على قاعدة البيانات مع ميزة المتجهات المدمجة للذكاء الاصطناعي. قم بفتح سطر الأوامر في مجلد المشروع الرئيسي وشغّل الأمر التالي:
```bash
docker-compose up -d
```
سيقوم هذا الأمر بتحميل وتشغيل سيرفر PostgreSQL محلياً على البورت `5432` باسم قاعدة بيانات `RasdAIDb` وكلمة مرور `Password123` الافتراضية.

### 2. تحميل الحزم وبناء المشروع (Restore & Build)
قم بتشغيل الأوامر التالية لاستعادة حزم الـ Nuget وبناء الحل البرمجي بالكامل:
```bash
# استعادة الحزم
dotnet restore Backend/RasdAI.slnx

# بناء المشروع والتأكد من خلوه من الأخطاء
dotnet build Backend/RasdAI.slnx
```

### 3. تشغيل الـ Web API
لتشغيل الخادم والتفاعل مع الـ Swagger (واجهة اختبار الـ APIs)، قم بتشغيل الأمر التالي:
```bash
dotnet run --project Backend/RasdAI.API/RasdAI.API.csproj
```
بعد التشغيل، افتح المتصفح على الرابط الموضح في الشاشة (عادة ما يكون `http://localhost:5000/swagger` أو رابط الهوست المحلي المعروض) للوصول للـ Swagger.

---

## 📝 دليل التطوير المشترك للفريق (Development Guide)

لتسهيل عمل الـ 6 أفراد بالتوازي، يرجى الالتزام بالخطوات التالية عند كتابة الكود:

* **الكيانات (Entities):**
  تجدونها في مشروع `RasdAI.DAL` داخل المجلد `Entities`. يرجى فتح الكيان الخاص بميزتك (مثال: `Customer.cs` أو `Invoice.cs`) وإضافة الخصائص والحقول البرمجية المطلوبة مع تحديد العلاقات.
* **ربط الداتابيز وتوليد التهجيرات (Migrations):**
  بعد إضافة الحقول للكيانات، قم بتعريف جداول الـ `DbSet` داخل كلاس `AppDbContext.cs` في `RasdAI.DAL` ثم قم بتوليد التهجيرات عبر الكونسول:
  ```bash
  dotnet ef migrations add InitialCreate --project Backend/RasdAI.DAL/RasdAI.DAL.csproj --startup-project Backend/RasdAI.API/RasdAI.API.csproj
  dotnet ef database update --project Backend/RasdAI.DAL/RasdAI.DAL.csproj --startup-project Backend/RasdAI.API/RasdAI.API.csproj
  ```
* **منطق العمل والخدمات (Services & BLL):**
  يرجى تعريف التواقيع البرمجية في الواجهة (مثل `ICrmService.cs` في موديول `Interfaces`) ثم كتابة منطق العمل الفعلي بداخل الكلاس المنفذ لها (مثل `CrmService.cs` في موديول `Services`).
* **الـ DTOs والـ Controllers:**
  تأكد من استخدام الـ DTOs لنقل البيانات بدلاً من تمرير الكيانات الأساسية مباشرة في الـ Controller لحماية هيكل قاعدة البيانات.

---
تمنياتنا لكم بالتوفيق في تطوير المنصة! لأي استفسارات تقنية، تواصلوا مباشرة في الفريق.
