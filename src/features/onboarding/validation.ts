import { z } from "zod";

import {
  certificateSchema,
  experienceSchema,
  workSchema,
  type ProfileDraft,
} from "../profile/types";

export interface OnboardingValidationMessages {
  requiredField: string;
  invalidName: string;
  invalidTelephone: string;
  invalidStudentId: string;
  invalidDate: string;
}

export type ValidationErrors = Record<string, string>;

const telephonePattern = /^0[0-9]{9}$/;

function pathToErrorKey(path: (string | number)[]): string | null {
  if (path.length === 1 && typeof path[0] === "string") return path[0];

  if (
    path.length === 3 &&
    typeof path[1] === "number" &&
    typeof path[2] === "string"
  ) {
    if (path[0] === "certificates") return `cert_${path[1]}_${path[2]}`;
    if (path[0] === "works") return `work_${path[1]}_${path[2]}`;
    if (path[0] === "experiences") return `experience_${path[1]}_${path[2]}`;
  }

  return null;
}

function errorsFromZod(error: z.ZodError): ValidationErrors {
  return error.issues.reduce<ValidationErrors>((errors, issue) => {
    const key = pathToErrorKey(issue.path);
    if (key && !errors[key]) errors[key] = issue.message;
    return errors;
  }, {});
}

function createProfileBasicsSchema(
  isEditMode: boolean,
  messages: OnboardingValidationMessages,
  requiresStudentId: boolean
) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, messages.requiredField)
        .refine(
          (value) => value.split(/\s+/).length >= 2,
          messages.invalidName
        ),
      telephone: z
        .string()
        .trim()
        .min(1, messages.requiredField)
        .refine(
          (value) => telephonePattern.test(value),
          messages.invalidTelephone
        ),
      occupation: z.string().trim().min(1, messages.requiredField),
      studentId: z.string(),
      faculty: z.string().trim().min(1, messages.requiredField),
      department: z.string().trim().min(1, messages.requiredField),
      acceptedTerms: z.boolean(),
    })
    .superRefine((form, context) => {
      if (!isEditMode && !form.acceptedTerms) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["acceptedTerms"],
          message: messages.requiredField,
        });
      }

      if (requiresStudentId && !/^\d{10}$/.test(form.studentId.trim())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["studentId"],
          message: messages.invalidStudentId,
        });
      }
    });
}

function createProfileDetailsSchema(messages: OnboardingValidationMessages) {
  return z
    .object({
      certificates: z.array(certificateSchema),
      works: z.array(workSchema),
      experiences: z.array(experienceSchema).default([]),
    })
    .superRefine((form, context) => {
      form.certificates.forEach((certificate, index) => {
        const hasContent = [
          certificate.name,
          certificate.issuer,
          certificate.issuedAt,
          certificate.imageUri,
        ].some((value) => value.trim());
        if (!hasContent) return;
        if (!certificate.name.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["certificates", index, "name"],
            message: messages.requiredField,
          });
        }
        if (!certificate.issuer.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["certificates", index, "issuer"],
            message: messages.requiredField,
          });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(certificate.issuedAt.trim())) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["certificates", index, "issuedAt"],
            message: messages.invalidDate,
          });
        }
      });

      form.works.forEach((work, index) => {
        const hasContent = [work.imageUri, work.title, work.detail].some(
          (value) => value.trim()
        );
        if (hasContent && !work.title.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["works", index, "title"],
            message: messages.requiredField,
          });
        }
      });

      (form.experiences ?? []).forEach((experience, index) => {
        const hasContent = [
          experience.title,
          experience.employmentType,
          experience.organization,
          experience.description,
          experience.startedAt,
          experience.endedAt,
        ].some((value) => value.trim());
        if (!hasContent) return;
        if (!experience.title.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["experiences", index, "title"],
            message: messages.requiredField,
          });
        }
        if (!experience.employmentType.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["experiences", index, "employmentType"],
            message: messages.requiredField,
          });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(experience.startedAt.trim())) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["experiences", index, "startedAt"],
            message: messages.invalidDate,
          });
        }
        if (
          experience.endedAt.trim() &&
          !/^\d{4}-\d{2}-\d{2}$/.test(experience.endedAt.trim())
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["experiences", index, "endedAt"],
            message: messages.invalidDate,
          });
        }
        if (
          experience.startedAt &&
          experience.endedAt &&
          experience.endedAt < experience.startedAt
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["experiences", index, "endedAt"],
            message: messages.invalidDate,
          });
        }
      });
    });
}

export function validateProfileBasics(
  form: ProfileDraft,
  isEditMode: boolean,
  messages: OnboardingValidationMessages,
  requiresStudentId: boolean
): ValidationErrors {
  const schema = createProfileBasicsSchema(
    isEditMode,
    messages,
    requiresStudentId
  );
  const result = schema.safeParse(form);
  return result.success ? {} : errorsFromZod(result.error);
}

export function validateProfileDetails(
  form: Pick<ProfileDraft, "certificates" | "works"> &
    Partial<Pick<ProfileDraft, "experiences">>,
  messages: OnboardingValidationMessages
): ValidationErrors {
  const result = createProfileDetailsSchema(messages).safeParse(form);
  return result.success ? {} : errorsFromZod(result.error);
}
