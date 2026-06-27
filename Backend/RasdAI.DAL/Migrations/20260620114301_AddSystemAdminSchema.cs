using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemAdminSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AiLimit",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Tenants",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Tenants",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "TenantId", "AiLimit", "CreatedAt", "IsActive", "Name", "Price" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), 99999, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "System Administration", 0.0m });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Email", "FullName", "ManagerId", "PasswordHash", "RoleId", "TenantId" },
                values: new object[] { 1, "faheem.admin@gmail.com", "مدير النظام العام", null, "XC79lW2YM1/IxvvW+g0u9nU87lE8sbYdG95ZQMH4njM=", 1, new Guid("11111111-1111-1111-1111-111111111111") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "TenantId",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DropColumn(
                name: "AiLimit",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Tenants");
        }
    }
}
