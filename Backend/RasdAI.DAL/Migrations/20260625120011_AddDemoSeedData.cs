using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddDemoSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "TenantId", "AiLimit", "CreatedAt", "IsActive", "IsAiEnabled", "IsCrmEnabled", "IsInvoicesEnabled", "IsMeetingsEnabled", "IsTasksEnabled", "Name", "Price" },
                values: new object[] { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 1000, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, true, true, true, true, "شركة رصد للتطوير والاستشارات", 499.99m });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Email", "FullName", "ManagerId", "OtpCode", "OtpExpiryTime", "PasswordHash", "RoleId", "Status", "TenantId" },
                values: new object[,]
                {
                    { 100, "owner@rasd.com", "أحمد فهيم (المالك)", null, null, null, "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=", 2, "Active", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { 101, "sales@rasd.com", "عمر البائع (مندوب مبيعات)", null, null, null, "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=", 5, "Active", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { 102, "accountant@rasd.com", "منى الحسابات (المحاسب)", null, null, null, "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=", 3, "Active", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { 103, "salesmgr@rasd.com", "محمد المبيعات (مدير المبيعات)", null, null, null, "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=", 4, "Active", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") }
                });

            migrationBuilder.InsertData(
                table: "Clients",
                columns: new[] { "Id", "CreatedAt", "CreatedByUserId", "Email", "Name", "Phone", "TenantId" },
                values: new object[,]
                {
                    { 100, new DateTime(2026, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), 101, "contact@arabian.com", "شركة المقاولات العربية", "01099998888", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { 101, new DateTime(2026, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), 101, "info@alfath.com", "مجموعة الفتح التجارية", "01288887777", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") }
                });

            migrationBuilder.InsertData(
                table: "Deals",
                columns: new[] { "Id", "Amount", "AssignedUserId", "ClientId", "CreatedAt", "Status", "TenantId" },
                values: new object[,]
                {
                    { 100, 150000m, 101, 100, new DateTime(2026, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Won", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { 101, 75000m, 101, 101, new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Won", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") }
                });

            migrationBuilder.InsertData(
                table: "Invoices",
                columns: new[] { "Id", "CreatedAt", "DealId", "DueDate", "Status", "TenantId", "TotalAmount" },
                values: new object[,]
                {
                    { 100, new DateTime(2026, 3, 15, 0, 0, 0, 0, DateTimeKind.Utc), 100, new DateTime(2026, 4, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Paid", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 150000m },
                    { 101, new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), 101, new DateTime(2026, 6, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Paid", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), 75000m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103);

            migrationBuilder.DeleteData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
        }
    }
}
