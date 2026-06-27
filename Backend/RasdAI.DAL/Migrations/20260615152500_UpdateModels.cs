using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Tasks",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Invoices",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Deals",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Clients",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Clients");
        }
    }
}
