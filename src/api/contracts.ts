import { z } from 'zod';

const authTimestampSchema = z.union([z.string(), z.date()]).transform((value) =>
  value instanceof Date ? value.toISOString() : value
);

export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().url().nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: authTimestampSchema,
  updatedAt: authTimestampSchema,
});

const successSchema = z.object({ success: z.literal(true) });

export const academicRegistrationOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    occupations: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      requiresStudentId: z.boolean(),
    })),
    faculties: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      departments: z.array(z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      })),
    })),
  }),
});

export const academicRegistrationStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    firstName: z.string(),
    lastName: z.string(),
    telephone: z.string().nullable(),
    occupationId: z.string().nullable(),
    studentId: z.string().nullable(),
    departmentId: z.string().nullable(),
    termsAcceptedAt: z.string().nullable(),
    termsVersion: z.string().nullable(),
    completed: z.boolean(),
  }),
});

export const profileResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    bio: z.string().nullable(),
    telephone: z.string().nullable(),
    studentId: z.string().nullable(),
    academicYear: z.union([z.string(), z.number()]).nullable(),
    department: z.object({
      id: z.string(),
      name: z.string(),
      faculty: z.object({ name: z.string() }),
    }).nullable(),
    avatar: z.object({
      fileId: z.string(),
      url: z.string().url(),
    }).nullable(),
  }),
});

export const portfolioResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    images: z.array(z.object({
      fileId: z.string(),
      position: z.union([z.string(), z.number()]),
      url: z.string().url(),
    })),
    createdAt: z.string(),
  })),
});

export const certificateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    certificates: z.array(z.object({
      id: z.string(),
      name: z.string(),
      issuer: z.string(),
      issuedAt: z.string(),
      image: z.object({ fileId: z.string(), url: z.string().url() }).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })),
  }),
});

export const certificateCreateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ certificate: z.object({ id: z.string() }).passthrough() }),
});

export const portfolioCreateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ id: z.string() }),
});

export const successResponseSchema = successSchema;

export type AuthUser = z.infer<typeof authUserSchema>;
export type AcademicRegistrationOptions = z.infer<typeof academicRegistrationOptionsResponseSchema>['data'];
export type AcademicRegistrationStatus = z.infer<typeof academicRegistrationStatusResponseSchema>['data'];
export type ProfileResponse = z.infer<typeof profileResponseSchema>['data'];
export type PortfolioEntry = z.infer<typeof portfolioResponseSchema>['data'][number];
export type CertificateEntry = z.infer<typeof certificateResponseSchema>['data']['certificates'][number];
