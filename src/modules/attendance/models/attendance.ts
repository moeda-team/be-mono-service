export interface Attendance {
  id: string;
  outletId: string;
  userId: string;
  photoUrl: string;
  type: string;
  approvalStatus: string;
  approvedBy: string;
  approvedAt: Date;
  approvedNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceDTO {
  outletId: string;
  userId: string;
  photoUrl: string;
  type: string;
}

export interface ApproveAttendanceDTO {
  id: string;
  status: string;
  approvedNote: string;
}
