import { axiosGet, axiosPost } from '@/utils/common/axios.custom';
import axios from 'axios';
import { Request, Response } from 'express';

describe('axios custom helpers', () => {
  const mockReq = (authHeader?: string) =>
    ({ headers: { authorization: authHeader } }) as unknown as Request;
  const mockRes = {} as Response;

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('axiosGet', () => {
    it('returns data on success and passes auth header', async () => {
      const data = { foo: 'bar' };
      jest.spyOn(axios, 'get').mockResolvedValueOnce({ data });

      const result = await axiosGet(mockReq('Bearer TOKEN'), mockRes, 'http://api');
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith('http://api', {
        headers: { Authorization: 'Bearer TOKEN' },
      });
    });

    it('returns status & data on error', async () => {
      const error = {
        response: { status: 404, data: 'Not Found' },
      } as unknown as Error;
      jest.spyOn(axios, 'get').mockRejectedValueOnce(error);

      const result = await axiosGet(mockReq(), mockRes, 'http://api');
      expect(result).toEqual({ status: 404, data: 'Not Found' });
    });
  });

  describe('axiosPost', () => {
    it('returns data on success and passes auth header', async () => {
      const data = { id: 1 };
      jest.spyOn(axios, 'post').mockResolvedValueOnce({ data });

      const payload = { name: 'test' };
      const result = await axiosPost(mockReq('Bearer TOKEN'), mockRes, 'http://api', payload);
      expect(result).toEqual(data);
      expect(axios.post).toHaveBeenCalledWith('http://api', payload, {
        headers: { Authorization: 'Bearer TOKEN' },
      });
    });

    it('returns status & data on error', async () => {
      const error = {
        response: { status: 500, data: 'Server Err' },
      } as unknown as Error;
      jest.spyOn(axios, 'post').mockRejectedValueOnce(error);

      const result = await axiosPost(mockReq(), mockRes, 'http://api', {});
      expect(result).toEqual({ status: 500, data: 'Server Err' });
    });
  });
});
