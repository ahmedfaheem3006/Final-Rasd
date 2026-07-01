using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddUserHRFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Allowances",
                table: "Users",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "ContractEnd",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ContractStart",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Salary",
                table: "Users",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(3241));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5398));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5974));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5978));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5981));

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                column: "IssueDate",
                value: new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5984));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 4000m, new DateTime(2026, 12, 31, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 945, DateTimeKind.Utc).AddTicks(5611), "+966500000001", 20000m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 5000m, new DateTime(2028, 6, 24, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5619), "+966507000007", 25000m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 3000m, new DateTime(2028, 6, 24, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5865), "+966507000019", 9500m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 3000m, new DateTime(2028, 6, 24, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 946, DateTimeKind.Utc).AddTicks(5871), "+966507000020", 9500m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 5000m, new DateTime(2026, 1, 14, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 945, DateTimeKind.Utc).AddTicks(7953), "+966501234100", 25000m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 3000m, new DateTime(2026, 1, 31, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 2, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 945, DateTimeKind.Utc).AddTicks(7959), "+966501234101", 9500m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 2000m, new DateTime(2026, 2, 28, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 945, DateTimeKind.Utc).AddTicks(7986), "+966501234102", 12000m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Allowances", "ContractEnd", "ContractStart", "CreatedAt", "PhoneNumber", "Salary" },
                values: new object[] { 4500m, new DateTime(2026, 3, 31, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 7, 1, 1, 12, 7, 945, DateTimeKind.Utc).AddTicks(7989), "+966501234103", 16000m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Allowances",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ContractEnd",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ContractStart",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Salary",
                table: "Users");

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
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(8160), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6618), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6783), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 574, DateTimeKind.Utc).AddTicks(6786), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9462), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9468), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9469), null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "CreatedAt", "PhoneNumber" },
                values: new object[] { new DateTime(2026, 7, 1, 0, 38, 26, 573, DateTimeKind.Utc).AddTicks(9471), null });
        }
    }
}
