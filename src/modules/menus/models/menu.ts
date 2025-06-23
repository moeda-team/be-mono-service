export interface Menu {
  id: string;
  name: string;
  desc: string;
  img: string;
  price: number;
  options: string[];
  pdf: string | null;
  categoryId: string;
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
}

export interface UpdateMenuDTO extends Partial<CreateMenuDTO> {}
