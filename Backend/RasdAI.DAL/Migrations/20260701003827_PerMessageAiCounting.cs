using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class PerMessageAiCounting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AiRequestsUsed",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(4179));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6447));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6923));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6928));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6932));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6934));

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "AiRequestsUsed",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("76e445e1-6232-431e-a152-15a18c36e1a9"),
                column: "AiRequestsUsed",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                column: "AiRequestsUsed",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(8160));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6618));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6783));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6786));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9462));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9468));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9469));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9471));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiRequestsUsed",
                table: "Tenants");

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(1805));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4103));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4602));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4606));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4608));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4611));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 222, DateTimeKind.Utc).AddTicks(5342));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4317));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4496));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 223, DateTimeKind.Utc).AddTicks(4500));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 222, DateTimeKind.Utc).AddTicks(6812));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 222, DateTimeKind.Utc).AddTicks(6816));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 222, DateTimeKind.Utc).AddTicks(6818));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 23, 40, 46, 222, DateTimeKind.Utc).AddTicks(6819));
        }
    }
}
