import axios from 'axios';
import { Request, Response } from 'express';

export const axiosGet = async (req: Request, res: Response, url: string) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}`,
      },
    });
    return response.data;
  } catch (error) {
    const err = error as Error & { response: { status: number; data: string } };
    return { status: err.response.status, data: err.response.data };
  }
};
