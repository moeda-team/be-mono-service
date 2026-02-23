export interface Table {
  id: string;
  outletId: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableDTO {
  outletId: string;
  name: string;
  status?: string;
}

export interface UpdateTableDTO extends Partial<CreateTableDTO> {}
