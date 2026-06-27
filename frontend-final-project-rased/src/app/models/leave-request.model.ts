export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeAvatar: string;
  roleId: number;
  roleName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedByUserId?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  createdBy: number;
}
