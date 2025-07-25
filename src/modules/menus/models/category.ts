export interface Category {
  id: string;
  name: string;
  icon: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDTO {
  name: string;
  icon: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}
