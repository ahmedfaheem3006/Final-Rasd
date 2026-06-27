using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.TenantId);
                });

            migrationBuilder.CreateTable(
                name: "Meetings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VideoFilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Transcript = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AISummary = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meetings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Meetings_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    ManagerId = table.Column<int>(type: "int", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Users_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Users_Users_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AIConversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MessagesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIConversations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AIConversations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clients_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Clients_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedUserId = table.Column<int>(type: "int", nullable: true),
                    MeetingId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Meetings_MeetingId",
                        column: x => x.MeetingId,
                        principalTable: "Meetings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tasks_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tasks_Users_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Contracts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    AIAnalysisResult = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contracts_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Contracts_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Deals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    AssignedUserId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Deals_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Deals_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Deals_Users_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notes_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Notes_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notes_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Deals_DealId",
                        column: x => x.DealId,
                        principalTable: "Deals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Invoices_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "SystemAdmin" },
                    { 2, "Owner" },
                    { 3, "Accountant" },
                    { 4, "SalesManager" },
                    { 5, "Sales" },
                    { 6, "EmployeeManager" },
                    { 7, "Employee" }
                });

            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "TenantId", "CreatedAt", "Name" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "شركة رصد للتطوير والاستشارات" });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Email", "FullName", "ManagerId", "PasswordHash", "RoleId", "TenantId" },
                values: new object[,]
                {
                    { 1, "owner@rasd.com", "أحمد فهيم (المالك)", null, "AQAAAAIAAYagAAAAEJw...", 2, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 2, "salesmanager@rasd.com", "محمد المبيعات (مدير المبيعات)", 1, "AQAAAAIAAYagAAAAEJw...", 4, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 4, "accountant@rasd.com", "منى الحسابات (المحاسب)", 1, "AQAAAAIAAYagAAAAEJw...", 3, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 5, "empmanager@rasd.com", "خالد المدير (مدير الموظفين)", 1, "AQAAAAIAAYagAAAAEJw...", 6, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 3, "sales@rasd.com", "عمر البائع (مندوب مبيعات)", 2, "AQAAAAIAAYagAAAAEJw...", 5, new Guid("11111111-1111-1111-1111-111111111111") },
                    { 6, "employee@rasd.com", "زياد الموظف (موظف)", 5, "AQAAAAIAAYagAAAAEJw...", 7, new Guid("11111111-1111-1111-1111-111111111111") }
                });

            migrationBuilder.InsertData(
                table: "Clients",
                columns: new[] { "Id", "CreatedByUserId", "Email", "Name", "Phone", "TenantId" },
                values: new object[,]
                {
                    { 1, 3, "contact@arabian.com", "شركة المقاولات العربية", "01099998888", new Guid("11111111-1111-1111-1111-111111111111") },
                    { 2, 3, "info@alfath.com", "مجموعة الفتح التجارية", "01288887777", new Guid("11111111-1111-1111-1111-111111111111") }
                });

            migrationBuilder.InsertData(
                table: "Tasks",
                columns: new[] { "Id", "AssignedUserId", "DueDate", "MeetingId", "Status", "TenantId", "Title" },
                values: new object[,]
                {
                    { 1, 3, new DateTime(2026, 6, 20, 0, 0, 0, 0, DateTimeKind.Utc), null, "Todo", new Guid("11111111-1111-1111-1111-111111111111"), "متابعة عرض السعر مع مجموعة الفتح" },
                    { 2, 6, new DateTime(2026, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), null, "InProgress", new Guid("11111111-1111-1111-1111-111111111111"), "إعداد تقرير المبيعات الشهري" }
                });

            migrationBuilder.InsertData(
                table: "Deals",
                columns: new[] { "Id", "Amount", "AssignedUserId", "ClientId", "Status", "TenantId" },
                values: new object[,]
                {
                    { 1, 150000m, 3, 1, "Won", new Guid("11111111-1111-1111-1111-111111111111") },
                    { 2, 75000m, 3, 2, "Proposal", new Guid("11111111-1111-1111-1111-111111111111") }
                });

            migrationBuilder.InsertData(
                table: "Notes",
                columns: new[] { "Id", "ClientId", "Content", "CreatedAt", "CreatedByUserId", "TenantId" },
                values: new object[] { 1, 1, "العميل مهتم جداً بعروض الأسعار البرمجية ويفضل الدفع الآجل.", new DateTime(2026, 6, 12, 12, 0, 0, 0, DateTimeKind.Utc), 3, new Guid("11111111-1111-1111-1111-111111111111") });

            migrationBuilder.InsertData(
                table: "Invoices",
                columns: new[] { "Id", "DealId", "DueDate", "Status", "TenantId", "TotalAmount" },
                values: new object[] { 1, 1, new DateTime(2026, 7, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Unpaid", new Guid("11111111-1111-1111-1111-111111111111"), 150000m });

            migrationBuilder.CreateIndex(
                name: "IX_AIConversations_TenantId",
                table: "AIConversations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_AIConversations_UserId",
                table: "AIConversations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_CreatedByUserId",
                table: "Clients",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_TenantId",
                table: "Clients",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ClientId",
                table: "Contracts",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_TenantId",
                table: "Contracts",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_AssignedUserId",
                table: "Deals",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_ClientId",
                table: "Deals",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_TenantId",
                table: "Deals",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_DealId",
                table: "Invoices",
                column: "DealId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_TenantId",
                table: "Invoices",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Meetings_TenantId",
                table: "Meetings",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_ClientId",
                table: "Notes",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_CreatedByUserId",
                table: "Notes",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_TenantId",
                table: "Notes",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AssignedUserId",
                table: "Tasks",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_MeetingId",
                table: "Tasks",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TenantId",
                table: "Tasks",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ManagerId",
                table: "Users",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIConversations");

            migrationBuilder.DropTable(
                name: "Contracts");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Notes");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "Deals");

            migrationBuilder.DropTable(
                name: "Meetings");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
