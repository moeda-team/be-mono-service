export interface Category {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDTO {
  name: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}
