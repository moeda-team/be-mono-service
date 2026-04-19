export interface Outlet {
  id: string;
  img: string | null;
  color: string | null;
  name: string;
  outletType: string;
  address: string;
  number: string;
  province: string;
  city: string;
  postalCode: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOutletDTO {
  name: string;
  img?: string;
  color?: string;
  outletType: string;
  address: string;
  number: string;
  province: string;
  city: string;
  postalCode: string;
  status: string;
}

export interface UpdateOutletDTO extends Partial<CreateOutletDTO> {}
