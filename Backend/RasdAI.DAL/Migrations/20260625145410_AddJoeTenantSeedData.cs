using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RasdAI.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddJoeTenantSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var joeTenantId = "76e445e1-6232-431e-a152-15a18c36e1a9";

            var now = "2026-06-25T00:00:00Z";

            migrationBuilder.Sql($@"
                IF NOT EXISTS (SELECT 1 FROM Tenants WHERE TenantId = '{joeTenantId}')
                    INSERT INTO Tenants (TenantId, Name, CreatedAt, IsActive, Price, AiLimit, IsCrmEnabled, IsInvoicesEnabled, IsTasksEnabled, IsMeetingsEnabled, IsAiEnabled)
                    VALUES ('{joeTenantId}', N'شركة جو للخدمات', '{now}', 1, 199.99, 2000, 1, 1, 1, 1, 1);
            ");

            migrationBuilder.Sql($@"
                SET IDENTITY_INSERT Users ON;
                IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = 7)
                    INSERT INTO Users (Id, TenantId, RoleId, FullName, Email, PasswordHash, Status)
                    VALUES (7, '{joeTenantId}', 2, N'جو المالك', 'joe@rasd.com', '0ocFH8CB123YXvwpHXdNY00CYOXsehVfYI7i3qOWcGY=', N'Active');

                IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = 19)
                    INSERT INTO Users (Id, TenantId, RoleId, FullName, Email, PasswordHash, Status)
                    VALUES (19, '{joeTenantId}', 5, N'صالح مندوب جو', 'sales_joe@rasd.com', '0ocFH8CB123YXvwpHXdNY00CYOXsehVfYI7i3qOWcGY=', N'Active');

                IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = 20)
                    INSERT INTO Users (Id, TenantId, RoleId, FullName, Email, PasswordHash, Status)
                    VALUES (20, '{joeTenantId}', 5, N'عمر مندوب جو', 'sales2_joe@rasd.com', '0ocFH8CB123YXvwpHXdNY00CYOXsehVfYI7i3qOWcGY=', N'Active');
                SET IDENTITY_INSERT Users OFF;
            ");

            migrationBuilder.Sql($@"
                SET IDENTITY_INSERT Clients ON;
                IF NOT EXISTS (SELECT 1 FROM Clients WHERE Id = 102)
                    INSERT INTO Clients (Id, TenantId, Name, Email, Phone, CreatedByUserId, CreatedAt)
                    VALUES (102, '{joeTenantId}', N'شركة التقنية المتطورة', 'info@techco.com', '+966501234567', 7, '{now}');

                IF NOT EXISTS (SELECT 1 FROM Clients WHERE Id = 103)
                    INSERT INTO Clients (Id, TenantId, Name, Email, Phone, CreatedByUserId, CreatedAt)
                    VALUES (103, '{joeTenantId}', N'مؤسسة الخدمات اللوجستية', 'contact@logistics.com', '+966507654321', 7, '{now}');
                SET IDENTITY_INSERT Clients OFF;
            ");

            migrationBuilder.Sql($@"
                SET IDENTITY_INSERT Deals ON;
                IF NOT EXISTS (SELECT 1 FROM Deals WHERE Id = 102)
                    INSERT INTO Deals (Id, TenantId, ClientId, AssignedUserId, Amount, Status, CreatedAt)
                    VALUES (102, '{joeTenantId}', 102, 19, 200000, 'Won', '{now}');

                IF NOT EXISTS (SELECT 1 FROM Deals WHERE Id = 103)
                    INSERT INTO Deals (Id, TenantId, ClientId, AssignedUserId, Amount, Status, CreatedAt)
                    VALUES (103, '{joeTenantId}', 102, 20, 85000, 'Proposal', '{now}');

                IF NOT EXISTS (SELECT 1 FROM Deals WHERE Id = 104)
                    INSERT INTO Deals (Id, TenantId, ClientId, AssignedUserId, Amount, Status, CreatedAt)
                    VALUES (104, '{joeTenantId}', 103, NULL, 120000, 'Contacted', '{now}');
                SET IDENTITY_INSERT Deals OFF;
            ");

            migrationBuilder.Sql($@"
                SET IDENTITY_INSERT Invoices ON;
                IF NOT EXISTS (SELECT 1 FROM Invoices WHERE Id = 102)
                    INSERT INTO Invoices (Id, TenantId, DealId, TotalAmount, Status, DueDate, CreatedAt)
                    VALUES (102, '{joeTenantId}', 102, 200000, 'Paid', '2026-07-25T00:00:00Z', '{now}');

                IF NOT EXISTS (SELECT 1 FROM Invoices WHERE Id = 103)
                    INSERT INTO Invoices (Id, TenantId, DealId, TotalAmount, Status, DueDate, CreatedAt)
                    VALUES (103, '{joeTenantId}', 102, 50000, 'Unpaid', '2026-07-10T00:00:00Z', '{now}');

                IF NOT EXISTS (SELECT 1 FROM Invoices WHERE Id = 104)
                    INSERT INTO Invoices (Id, TenantId, DealId, TotalAmount, Status, DueDate, CreatedAt)
                    VALUES (104, '{joeTenantId}', 103, 85000, 'Unpaid', '2026-08-09T00:00:00Z', '{now}');

                IF NOT EXISTS (SELECT 1 FROM Invoices WHERE Id = 105)
                    INSERT INTO Invoices (Id, TenantId, DealId, TotalAmount, Status, DueDate, CreatedAt)
                    VALUES (105, '{joeTenantId}', 104, 120000, 'Overdue', '2026-06-15T00:00:00Z', '{now}');
                SET IDENTITY_INSERT Invoices OFF;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Invoices WHERE Id IN (102,103,104,105)");
            migrationBuilder.Sql("DELETE FROM Deals WHERE Id IN (102,103,104)");
            migrationBuilder.Sql("DELETE FROM Clients WHERE Id IN (102,103)");
            migrationBuilder.Sql("DELETE FROM Users WHERE Id IN (7,19,20)");
            migrationBuilder.Sql("DELETE FROM Tenants WHERE TenantId = '76e445e1-6232-431e-a152-15a18c36e1a9'");
        }
    }
}
