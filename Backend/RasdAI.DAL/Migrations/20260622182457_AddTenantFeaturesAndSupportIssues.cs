using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantFeaturesAndSupportIssues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAiEnabled",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCrmEnabled",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsInvoicesEnabled",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsMeetingsEnabled",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTasksEnabled",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "SupportIssues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IssueDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AiActionDetails = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportIssues", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SupportIssues",
                columns: new[] { "Id", "AiActionDetails", "CreatedAt", "IssueDescription", "Status", "TenantId", "TenantName" },
                values: new object[,]
                {
                    { new Guid("22222222-2222-2222-2222-222222222222"), "اكتشف الذكاء الاصطناعي ملفات سجلات (logs) ضخمة غير مضغوطة. الإجراء المقترح: ضغط وحذف ملفات السجلات القديمة تلقائياً لتوفير 40GB من المساحة.", new DateTime(2026, 6, 21, 14, 30, 0, 0, DateTimeKind.Utc), "استهلاك مساحة القرص الصلب تجاوز 95% على الخادم الرئيسي للشركة.", "Pending", new Guid("33333333-3333-3333-3333-333333333333"), "رصد للتقنية" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "اكتشف الذكاء الاصطناعي خطأ في الاتصال مع سيرفر SMTP بسبب انتهاء صلاحية الرمز المميز (Token). الإجراء المقترح: إعادة الاتصال وإصدار توكن جديد لإرسال الفواتير المعلقة.", new DateTime(2026, 6, 22, 10, 0, 0, 0, DateTimeKind.Utc), "فشل متكرر في إرسال البريد الإلكتروني الخاص بالفواتير للعملاء.", "Pending", new Guid("44444444-4444-4444-4444-444444444444"), "مؤسسة القمة" }
                });

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "IsAiEnabled", "IsCrmEnabled", "IsInvoicesEnabled", "IsMeetingsEnabled", "IsTasksEnabled" },
                values: new object[] { true, true, true, true, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SupportIssues");

            migrationBuilder.DropColumn(
                name: "IsAiEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IsCrmEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IsInvoicesEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IsMeetingsEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IsTasksEnabled",
                table: "Tenants");
        }
    }
}
