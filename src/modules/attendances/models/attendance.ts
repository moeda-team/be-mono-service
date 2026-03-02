export interface Attendance {
  id: string;
  userId: string;
  outletId: string;
  fileName: string;
  fileUrl: string;
  status: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceDTO {
  userId?: string;
  status?: string;
  note?: string;
  fileUrl: string;
}
