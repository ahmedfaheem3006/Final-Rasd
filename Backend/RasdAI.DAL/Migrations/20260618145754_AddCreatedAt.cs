using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 359, DateTimeKind.Utc).AddTicks(7911));

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(762));

            migrationBuilder.UpdateData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(3508));

            migrationBuilder.UpdateData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(5472));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(6326));

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 360, DateTimeKind.Utc).AddTicks(9425));

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 18, 14, 57, 50, 361, DateTimeKind.Utc).AddTicks(1365));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 811, DateTimeKind.Utc).AddTicks(3850));

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 811, DateTimeKind.Utc).AddTicks(5146));

            migrationBuilder.UpdateData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 811, DateTimeKind.Utc).AddTicks(5868));

            migrationBuilder.UpdateData(
                table: "Deals",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 811, DateTimeKind.Utc).AddTicks(7138));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 811, DateTimeKind.Utc).AddTicks(7689));

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 811, DateTimeKind.Utc).AddTicks(9390));

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 15, 15, 24, 57, 812, DateTimeKind.Utc).AddTicks(714));
        }
    }
}
