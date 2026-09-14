import { z } from 'zod';

const authTimestampSchema = z.union([z.string(), z.date()]).transform((value) =>
  value instanceof Date ? value.toISOString() : value
);
const integerLikeSchema = z.union([z.number().int(), z.string().regex(/^\d+$/)]).transform(Number);
const nonNegativeIntegerSchema = integerLikeSchema.refine((value) => value >= 0, 'Expected a non-negative integer');
const numericLikeSchema = z.union([z.number().finite(), z.string().regex(/^\d+(?:\.\d+)?$/)]).transform(Number);
const ratingAverageSchema = numericLikeSchema.refine((value) => value >= 0 && value <= 5, 'Expected a rating from 0 through 5');

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
    version: nonNegativeIntegerSchema,
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    bio: z.string().nullable(),
    telephone: z.string().nullable(),
    studentId: z.string().nullable(),
    academicYear: z.union([z.string(), z.number()]).nullable(),
    university: z.string().nullable().optional(),
    occupation: z.object({ id: z.string(), name: z.string() }).nullable(),
    tags: z.array(z.object({ id: z.string(), name: z.string(), questCount: nonNegativeIntegerSchema.optional() })),
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
export const avatarMutationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    fileId: z.string().nullable(),
    version: nonNegativeIntegerSchema,
    avatar: z.object({
      fileId: z.string(),
      url: z.string().url(),
    }).nullable(),
  }),
});

const experienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  employmentType: z.string(),
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
    totalQuests: nonNegativeIntegerSchema,
    rating: z.object({
      average: ratingAverageSchema.nullable(),
      count: nonNegativeIntegerSchema,
      distribution: z.object({
        '5': nonNegativeIntegerSchema,
        '4': nonNegativeIntegerSchema,
        '3': nonNegativeIntegerSchema,
        '2': nonNegativeIntegerSchema,
        '1': nonNegativeIntegerSchema,
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
  rating: integerLikeSchema.refine((value) => value >= 1 && value <= 5, 'Expected a rating from 1 through 5'),
  comment: z.string().nullable(),
  createdAt: z.string(),
  quest: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
});

export const reviewsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(reviewSchema),
    total: nonNegativeIntegerSchema,
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
