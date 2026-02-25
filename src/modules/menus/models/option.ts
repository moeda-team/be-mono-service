export interface Option {
  menuId: string;
  data: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertOptionDTO {
  menuId: string;
  data?: Array<any>;
}
