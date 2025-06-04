export interface Option {
  id: string;
  name: string;
  value: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateOptionDTO {
  name: string;
  value: string[];
}

export interface UpdateOptionDTO extends Partial<CreateOptionDTO> {}
