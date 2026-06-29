using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoicePaymentTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "Payments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionNumber",
                table: "Payments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RemainingBalance",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "IssueDate", "PaidAmount", "RemainingBalance" },
                values: new object[] { new DateTime(2026, 6, 28, 23, 50, 5, 814, DateTimeKind.Utc).AddTicks(9008), 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "IssueDate", "PaidAmount", "RemainingBalance" },
                values: new object[] { new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(2965), 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "IssueDate", "PaidAmount", "RemainingBalance" },
                values: new object[] { new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(4210), 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "IssueDate", "PaidAmount", "RemainingBalance" },
                values: new object[] { new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(4217), 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "IssueDate", "PaidAmount", "RemainingBalance" },
                values: new object[] { new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(4223), 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "IssueDate", "PaidAmount", "RemainingBalance" },
                values: new object[] { new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(4227), 0m, 0m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 813, DateTimeKind.Utc).AddTicks(4578));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(3516));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(3984));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 815, DateTimeKind.Utc).AddTicks(3989));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 813, DateTimeKind.Utc).AddTicks(7463));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 813, DateTimeKind.Utc).AddTicks(7467));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 813, DateTimeKind.Utc).AddTicks(7472));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 23, 50, 5, 813, DateTimeKind.Utc).AddTicks(7564));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankName",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "TransactionNumber",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "RemainingBalance",
                table: "Invoices");

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                column: "IssueDate",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(5527));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                column: "IssueDate",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(8280));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                column: "IssueDate",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(9173));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                column: "IssueDate",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(9181));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                column: "IssueDate",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(9185));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                column: "IssueDate",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(9189));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 119, DateTimeKind.Utc).AddTicks(5674));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(8623));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(8974));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 120, DateTimeKind.Utc).AddTicks(8977));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 119, DateTimeKind.Utc).AddTicks(7581));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 119, DateTimeKind.Utc).AddTicks(7585));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 119, DateTimeKind.Utc).AddTicks(7588));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 21, 8, 24, 119, DateTimeKind.Utc).AddTicks(7657));
        }
    }
}
