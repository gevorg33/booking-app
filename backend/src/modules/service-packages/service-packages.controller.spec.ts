import { ServicePackagesController } from './service-packages.controller.js';
import { ServicePackagesService } from './service-packages.service.js';
import { BusinessService } from '../business/business.service.js';

describe('ServicePackagesController', () => {
  const packagesService = {
    listPackages: jest.fn(),
    getPackage: jest.fn(),
    createPackage: jest.fn(),
    updatePackage: jest.fn(),
    deactivatePackage: jest.fn(),
    activatePackage: jest.fn(),
    deletePackage: jest.fn(),
    duplicatePackage: jest.fn(),
    previewPackagePricing: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };

  const controller = new ServicePackagesController(
    packagesService as unknown as ServicePackagesService,
    businessService as unknown as BusinessService,
  );

  const user = { id: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
  });

  it('lists packages with default filter', async () => {
    packagesService.listPackages.mockResolvedValue([]);
    await controller.listPackages('biz-1', undefined, undefined, user);
    expect(packagesService.listPackages).toHaveBeenCalledWith('biz-1', 'all', false);
  });

  it('lists packages with filter and includeInactive', async () => {
    packagesService.listPackages.mockResolvedValue([{ id: 'pkg-1' }]);
    const result = await controller.listPackages('biz-1', 'active', 'true', user);
    expect(packagesService.listPackages).toHaveBeenCalledWith('biz-1', 'active', true);
    expect(result).toHaveLength(1);
  });

  it('gets package after membership check', async () => {
    packagesService.getPackage.mockResolvedValue({ id: 'pkg-1' });
    const result = await controller.getPackage('biz-1', 'pkg-1', user);
    expect(packagesService.getPackage).toHaveBeenCalledWith('biz-1', 'pkg-1');
    expect(result.id).toBe('pkg-1');
  });

  it('creates package after membership check', async () => {
    const dto = { name: 'Spa day', items: [{ serviceId: 'svc-1', quantity: 1 }] };
    packagesService.createPackage.mockResolvedValue({ id: 'pkg-1', ...dto });
    const result = await controller.createPackage('biz-1', dto, user);
    expect(packagesService.createPackage).toHaveBeenCalledWith('biz-1', dto);
    expect(result.id).toBe('pkg-1');
  });

  it('updates package after membership check', async () => {
    const dto = { name: 'Updated' };
    packagesService.updatePackage.mockResolvedValue({ id: 'pkg-1', name: 'Updated' });
    const result = await controller.updatePackage('biz-1', 'pkg-1', dto, user);
    expect(packagesService.updatePackage).toHaveBeenCalledWith('biz-1', 'pkg-1', dto);
    expect(result.name).toBe('Updated');
  });

  it('deactivates package after membership check', async () => {
    packagesService.deactivatePackage.mockResolvedValue({ id: 'pkg-1', isActive: false });
    const result = await controller.deactivatePackage('biz-1', 'pkg-1', user);
    expect(packagesService.deactivatePackage).toHaveBeenCalledWith('biz-1', 'pkg-1');
    expect(result.isActive).toBe(false);
  });

  it('activates package after membership check', async () => {
    packagesService.activatePackage.mockResolvedValue({ id: 'pkg-1', isActive: true });
    const result = await controller.activatePackage('biz-1', 'pkg-1', user);
    expect(packagesService.activatePackage).toHaveBeenCalledWith('biz-1', 'pkg-1');
    expect(result.isActive).toBe(true);
  });

  it('deletes package after membership check', async () => {
    packagesService.deletePackage.mockResolvedValue({ deleted: true, id: 'pkg-1' });
    const result = await controller.deletePackage('biz-1', 'pkg-1', user);
    expect(packagesService.deletePackage).toHaveBeenCalledWith('biz-1', 'pkg-1');
    expect(result.deleted).toBe(true);
  });

  it('duplicates package after membership check', async () => {
    packagesService.duplicatePackage.mockResolvedValue({ id: 'pkg-2', name: 'Spa day (Copy)' });
    const result = await controller.duplicatePackage('biz-1', 'pkg-1', user);
    expect(packagesService.duplicatePackage).toHaveBeenCalledWith('biz-1', 'pkg-1');
    expect(result.name).toContain('Copy');
  });

  it('previews package after membership check', async () => {
    packagesService.previewPackagePricing.mockResolvedValue({ pricing: { packagePrice: 119 } });
    const result = await controller.previewPackage('biz-1', 'pkg-1', user);
    expect(packagesService.previewPackagePricing).toHaveBeenCalledWith('biz-1', 'pkg-1');
    expect(result.pricing.packagePrice).toBe(119);
  });

  it('creates package with partial body fields', async () => {
    const dto = { name: 'Spa day', items: [{ serviceId: 'svc-1', quantity: 1 }] };
    packagesService.createPackage.mockResolvedValue({ id: 'pkg-1', ...dto });
    await controller.createPackage('biz-1', dto, user);
    expect(packagesService.createPackage).toHaveBeenCalledWith('biz-1', dto);
  });

  it('updates package with partial body fields', async () => {
    const dto = { displayOrder: 3 };
    packagesService.updatePackage.mockResolvedValue({ id: 'pkg-1', displayOrder: 3 });
    await controller.updatePackage('biz-1', 'pkg-1', dto, user);
    expect(packagesService.updatePackage).toHaveBeenCalledWith('biz-1', 'pkg-1', dto);
  });
});
