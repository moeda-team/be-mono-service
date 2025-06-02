export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDTO {
  outletId: string;
  name: string;
  email: string;
  message: string;
  rating: number;
}
