export interface Menu {
  id: string;
  name: string;
  desc: string;
  img: string;
  price: number;
  options: string[];
  pdf: string | null;
  categoryId: string;
  isActive: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMenuDTO {
  categoryId: string;
  name: string;
  desc: string;
  img: string;
  price: number;
  pdf: string | null;
  options: string[];
  isActive: boolean;
}

export interface UpdateMenuDTO extends Partial<CreateMenuDTO> {}
