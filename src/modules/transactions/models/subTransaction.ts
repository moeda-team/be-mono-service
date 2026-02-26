export interface SubTransaction {
  id: string;
  transactionId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
  subTotal: number;
  addOn: string;
  addOnPrice: number;
  discount: number;
  note: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubTransactionGroup {
  id: string;
  menuId: string;
  menuName: string;
  categoryId: string;
  categoryName: string;
  createdAt: Date;
}

export interface CreateSubTransactionDTO {
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
  subTotal: number;
  addOn: string;
  addOnPrice?: number;
  note: string;
  status: string;
}
