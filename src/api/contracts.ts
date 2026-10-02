import { z } from "zod";

const authTimestampSchema = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value.toISOString() : value));
const integerLikeSchema = z
  .union([z.number().int(), z.string().regex(/^\d+$/)])
  .transform(Number);
const nonNegativeIntegerSchema = integerLikeSchema.refine(
  (value) => value >= 0,
  "Expected a non-negative integer"
);
const numericLikeSchema = z
  .union([z.number().finite(), z.string().regex(/^\d+(?:\.\d+)?$/)])
  .transform(Number);
const ratingAverageSchema = numericLikeSchema.refine(
  (value) => value >= 0 && value <= 5,
  "Expected a rating from 0 through 5"
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

export const academicRegistrationOptionsDataSchema = z.object({
  occupations: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      requiresStudentId: z.boolean(),
    })
  ),
  faculties: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      departments: z.array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
        })
      ),
    })
  ),
});

export const academicRegistrationStatusDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  telephone: z.string().nullable(),
  occupationId: z.string().nullable(),
  studentId: z.string().nullable(),
  departmentId: z.string().nullable(),
  termsAcceptedAt: z.string().nullable(),
  termsVersion: z.string().nullable(),
  completed: z.boolean(),
});

export const profileDataSchema = z.object({
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
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      questCount: nonNegativeIntegerSchema.optional(),
    })
  ),
  department: z
    .object({
      id: z.string(),
      name: z.string(),
      faculty: z.object({ name: z.string() }),
    })
    .nullable(),
  avatar: z
    .object({
      fileId: z.string(),
      url: z.string().url(),
    })
    .nullable(),
});

export const avatarMutationDataSchema = z.object({
  fileId: z.string().nullable(),
  version: nonNegativeIntegerSchema,
  avatar: z
    .object({
      fileId: z.string(),
      url: z.string().url(),
    })
    .nullable(),
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
export const experienceEntrySchema = experienceSchema;

export const experienceDataSchema = z.array(experienceSchema);

export const experienceMutationDataSchema = z
  .object({ experience: experienceSchema })
  .optional();

export const reputationDataSchema = z.object({
  totalQuests: nonNegativeIntegerSchema,
  rating: z.object({
    average: ratingAverageSchema.nullable(),
    count: nonNegativeIntegerSchema,
    distribution: z.object({
      "5": nonNegativeIntegerSchema,
      "4": nonNegativeIntegerSchema,
      "3": nonNegativeIntegerSchema,
      "2": nonNegativeIntegerSchema,
      "1": nonNegativeIntegerSchema,
    }),
  }),
});

const reviewSchema = z.object({
  id: z.string(),
  reviewer: z.object({
    displayName: z.string(),
    avatar: z.object({ url: z.string().url() }).nullable().optional(),
  }),
  rating: integerLikeSchema.refine(
    (value) => value >= 1 && value <= 5,
    "Expected a rating from 1 through 5"
  ),
  comment: z.string().nullable(),
  createdAt: z.string(),
  quest: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
});
export const profileReviewSchema = z.object({
  id: z.string(),
  reviewer: z.object({
    displayName: z.string(),
    avatar: z.object({ url: z.string() }).nullable().optional(),
  }),
  rating: z.union([z.number(), z.string()]).transform(Number),
  comment: z.string().nullable().optional(),
  createdAt: z.string(),
  quest: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
});

export const reviewsDataSchema = z.object({
  items: z.array(reviewSchema),
  total: nonNegativeIntegerSchema,
  nextCursor: z.string().nullable().optional(),
});

export const portfolioDataSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    images: z.array(
      z.object({
        fileId: z.string(),
        position: z.union([z.string(), z.number()]),
        url: z.string().url(),
      })
    ),
    createdAt: z.string(),
  })
);

export const certificateDataSchema = z.object({
  certificates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      issuer: z.string(),
      issuedAt: z.string(),
      image: z.object({ fileId: z.string(), url: z.string().url() }).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});
export const portfolioEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        fileId: z.string().optional(),
        position: z.union([z.string(), z.number()]).optional(),
        url: z.string(),
      })
    )
    .default([]),
  createdAt: z.string().optional(),
});

export const certificateEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  issuedAt: z.string(),
  image: z
    .object({ fileId: z.string().optional(), url: z.string() })
    .nullable()
    .optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const publicProfileDataSchema = z.object({
  version: z.number().int().min(1).default(1),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().nullable().optional(),
  academicYear: z.union([z.number().int(), z.string()]).nullable().optional(),
  department: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      faculty: z.object({ name: z.string() }),
    })
    .nullable()
    .optional(),
  avatar: z
    .object({
      fileId: z.string().optional(),
      url: z.string(),
    })
    .nullable()
    .optional(),
  occupation: z
    .object({
      id: z.string().optional(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  reputation: z.object({
    totalQuests: nonNegativeIntegerSchema,
    rating: z.object({
      average: ratingAverageSchema.nullable(),
    }),
  }),
  experience: z.array(experienceEntrySchema).default([]),
  portfolio: z.array(portfolioEntrySchema).default([]),
  certificates: z.array(certificateEntrySchema).default([]),
});

export const publicProfileReviewsDataSchema = z.object({
  items: z.array(profileReviewSchema).default([]),
  total: z.union([z.number().int(), z.string()]).default(0),
  nextCursor: z.string().nullable().optional(),
});

export const certificateCreateDataSchema = z.object({
  certificate: z.object({ id: z.string() }).passthrough(),
});

export const portfolioCreateDataSchema = z.object({ id: z.string() });

export type AuthUser = z.infer<typeof authUserSchema>;
export type AcademicRegistrationOptions = z.infer<
  typeof academicRegistrationOptionsDataSchema
>;
export type AcademicRegistrationStatus = z.infer<
  typeof academicRegistrationStatusDataSchema
>;
export type ProfileResponse = z.infer<typeof profileDataSchema>;
export type ExperienceEntry = z.infer<typeof experienceSchema>;
export type Reputation = z.infer<typeof reputationDataSchema>;
export type ProfileReview = z.infer<typeof reviewSchema>;
export type PortfolioEntry = z.infer<typeof portfolioDataSchema>[number];
export type CertificateEntry = z.infer<
  typeof certificateDataSchema
>["certificates"][number];
export type PublicProfileResponse = z.infer<typeof publicProfileDataSchema>;
export type PublicProfileReviewsData = z.infer<
  typeof publicProfileReviewsDataSchema
>;
