import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // ── Public Routes ─────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./pages/shared/landing-page/landing-page').then(m => m.LandingPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/shared/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/shared/register-company/register-company').then(m => m.RegisterCompany)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/shared/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/shared/unauthorized/unauthorized').then(m => m.Unauthorized)
  },

  // ── Protected Shell Layout ────────────────────────────────────────────────
  {
    path: 'app',
    loadComponent: () => import('./layouts/layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [

      // ── System Admin ──────────────────────────────────────────────────────
      {
        path: 'sys-admin/overview',
        loadComponent: () => import('./pages/system-admin/system-overview/system-overview').then(m => m.SystemOverview),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/tenants',
        loadComponent: () => import('./pages/system-admin/tenants/tenants').then(m => m.Tenants),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/tenants/:id',
        loadComponent: () => import('./pages/system-admin/tenant-detail/tenant-detail').then(m => m.TenantDetail),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/management',
        loadComponent: () => import('./pages/system-admin/management/management').then(m => m.Management),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/support-ai',
        loadComponent: () => import('./pages/system-admin/support-ai/support-ai').then(m => m.SupportAi),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/add-tenant',
        loadComponent: () => import('./pages/system-admin/add-tenant/add-tenant').then(m => m.AddTenant),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/settings',
        loadComponent: () => import('./pages/system-admin/settings/settings').then(m => m.Settings),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/pricing',
        loadComponent: () => import('./pages/system-admin/pricing/pricing').then(m => m.PricingMgmt),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/pending-registrations',
        loadComponent: () => import('./pages/system-admin/pending-registrations/pending-registrations').then(m => m.PendingRegistrations),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },
      {
        path: 'sys-admin/messages',
        loadComponent: () => import('./pages/system-admin/messages/messages').then(m => m.MessagesComponent),
        canActivate: [roleGuard],
        data: { roles: ['system-admin'] }
      },

      // ── Owner / Admin ─────────────────────────────────────────────────────
      {
        path: 'owner/dashboard',
        loadComponent: () => import('./pages/owner-admin/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin'] }
      },
      {
        path: 'owner/users',
        loadComponent: () => import('./pages/owner-admin/user-management/user-management').then(m => m.UserManagement),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin'] }
      },
      {
        path: 'owner/deals',
        loadComponent: () => import('./pages/owner-admin/deals-pipeline/deals-pipeline').then(m => m.DealsPipeline),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'owner/reports',
        loadComponent: () => import('./pages/owner-admin/reports/reports').then(m => m.Reports),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'owner/meetings',
        loadComponent: () => import('./pages/owner-admin/meetings/meetings').then(m => m.Meetings),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin'], permission: 'isMeetingsEnabled' }
      },
      {
        path: 'owner/ai-assistant',
        loadComponent: () => import('./pages/owner-admin/ai-assistant/ai-assistant').then(m => m.AiAssistant),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin', 'employee-manager'], permission: 'isAiEnabled' }
      },
      {
        path: 'owner/analyze-contract',
        loadComponent: () => import('./pages/owner-admin/analyze-contract/analyze-contract').then(m => m.AnalyzeContract),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin', 'hr'], permission: 'isAiEnabled' }
      },
      {
        path: 'owner/transcribe-meeting',
        loadComponent: () => import('./pages/owner-admin/transcribe-meeting/transcribe-meeting').then(m => m.TranscribeMeeting),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin', 'hr'], permission: 'isAiEnabled' }
      },
      {
        path: 'owner/leaves',
        loadComponent: () => import('./pages/owner-admin/leave-requests/leave-requests').then(m => m.LeaveRequests),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin'] }
      },
      {
        path: 'owner/settings',
        loadComponent: () => import('./pages/owner-admin/settings/settings').then(m => m.Settings),
        canActivate: [roleGuard],
        data: { roles: ['owner-admin', 'hr', 'employee-manager'] }
      },
      {
        path: 'meetings',
        loadComponent: () => import('./pages/owner-admin/meetings/meetings').then(m => m.Meetings),
        canActivate: [roleGuard],
        data: { permission: 'isMeetingsEnabled' }
      },

      // ── Accountant ────────────────────────────────────────────────────────
      {
        path: 'accountant/dashboard',
        loadComponent: () => import('./pages/accountant/dashboard/dashboard').then(m => m.AccountantDashboard),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/finance',
        loadComponent: () => import('./pages/accountant/finance-overview/finance-overview').then(m => m.FinanceOverview),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/clients',
        loadComponent: () => import('./pages/accountant/clients/clients').then(m => m.AccountantClients),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/clients/:id',
        loadComponent: () => import('./pages/accountant/client-detail/client-detail').then(m => m.ClientDetail),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/customers',
        loadComponent: () => import('./pages/accountant/customers-readonly/customers-readonly').then(m => m.CustomersReadonly),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/contracts',
        loadComponent: () => import('./pages/accountant/contracts/contracts').then(m => m.Contracts),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/contracts/:id',
        loadComponent: () => import('./pages/accountant/contract-detail/contract-detail').then(m => m.ContractDetail),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/invoices',
        loadComponent: () => import('./pages/accountant/invoices/invoices').then(m => m.Invoices),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/invoices/:id',
        loadComponent: () => import('./pages/accountant/invoice-detail/invoice-detail').then(m => m.InvoiceDetail),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/payments',
        loadComponent: () => import('./pages/accountant/payments/payments').then(m => m.PaymentsComponent),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/payments/:id',
        loadComponent: () => import('./pages/accountant/payment-detail/payment-detail').then(m => m.PaymentDetailComponent),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/expenses',
        loadComponent: () => import('./pages/accountant/expenses/expenses').then(m => m.ExpensesComponent),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'accountant/reports',
        loadComponent: () => import('./pages/accountant/reports/reports').then(m => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { roles: ['accountant', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },

      // ── Sales Manager ─────────────────────────────────────────────────────
      {
        path: 'sales-manager/dashboard',
        loadComponent: () => import('./pages/sales-manager/sales-manager-dashboard/sales-manager-dashboard').then(m => m.SalesManagerDashboard),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-manager/team',
        loadComponent: () => import('./pages/sales-manager/sales-team/sales-team').then(m => m.SalesTeam),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-manager/customers',
        loadComponent: () => import('./pages/sales-manager/customers/customers').then(m => m.Customers),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-manager/deals',
        loadComponent: () => import('./pages/sales-manager/deals-pipeline/deals-pipeline').then(m => m.SalesManagerDealsPipeline),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-manager/tasks',
        loadComponent: () => import('./pages/sales-manager/tasks/tasks').then(m => m.SalesManagerTasks),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isTasksEnabled' }
      },
      {
        path: 'sales-manager/ai-assistant',
        loadComponent: () => import('./pages/sales-manager/ai-assistant/ai-assistant').then(m => m.SalesManagerAiAssistant),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isAiEnabled' }
      },
      {
        path: 'sales-manager/analyze-contract',
        loadComponent: () => import('./pages/sales-manager/analyze-contract/analyze-contract').then(m => m.SmAnalyzeContract),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager', 'owner-admin'], permission: 'isAiEnabled' }
      },
      {
        path: 'sales-manager/contracts',
        loadComponent: () => import('./pages/sales-manager/contracts/contracts').then(m => m.SmContracts),
        canActivate: [roleGuard],
        data: { roles: ['sales-manager'], permission: 'isCrmEnabled' }
      },

      // ── Employee Manager ──────────────────────────────────────────────────
      {
        path: 'emp-manager/team',
        loadComponent: () => import('./pages/employee-manager/team-management/team-management').then(m => m.TeamManagement),
        canActivate: [roleGuard],
        data: { roles: ['employee-manager', 'owner-admin'] }
      },
      {
        path: 'emp-manager/tasks',
        loadComponent: () => import('./pages/employee-manager/team-tasks-board/team-tasks-board').then(m => m.TeamTasksBoard),
        canActivate: [roleGuard],
        data: { roles: ['employee-manager', 'owner-admin'], permission: 'isTasksEnabled' }
      },
      {
        path: 'emp-manager/meetings',
        loadComponent: () => import('./pages/employee-manager/meetings/meetings').then(m => m.EmployeeManagerMeetings),
        canActivate: [roleGuard],
        data: { roles: ['employee-manager', 'owner-admin'], permission: 'isMeetingsEnabled' }
      },
      {
        path: 'emp-manager/leaves',
        loadComponent: () => import('./pages/employee-manager/leave-requests/leave-requests').then(m => m.EmployeeManagerLeaveRequests),
        canActivate: [roleGuard],
        data: { roles: ['employee-manager', 'owner-admin'] }
      },
      {
        path: 'emp-manager/attendance',
        loadComponent: () => import('./pages/employee-manager/attendance/attendance').then(m => m.EmployeeManagerAttendance),
        canActivate: [roleGuard],
        data: { roles: ['employee-manager', 'owner-admin'] }
      },
      {
        path: 'hr/dashboard',
        loadComponent: () => import('./pages/hr/dashboard/dashboard').then(m => m.HRDashboard),
        canActivate: [roleGuard],
        data: { roles: ['hr', 'owner-admin'] }
      },
      {
        path: 'hr/employees',
        loadComponent: () => import('./pages/hr/employees/employees').then(m => m.HREmployees),
        canActivate: [roleGuard],
        data: { roles: ['hr', 'owner-admin'] }
      },
      {
        path: 'hr/leaves',
        loadComponent: () => import('./pages/hr/leaves/leaves').then(m => m.HRLeaves),
        canActivate: [roleGuard],
        data: { roles: ['hr', 'owner-admin'] }
      },
      {
        path: 'hr/recruitment',
        loadComponent: () => import('./pages/hr/recruitment/recruitment').then(m => m.HRRecruitment),
        canActivate: [roleGuard],
        data: { roles: ['hr', 'owner-admin'] }
      },
      {
        path: 'hr/reports',
        loadComponent: () => import('./pages/employee-manager/reports/reports').then(m => m.EmployeeManagerReports),
        canActivate: [roleGuard],
        data: { roles: ['hr', 'owner-admin'], permission: 'isInvoicesEnabled' }
      },
      {
        path: 'hr/interview-analysis',
        loadComponent: () => import('./pages/hr/interview-analysis/interview-analysis').then(m => m.HRInterviewAnalysis),
        canActivate: [roleGuard],
        data: { roles: ['hr', 'owner-admin'], permission: 'isAiEnabled' }
      },



      // ── Employee ──────────────────────────────────────────────────────────
      {
        path: 'employee/tasks',
        loadComponent: () => import('./pages/employee/my-tasks/my-tasks').then(m => m.MyTasks),
        canActivate: [roleGuard],
        data: { roles: ['employee', 'employee-manager', 'owner-admin', 'hr'], permission: 'isTasksEnabled' }
      },
      {
        path: 'employee/tasks/:id',
        loadComponent: () => import('./pages/employee/task-detail/task-detail').then(m => m.TaskDetail),
        canActivate: [roleGuard],
        data: { roles: ['employee', 'employee-manager', 'owner-admin', 'hr'], permission: 'isTasksEnabled' }
      },
      {
        path: 'employee/attendance',
        loadComponent: () => import('./pages/employee/attendance/attendance').then(m => m.EmployeeAttendance),
        canActivate: [roleGuard],
        data: { roles: ['employee', 'employee-manager', 'owner-admin', 'hr'] }
      },
      {
        path: 'employee/leaves',
        loadComponent: () => import('./pages/employee/leave-request/leave-request').then(m => m.EmployeeLeaveRequest),
        canActivate: [roleGuard],
        data: { roles: ['employee', 'employee-manager', 'owner-admin', 'hr'] }
      },
      {
        path: 'employee/profile',
        loadComponent: () => import('./pages/employee/profile/profile').then(m => m.Profile),
        canActivate: [roleGuard],
        data: { roles: ['employee', 'employee-manager', 'owner-admin', 'hr'] }
      },

      // ── Sales Representative ──────────────────────────────────────────────
      {
        path: 'sales-rep/dashboard',
        loadComponent: () => import('./pages/sales-rep/sales-dashboard/sales-dashboard').then(m => m.SalesDashboard),
        canActivate: [roleGuard],
        data: { roles: ['sales-rep', 'sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-rep/customers',
        loadComponent: () => import('./pages/sales-rep/sales-customers/sales-customers').then(m => m.SalesCustomers),
        canActivate: [roleGuard],
        data: { roles: ['sales-rep', 'sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-rep/deals',
        loadComponent: () => import('./pages/sales-rep/sales-deals/sales-deals').then(m => m.SalesDeals),
        canActivate: [roleGuard],
        data: { roles: ['sales-rep', 'sales-manager', 'owner-admin'], permission: 'isCrmEnabled' }
      },
      {
        path: 'sales-rep/tasks',
        loadComponent: () => import('./pages/sales-rep/sales-tasks/sales-tasks').then(m => m.SalesTasks),
        canActivate: [roleGuard],
        data: { roles: ['sales-rep', 'sales-manager', 'owner-admin'], permission: 'isTasksEnabled' }
      },
      {
        path: 'sales-rep/ai-assistant',
        loadComponent: () => import('./pages/sales-rep/ai-assistant/ai-assistant').then(m => m.SalesRepAiAssistant),
        canActivate: [roleGuard],
        data: { roles: ['sales-rep', 'sales-manager', 'owner-admin'], permission: 'isAiEnabled' }
      }
    ]
  },

  // ── 404 Wildcard ──────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./pages/shared/not-found/not-found').then(m => m.NotFound)
  }
];
