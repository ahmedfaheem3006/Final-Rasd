using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantMaxUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxUsers",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "FileName",
                table: "Contracts",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

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
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "MaxUsers",
                value: 999999);

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("76e445e1-6232-431e-a152-15a18c36e1a9"),
                column: "MaxUsers",
                value: 15);

            migrationBuilder.UpdateData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                column: "MaxUsers",
                value: 999999);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxUsers",
                table: "Tenants");

            migrationBuilder.AlterColumn<string>(
                name: "FileName",
                table: "Contracts",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(2964));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5235));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5753));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5758));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5761));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                column: "IssueDate",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5764));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 940, DateTimeKind.Utc).AddTicks(6445));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5447));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5678));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 941, DateTimeKind.Utc).AddTicks(5680));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 940, DateTimeKind.Utc).AddTicks(7636));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 940, DateTimeKind.Utc).AddTicks(7639));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 940, DateTimeKind.Utc).AddTicks(7641));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 11, 35, 54, 940, DateTimeKind.Utc).AddTicks(7643));
        }
    }
}
