export interface Message {
  id: string;
  message: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  outletId: string;
  message: string;
  rating: number;
}
