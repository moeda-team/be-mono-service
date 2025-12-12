export interface Message {
  id: string;
  outletId: string;
  message: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  outletId: string;
  message: string;
  rating: string | number;
}
