export interface Option {
  id: string;
  menuId: string;
  data: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOptionDTO {
  menuId: string;
  data?: Array<any>;
}

export interface UpdateOptionDTO extends Partial<CreateOptionDTO> {}
