export interface Category {
  id: string;
  name: string;
}

export interface CreateCategoryDTO {
  name: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}
