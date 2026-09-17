import type { StudentApi } from "../../../api/StudentApi";
import { createEmptyProfile } from "../../profile/types";
import {
  ProfilePersistenceCoordinator,
  ProfilePersistenceError,
} from "../profilePersistenceCoordinator";

function createDraft() {
  return {
    ...createEmptyProfile(),
    name: "Jane Doe",
    occupation: "student",
    department: "department-software",
    certificates: [
      {
        name: "Certificate",
        issuer: "KU",
        issuedAt: "2024-01-01",
        imageUri: "file:///certificate.jpg",
      },
    ],
  };
}

describe("ProfilePersistenceCoordinator", () => {
  it("persists Academic Registration fields when editing a Student Profile", async () => {
    const api = {
      updateAcademicRegistration: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      uploadAvatar: jest.fn().mockResolvedValue("avatar-id"),
      createCertificate: jest.fn(),
      updateCertificate: jest.fn(),
      uploadCertificateImage: jest.fn(),
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      createExperience: jest.fn(),
      updateExperience: jest.fn(),
      deleteCertificate: jest.fn(),
      deleteExperience: jest.fn(),
    } as unknown as StudentApi;

    await new ProfilePersistenceCoordinator().save(
      api,
      {
        ...createDraft(),
        studentId: "6712345678",
      },
      true,
      "2026-08-11"
    );

    expect(api.updateAcademicRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        occupationId: "student",
        studentId: "6712345678",
        departmentId: "department-software",
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("academic-registration"),
      })
    );
  });

  it("returns the partial draft and does not recreate a certificate on retry", async () => {
    const uploadCertificateImage = jest
      .fn()
      .mockRejectedValueOnce(new Error("temporary upload failure"))
      .mockResolvedValue(undefined);
    const api = {
      updateAcademicRegistration: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      uploadAvatar: jest.fn().mockResolvedValue("avatar-id"),
      createCertificate: jest.fn().mockResolvedValue("certificate-id"),
      updateCertificate: jest.fn().mockResolvedValue(undefined),
      uploadCertificateImage,
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      createExperience: jest.fn(),
      updateExperience: jest.fn(),
      deleteCertificate: jest.fn(),
      deleteExperience: jest.fn(),
    } as unknown as StudentApi;
    const coordinator = new ProfilePersistenceCoordinator();

    let partialError: ProfilePersistenceError | undefined;
    try {
      await coordinator.save(api, createDraft(), false, "2026-08-11");
    } catch (error) {
      partialError = error as ProfilePersistenceError;
    }

    expect(partialError).toBeInstanceOf(ProfilePersistenceError);
    expect(partialError?.partial).toBe(true);
    expect(partialError?.failedStep).toBe("certificate:0:image");
    expect(partialError?.draft.certificates[0].id).toBe("certificate-id");

    await coordinator.save(api, partialError!.draft, false, "2026-08-11");

    expect(api.updateCertificate).toHaveBeenCalledWith(
      "certificate-id",
      expect.anything(),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("certificate-0-update"),
      })
    );
    expect(uploadCertificateImage.mock.calls[0][2]).toEqual(
      uploadCertificateImage.mock.calls[1][2]
    );
  });

  it("skips unavailable optional collection mutations", async () => {
    const api = {
      updateAcademicRegistration: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      uploadAvatar: jest.fn().mockResolvedValue(null),
      createCertificate: jest.fn(),
      updateCertificate: jest.fn(),
      uploadCertificateImage: jest.fn(),
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      createExperience: jest.fn(),
      updateExperience: jest.fn(),
      deleteCertificate: jest.fn(),
      deleteExperience: jest.fn(),
    } as unknown as StudentApi;

    await new ProfilePersistenceCoordinator().save(
      api,
      createDraft(),
      true,
      "2026-08-11",
      {
        unavailableCollections: {
          certificates: true,
          portfolio: true,
          experience: true,
        },
      }
    );

    expect(api.createCertificate).not.toHaveBeenCalled();
    expect(api.updateCertificate).not.toHaveBeenCalled();
    expect(api.uploadCertificateImage).not.toHaveBeenCalled();
    expect(api.createPortfolio).not.toHaveBeenCalled();
    expect(api.updatePortfolio).not.toHaveBeenCalled();
    expect(api.createExperience).not.toHaveBeenCalled();
    expect(api.updateExperience).not.toHaveBeenCalled();
    expect(api.deleteCertificate).not.toHaveBeenCalled();
    expect(api.deletePortfolio).not.toHaveBeenCalled();
    expect(api.deleteExperience).not.toHaveBeenCalled();
    expect(api.updateAcademicRegistration).toHaveBeenCalled();
    expect(api.updateProfile).toHaveBeenCalled();
  });
});
