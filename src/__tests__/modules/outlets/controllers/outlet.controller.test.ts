/* eslint-disable @typescript-eslint/no-explicit-any */
import { OutletController } from '../../../../modules/outlets/controllers/outlet.controller';
import { ResponseHandler } from '../../../../utils/response/responseHandler';
import prisma from '../../../../lib/prisma';
import { logger } from '../../../../utils/common/logger';

describe('OutletController', () => {
  let controller: OutletController;
  let mockRes: any;
  let mockReq: any;

  beforeEach(() => {
    controller = new OutletController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    mockReq = { params: {}, body: {} };
    jest.clearAllMocks();
  });

  describe('getAllOutlets', () => {
    it('should return all outlets successfully', async () => {
      const outlets = [{ id: '1' }];
      jest.spyOn(prisma.outlet, 'findMany').mockResolvedValue(outlets as any);
      const spy = jest.spyOn(ResponseHandler, 'success');
      await controller.getAllOutlets(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ data: outlets }));
    });
    it('should handle errors', async () => {
      jest.spyOn(prisma.outlet, 'findMany').mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(ResponseHandler, 'error');
      const loggerSpy = jest.spyOn(logger, 'error');
      await controller.getAllOutlets(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 500 }));
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('getOutletById', () => {
    it('should return outlet if found', async () => {
      mockReq.params.id = '1';
      const outlet = { id: '1' };
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue(outlet as any);
      const spy = jest.spyOn(ResponseHandler, 'success');
      await controller.getOutletById(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ data: outlet }));
    });
    it('should return 404 if not found', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue(null);
      const spy = jest.spyOn(ResponseHandler, 'error');
      await controller.getOutletById(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 404 }));
    });
    it('should handle errors', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(ResponseHandler, 'error');
      const loggerSpy = jest.spyOn(logger, 'error');
      await controller.getOutletById(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 500 }));
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('createOutlet', () => {
    it('should return 400 if outlet exists', async () => {
      mockReq.body = { name: 'A' };
      jest.spyOn(prisma.outlet, 'findFirst').mockResolvedValue({ id: '1' } as any);
      const spy = jest.spyOn(ResponseHandler, 'error');
      await controller.createOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 400 }));
    });
    it('should create outlet successfully', async () => {
      mockReq.body = { name: 'A' };
      jest.spyOn(prisma.outlet, 'findFirst').mockResolvedValue(null);
      const created = { id: '2' };
      jest.spyOn(prisma.outlet, 'create').mockResolvedValue(created as any);
      const spy = jest.spyOn(ResponseHandler, 'success');
      await controller.createOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ data: created }));
    });
    it('should handle errors', async () => {
      mockReq.body = { name: 'A' };
      jest.spyOn(prisma.outlet, 'findFirst').mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(ResponseHandler, 'error');
      const loggerSpy = jest.spyOn(logger, 'error');
      await controller.createOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 500 }));
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('updateOutlet', () => {
    it('should return 404 if outlet not found', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue(null);
      const spy = jest.spyOn(ResponseHandler, 'error');
      await controller.updateOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 404 }));
    });
    it('should return 400 if outlet name exists', async () => {
      mockReq.params.id = '1';
      mockReq.body = { name: 'A' };
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.outlet, 'findFirst').mockResolvedValue({ id: '2' } as any);
      const spy = jest.spyOn(ResponseHandler, 'error');
      await controller.updateOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 400 }));
    });
    it('should update outlet successfully', async () => {
      mockReq.params.id = '1';
      mockReq.body = { name: 'A' };
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.outlet, 'findFirst').mockResolvedValue(null);
      const updated = { id: '1', name: 'A' };
      jest.spyOn(prisma.outlet, 'update').mockResolvedValue(updated as any);
      const spy = jest.spyOn(ResponseHandler, 'success');
      await controller.updateOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ data: updated }));
    });
    it('should handle errors', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(ResponseHandler, 'error');
      const loggerSpy = jest.spyOn(logger, 'error');
      await controller.updateOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 500 }));
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('deleteOutlet', () => {
    it('should return 404 if outlet not found', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue(null);
      const spy = jest.spyOn(ResponseHandler, 'error');
      await controller.deleteOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 404 }));
    });
    it('should delete outlet successfully', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.outlet, 'delete').mockResolvedValue({} as any);
      const spy = jest.spyOn(ResponseHandler, 'success');
      await controller.deleteOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({ message: 'Outlet deleted successfully' }),
      );
    });
    it('should handle Prisma P2025 error as not found', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue({ id: '1' } as any);
      // Mock error as an Error instance with a code property
      const error = new Error('not found') as Error & { code: string };
      (error as any).code = 'P2025';
      jest.spyOn(prisma.outlet, 'delete').mockRejectedValue(error);
      const spy = jest.spyOn(ResponseHandler, 'error');
      await controller.deleteOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 404 }));
    });
    it('should handle generic errors', async () => {
      mockReq.params.id = '1';
      jest.spyOn(prisma.outlet, 'findUnique').mockResolvedValue({ id: '1' } as any);
      jest.spyOn(prisma.outlet, 'delete').mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(ResponseHandler, 'error');
      const loggerSpy = jest.spyOn(logger, 'error');
      await controller.deleteOutlet(mockReq, mockRes);
      expect(spy).toHaveBeenCalledWith(mockRes, expect.objectContaining({ statusCode: 500 }));
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
