import {
  handleCreateExternalDoctorLogic,
  handleListExternalDoctorsLogic,
  handleUpdateExternalDoctorLogic,
  type ExternalDoctorsLogicDeps,
} from './ai-external-doctors.logic.js';

describe('ai-external-doctors.logic', () => {
  const doctor = {
    id: 'doc-1',
    businessId: 'biz-1',
    name: 'Dr. Smith',
    clinicName: 'Smith Clinic',
    specialty: 'Dermatology',
    address: '123 Main St, Springfield, IL, US, 62704',
    street: '123 Main St',
    unit: null,
    city: 'Springfield',
    province: 'IL',
    country: 'US',
    postalCode: '62704',
    fax: null,
    phone: null,
    email: null,
  };

  function buildDeps(
    overrides: Partial<ExternalDoctorsLogicDeps['externalDoctorsService']> = {},
  ): ExternalDoctorsLogicDeps {
    return {
      externalDoctorsService: {
        listExternalDoctors: jest.fn(async () => ({
          items: [doctor],
          totalItems: 1,
          page: 1,
          pageSize: 20,
        })),
        createExternalDoctor: jest.fn(async () => doctor),
        updateExternalDoctor: jest.fn(async () => ({
          ...doctor,
          name: 'Dr. Smith Jr.',
        })),
        ...overrides,
      } as any,
    };
  }

  describe('handleCreateExternalDoctorLogic', () => {
    it('creates an external doctor', async () => {
      const deps = buildDeps();
      const result = await handleCreateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          name: 'Dr. Smith',
          street: '123 Main St',
          city: 'Springfield',
          province: 'IL',
          country: 'US',
          postalCode: '62704',
        },
      );
      expect(result.success).toBe(true);
      expect(
        deps.externalDoctorsService.createExternalDoctor,
      ).toHaveBeenCalled();
    });

    it('requires sign in', async () => {
      const deps = buildDeps();
      const result = await handleCreateExternalDoctorLogic(
        deps,
        'biz-1',
        undefined,
        {
          name: 'Dr. Smith',
        },
      );
      expect(result.success).toBe(false);
    });

    it('clarifies when address fields are missing', async () => {
      const deps = buildDeps();
      const result = await handleCreateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          name: 'Dr. Smith',
        },
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
      expect(result.details?.missing).toContain('street');
    });

    it('handles service errors', async () => {
      const deps = buildDeps({
        createExternalDoctor: jest.fn(async () => {
          throw new Error('forbidden');
        }),
      });
      const result = await handleCreateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          name: 'Dr. Smith',
          street: '123 Main St',
          city: 'Springfield',
          province: 'IL',
          country: 'US',
          postalCode: '62704',
        },
      );
      expect(result.success).toBe(false);
      expect(result.summary).toBe('forbidden');
    });
  });

  describe('handleUpdateExternalDoctorLogic', () => {
    it('resolves by doctorId and updates', async () => {
      const deps = buildDeps();
      const result = await handleUpdateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          doctorId: 'doc-1',
          name: 'Dr. Smith Jr.',
        },
      );
      expect(result.success).toBe(true);
      expect(
        deps.externalDoctorsService.updateExternalDoctor,
      ).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
        'doc-1',
        expect.objectContaining({ name: 'Dr. Smith Jr.' }),
      );
    });

    it('resolves by doctorName via search', async () => {
      const deps = buildDeps();
      const result = await handleUpdateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          doctorName: 'Smith',
          isActive: false,
        },
      );
      expect(result.success).toBe(true);
      expect(
        deps.externalDoctorsService.listExternalDoctors,
      ).toHaveBeenCalled();
    });

    it('fails when no doctor matches the name', async () => {
      const deps = buildDeps({
        listExternalDoctors: jest.fn(async () => ({
          items: [],
          totalItems: 0,
          page: 1,
          pageSize: 20,
        })),
      });
      const result = await handleUpdateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          doctorName: 'Nobody',
          isActive: false,
        },
      );
      expect(result.success).toBe(false);
    });

    it('clarifies when neither doctorId nor doctorName is given', async () => {
      const deps = buildDeps();
      const result = await handleUpdateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          isActive: false,
        },
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('clarifies when no patch fields are given', async () => {
      const deps = buildDeps();
      const result = await handleUpdateExternalDoctorLogic(
        deps,
        'biz-1',
        'user-1',
        {
          doctorId: 'doc-1',
        },
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });
  });

  describe('handleListExternalDoctorsLogic', () => {
    it('lists external doctors', async () => {
      const deps = buildDeps();
      const result = await handleListExternalDoctorsLogic(
        deps,
        'biz-1',
        'user-1',
        {},
      );
      expect(result.success).toBe(true);
      expect((result.details as any).totalItems).toBe(1);
    });

    it('requires sign in', async () => {
      const deps = buildDeps();
      const result = await handleListExternalDoctorsLogic(
        deps,
        'biz-1',
        undefined,
        {},
      );
      expect(result.success).toBe(false);
    });
  });
});
