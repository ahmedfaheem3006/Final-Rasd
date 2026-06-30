using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddClientFinancialFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CommercialRegistration",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Clients",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanySize",
                table: "Clients",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Clients",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Clients",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Governorate",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Industry",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JobTitle",
                table: "Clients",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Logo",
                table: "Clients",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OpeningBalance",
                table: "Clients",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerName",
                table: "Clients",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Clients",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Street",
                table: "Clients",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxNumber",
                table: "Clients",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxPercentage",
                table: "Clients",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Clients",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "City", "CommercialRegistration", "CompanyName", "CompanySize", "Country", "CreditLimit", "Currency", "Description", "Governorate", "Industry", "JobTitle", "Logo", "OpeningBalance", "OwnerName", "PaymentTerms", "PostalCode", "Status", "Street", "TaxNumber", "TaxPercentage", "Website" },
                values: new object[] { null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Active", null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "City", "CommercialRegistration", "CompanyName", "CompanySize", "Country", "CreditLimit", "Currency", "Description", "Governorate", "Industry", "JobTitle", "Logo", "OpeningBalance", "OwnerName", "PaymentTerms", "PostalCode", "Status", "Street", "TaxNumber", "TaxPercentage", "Website" },
                values: new object[] { null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Active", null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "City", "CommercialRegistration", "CompanyName", "CompanySize", "Country", "CreditLimit", "Currency", "Description", "Governorate", "Industry", "JobTitle", "Logo", "OpeningBalance", "OwnerName", "PaymentTerms", "PostalCode", "Status", "Street", "TaxNumber", "TaxPercentage", "Website" },
                values: new object[] { null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Active", null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "City", "CommercialRegistration", "CompanyName", "CompanySize", "Country", "CreditLimit", "Currency", "Description", "Governorate", "Industry", "JobTitle", "Logo", "OpeningBalance", "OwnerName", "PaymentTerms", "PostalCode", "Status", "Street", "TaxNumber", "TaxPercentage", "Website" },
                values: new object[] { null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Active", null, null, null, null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(4566), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5517), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5519), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5521), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5543), null });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CommercialRegistration",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CompanySize",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CreditLimit",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Governorate",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Industry",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "JobTitle",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Logo",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "OpeningBalance",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "OwnerName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Street",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "TaxNumber",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "TaxPercentage",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Clients");
        }
    }
}
