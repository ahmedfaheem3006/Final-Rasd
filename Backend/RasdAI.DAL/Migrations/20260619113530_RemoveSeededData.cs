using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeededData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Notes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "TenantId", "CreatedAt", "Name" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "شركة رصد للتطوير والاستشارات" });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Email", "FullName", "ManagerId", "PasswordHash", "RoleId", "TenantId" },
                values: new object[,]
                {
                    { 1, "owner@rasd.com", "أحمد فهيم (المالك)", null, "AQAAAAIAAYagAAAAEJw...", 2, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 2, "salesmanager@rasd.com", "محمد المبيعات (مدير المبيعات)", 1, "AQAAAAIAAYagAAAAEJw...", 4, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 4, "accountant@rasd.com", "منى الحسابات (المحاسب)", 1, "AQAAAAIAAYagAAAAEJw...", 3, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 5, "empmanager@rasd.com", "خالد المدير (مدير الموظفين)", 1, "AQAAAAIAAYagAAAAEJw...", 6, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 3, "sales@rasd.com", "عمر البائع (مندوب مبيعات)", 2, "AQAAAAIAAYagAAAAEJw...", 5, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 6, "employee@rasd.com", "زياد الموظف (موظف)", 5, "AQAAAAIAAYagAAAAEJw...", 7, new Guid("11111111-1111-1111-1111-111111111111") }
                });

            migrationBuilder.InsertData(
                table: "Clients",
                columns: new[] { "Id", "CreatedAt", "CreatedByUserId", "Email", "Name", "Phone", "TenantId" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 6, 18, 14, 57, 50, 359, DateTimeKind.Utc).AddTicks(7911), 3, "contact@arabian.com", "شركة المقاولات العربية", "01099998888", new Guid("11111111-1111-1111-1111-111111111111") },
                    { 2, new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(762), 3, "info@alfath.com", "مجموعة الفتح التجارية", "01288887777", new Guid("11111111-1111-1111-1111-111111111111") }
                });

            migrationBuilder.InsertData(
                table: "Tasks",
                columns: new[] { "Id", "AssignedUserId", "CreatedAt", "DueDate", "MeetingId", "Status", "TenantId", "Title" },
                values: new object[,]
                {
                    { 1, 3, new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(9425), new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Utc), null, "Todo", new Guid("11111111-1111-1111-1111-111111111111"), "متابعة عرض السعر مع مجموعة الفتح" },
                    { 2, 6, new DateTime(2026, 6, 18, 14, 57, 50, 361, DateTimeKind.Utc).AddTicks(1365), new DateTime(2026, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), null, "InProgress", new Guid("11111111-1111-1111-1111-111111111111"), "إعداد تقرير المبيعات الشهري" }
                });

            migrationBuilder.InsertData(
                table: "Deals",
                columns: new[] { "Id", "Amount", "AssignedUserId", "ClientId", "CreatedAt", "Status", "TenantId" },
                values: new object[,]
                {
                    { 1, 150000m, 3, 1, new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(3508), "Won", new Guid("11111111-1111-1111-1111-111111111111") },
                    { 2, 75000m, 3, 2, new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(5472), "Proposal", new Guid("11111111-1111-1111-1111-111111111111") }
                });

            migrationBuilder.InsertData(
                table: "Notes",
                columns: new[] { "Id", "ClientId", "Content", "CreatedAt", "CreatedByUserId", "TenantId" },
                values: new object[] { 1, 1, "العميل مهتم جداً بعروض الأسعار البرمجية ويفضل الدفع الآجل.", new DateTime(2026, 6, 12, 12, 0, 0, 0, DateTimeKind.Utc), 3, new Guid("11111111-1111-1111-1111-111111111111") });

            migrationBuilder.InsertData(
                table: "Invoices",
                columns: new[] { "Id", "CreatedAt", "DealId", "DueDate", "Status", "TenantId", "TotalAmount" },
                values: new object[] { 1, new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(6326), 1, new DateTime(2026, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Unpaid", new Guid("11111111-1111-1111-1111-111111111111"), 150000m });
        }
    }
}
