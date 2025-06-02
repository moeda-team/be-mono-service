import axios from 'axios';
import { Request, Response } from 'express';

export const axiosGet = async (req: Request, _: Response, url: string) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}`,
      },
    });
    return response.data;
  } catch (error) {
    const err = error as Error & { response: { status: number; data: string } };
    return { status: err.response?.status, data: err.response?.data };
  }
};

export const axiosPost = async <T extends Record<string, unknown>>(
  req: Request,
  _: Response,
  url: string,
  data: T,
  config?: Parameters<typeof axios.post>[2],
) => {
  try {
    const response = await axios.post(
      url,
      data,
      config ?? {
        headers: {
          Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    const err = error as Error & { response: { status: number; data: string } };
    return { status: err.response?.status, data: err.response?.data };
  }
};
