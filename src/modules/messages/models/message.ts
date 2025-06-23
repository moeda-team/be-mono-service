export interface Message {
  id: string;
  name: string;
  message: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  outletId: string;
  name: string;
  message: string;
  rating: number;
}
