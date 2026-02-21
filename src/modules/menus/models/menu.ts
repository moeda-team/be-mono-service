export interface Menu {
  id: string;
  outletId: string | null;
  name: string;
  desc: string;
  img: string;
  price: number;
  pdf: string | null;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuDTO {
  outletId?: string;
  categoryId: string;
  name: string;
  desc: string;
  img: string;
  price: number;
  pdf: string | null;
  isActive?: boolean;
}

export interface UpdateMenuDTO extends Partial<CreateMenuDTO> {}
