export interface BestSellerMenu {
  id: string;
  menuId: string;
  order: number;
  menu: {
    id: string;
    name: string;
    desc: string;
    img: string;
    price: number;
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBestSellerMenuDTO {
  menuId: string;
  order?: number;
}

export interface UpdateBestSellerMenuDTO extends Partial<CreateBestSellerMenuDTO> {}
