export interface Option {
  id: string;
  name: string;
  value: string[];
  addPrices: number[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateOptionDTO {
  name: string;
  value: string[];
  addPrices: number[];
}

export interface UpdateOptionDTO extends Partial<CreateOptionDTO> {}
