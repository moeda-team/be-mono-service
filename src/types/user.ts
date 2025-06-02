export interface User {
  id: string;
  name: string;
  position: string;
  email: string;
  password: string;
  address: string;
  gender: string;
  phoneNumber: string;
  fee: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  outletId: string;
  name: string;
  position: string;
  email: string;
  password: string;
  address: string;
  gender: string;
  phoneNumber: string;
  fee: number;
  status: string;
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {}
