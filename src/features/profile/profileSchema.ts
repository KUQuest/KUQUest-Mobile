import { z } from 'zod';

export const certificateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  issuer: z.string(),
  issuedAt: z.string(),
  imageUri: z.string(),
});

export const workSchema = z.object({
  id: z.string().optional(),
  imageUri: z.string(),
  title: z.string(),
  detail: z.string(),
});

export const experienceSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  employmentType: z.string(),
  organization: z.string(),
  description: z.string(),
  startedAt: z.string(),
  endedAt: z.string(),
});

export const profileDraftSchema = z.object({
  name: z.string(),
  telephone: z.string(),
  occupation: z.string(),
  studentId: z.string(),
  faculty: z.string(),
  department: z.string(),
  acceptedTerms: z.boolean(),
  description: z.string(),
  profileImage: z.string(),
  certificates: z.array(certificateSchema),
  works: z.array(workSchema),
  experiences: z.array(experienceSchema),
});

export type Certificate = z.infer<typeof certificateSchema>;
export type Work = z.infer<typeof workSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ProfileDraft = z.infer<typeof profileDraftSchema>;
