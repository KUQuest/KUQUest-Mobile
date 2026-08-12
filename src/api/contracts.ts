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
    university: z.string().nullable().optional(),
    occupation: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
    tags: z.array(z.object({ id: z.string(), name: z.string(), questCount: z.number().int().nonnegative().optional() })).optional(),
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

const experienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startedAt: z.string(),
  endedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const experienceResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(experienceSchema),
});

export const experienceMutationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ experience: experienceSchema }).optional(),
});

export const reputationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    totalQuests: z.number().int().nonnegative(),
    rating: z.object({
      average: z.number().min(0).max(5).nullable(),
      count: z.number().int().nonnegative(),
      distribution: z.object({
        '5': z.number().int().nonnegative(),
        '4': z.number().int().nonnegative(),
        '3': z.number().int().nonnegative(),
        '2': z.number().int().nonnegative(),
        '1': z.number().int().nonnegative(),
      }),
    }),
  }),
});

const reviewSchema = z.object({
  id: z.string(),
  reviewer: z.object({
    displayName: z.string(),
    avatar: z.object({ url: z.string().url() }).nullable().optional(),
  }),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
  quest: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
});

export const reviewsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(reviewSchema),
    total: z.number().int().nonnegative(),
    nextCursor: z.string().nullable().optional(),
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
export type ExperienceEntry = z.infer<typeof experienceSchema>;
export type Reputation = z.infer<typeof reputationResponseSchema>['data'];
export type ProfileReview = z.infer<typeof reviewSchema>;
export type PortfolioEntry = z.infer<typeof portfolioResponseSchema>['data'][number];
export type CertificateEntry = z.infer<typeof certificateResponseSchema>['data']['certificates'][number];
