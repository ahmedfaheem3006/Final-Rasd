using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddUserCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('Users', 'CreatedAt') IS NULL
BEGIN
    ALTER TABLE [Users] ADD [CreatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 516, DateTimeKind.Utc).AddTicks(6852));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 518, DateTimeKind.Utc).AddTicks(1930));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 518, DateTimeKind.Utc).AddTicks(2298));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 518, DateTimeKind.Utc).AddTicks(2302));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 516, DateTimeKind.Utc).AddTicks(9034));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 516, DateTimeKind.Utc).AddTicks(9037));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 516, DateTimeKind.Utc).AddTicks(9038));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 30, 2, 51, 29, 516, DateTimeKind.Utc).AddTicks(9040));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('Users', 'CreatedAt') IS NOT NULL
BEGIN
    ALTER TABLE [Users] DROP COLUMN [CreatedAt];
END");
        }
    }
}
