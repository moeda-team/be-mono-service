export interface Option {
  id: string;
  menuId: string | null;
  optionId: string | null;
  name: string;
  values: string[];
  extraPrices: number[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOptionDTO {
  menuId?: string;
  optionId?: string;
  name: string;
  values: string[];
  extraPrices: number[];
  order?: number;
}

export interface UpdateOptionDTO extends Partial<CreateOptionDTO> {}
