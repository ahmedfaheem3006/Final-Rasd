using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingScheduleAndReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MeetingSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    MeetingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MeetingTime = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Duration = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MeetingType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Attendees = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    VirtualLink = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeetingSchedules_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Period = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    SizeLabel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "TenantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MeetingSchedules_TenantId",
                table: "MeetingSchedules",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_TenantId",
                table: "Reports",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeetingSchedules");

            migrationBuilder.DropTable(
                name: "Reports");
        }
    }
}
