using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceItemsAndExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Deals_DealId",
                table: "Invoices");

            migrationBuilder.RenameColumn(
                name: "TotalAmount",
                table: "Invoices",
                newName: "Tax");

            migrationBuilder.AlterColumn<int>(
                name: "DealId",
                table: "Invoices",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "ClientId",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Invoices",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GrandTotal",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceNumber",
                table: "Invoices",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "IssueDate",
                table: "Invoices",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "InvoiceItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Tax = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvoiceItems_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                columns: new[] { "ClientId", "CreatedByUserId", "Currency", "Discount", "GrandTotal", "InvoiceNumber", "IssueDate", "Subtotal", "Tax" },
                values: new object[] { 100, 101, "SAR", 0m, 150000m, "INV-00100", new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(7523), 150000m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                columns: new[] { "ClientId", "CreatedByUserId", "Currency", "Discount", "GrandTotal", "InvoiceNumber", "IssueDate", "Subtotal", "Tax" },
                values: new object[] { 101, 101, "SAR", 0m, 75000m, "INV-00101", new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(8820), 75000m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                columns: new[] { "ClientId", "CreatedByUserId", "Currency", "Discount", "GrandTotal", "InvoiceNumber", "IssueDate", "Subtotal", "Tax" },
                values: new object[] { 102, 19, "SAR", 0m, 200000m, "INV-00102", new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(9211), 200000m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "ClientId", "CreatedByUserId", "Currency", "Discount", "GrandTotal", "InvoiceNumber", "IssueDate", "Status", "Subtotal", "Tax" },
                values: new object[] { 102, 19, "SAR", 0m, 50000m, "INV-00103", new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(9215), "Pending", 50000m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "ClientId", "CreatedByUserId", "Currency", "Discount", "GrandTotal", "InvoiceNumber", "IssueDate", "Status", "Subtotal", "Tax" },
                values: new object[] { 102, 20, "SAR", 0m, 85000m, "INV-00104", new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(9218), "Pending", 85000m, 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                columns: new[] { "ClientId", "CreatedByUserId", "Currency", "Discount", "GrandTotal", "InvoiceNumber", "IssueDate", "Subtotal", "Tax" },
                values: new object[] { 103, 20, "SAR", 0m, 120000m, "INV-00105", new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(9220), 120000m, 0m });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(3006));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(8965));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(9125));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(9127));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(3898));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(3900));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(3902));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 28, 12, 46, 43, 603, DateTimeKind.Utc).AddTicks(3912));

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CreatedByUserId",
                table: "Invoices",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_InvoiceId",
                table: "InvoiceItems",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Clients_ClientId",
                table: "Invoices",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Deals_DealId",
                table: "Invoices",
                column: "DealId",
                principalTable: "Deals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Users_CreatedByUserId",
                table: "Invoices",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Clients_ClientId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Deals_DealId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Users_CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropTable(
                name: "InvoiceItems");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ClientId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "GrandTotal",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "IssueDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Subtotal",
                table: "Invoices");

            migrationBuilder.RenameColumn(
                name: "Tax",
                table: "Invoices",
                newName: "TotalAmount");

            migrationBuilder.AlterColumn<int>(
                name: "DealId",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 100,
                column: "TotalAmount",
                value: 150000m);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 101,
                column: "TotalAmount",
                value: 75000m);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 102,
                column: "TotalAmount",
                value: 200000m);

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 103,
                columns: new[] { "Status", "TotalAmount" },
                values: new object[] { "Unpaid", 50000m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 104,
                columns: new[] { "Status", "TotalAmount" },
                values: new object[] { "Unpaid", 85000m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: 105,
                column: "TotalAmount",
                value: 120000m);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(4566));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 61, DateTimeKind.Utc).AddTicks(381));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 19,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 61, DateTimeKind.Utc).AddTicks(552));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 20,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 61, DateTimeKind.Utc).AddTicks(568));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 100,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5517));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 101,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5519));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 102,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5521));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 103,
                column: "CreatedAt",
                value: new DateTime(2026, 6, 27, 17, 59, 0, 60, DateTimeKind.Utc).AddTicks(5543));

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Deals_DealId",
                table: "Invoices",
                column: "DealId",
                principalTable: "Deals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
