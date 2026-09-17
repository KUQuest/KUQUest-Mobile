import { ApiClient } from "../ApiClient";
import { DisputeApi } from "../DisputeApi";

describe("DisputeApi", () => {
  let fetchMock: jest.Mock;
  let api: DisputeApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    const client = new ApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => "better-auth.session_token=test-token",
    });
    api = new DisputeApi(client);
  });

  describe("fileDispute", () => {
    it("successfully files a dispute and parses the returned case", async () => {
      const mockResponse = {
        success: true,
        data: {
          dispute: {
            id: "disp_01HXYZ123",
            questId: "quest-101",
            filerId: "student-1",
            filerRole: "WORKER",
            status: "DISPUTE_PENDING_ADMIN_REVIEW",
            reason: "PROOF_REJECTED_UNFAIRLY",
            statement: "The task was completed following all requirements.",
            heldSatang: 15000,
            filingDeadline: "2026-09-18T10:00:00Z",
            holdExpiresAt: "2026-09-24T10:00:00Z",
            createdAt: "2026-09-17T15:30:00Z",
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await api.fileDispute(
        "quest-101",
        {
          reason: "PROOF_REJECTED_UNFAIRLY",
          statement: "The task was completed following all requirements.",
          evidenceFileIds: ["file-1", "file-2"],
        },
        "idemp-12345"
      );

      expect(result.id).toBe("disp_01HXYZ123");
      expect(result.questId).toBe("quest-101");
      expect(result.filerRole).toBe("WORKER");
      expect(result.reason).toBe("PROOF_REJECTED_UNFAIRLY");
      expect(result.heldSatang).toBe(15000);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.test/api/v1/quests/quest-101/disputes",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "idempotency-key": "idemp-12345",
          }),
          body: JSON.stringify({
            reason: "PROOF_REJECTED_UNFAIRLY",
            statement: "The task was completed following all requirements.",
            evidenceFileIds: ["file-1", "file-2"],
          }),
        })
      );
    });

    it("files without idempotency key and without evidence files", async () => {
      const mockResponse = {
        success: true,
        data: {
          dispute: {
            id: "disp_01HXYZ124",
            questId: "quest-102",
            filerId: "hirer-1",
            filerRole: "HIRER",
            status: "DISPUTE_PENDING_ADMIN_REVIEW",
            reason: "CONDITIONS_BREACHED",
            statement: "Conditions breached by worker.",
            createdAt: "2026-09-17T16:00:00Z",
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await api.fileDispute("quest-102", {
        reason: "CONDITIONS_BREACHED",
        statement: "Conditions breached by worker.",
      });

      expect(result.id).toBe("disp_01HXYZ124");
      expect(result.filerRole).toBe("HIRER");
      expect(result.reason).toBe("CONDITIONS_BREACHED");
    });

    it("throws a ZodError when response does not match disputeCaseResponseSchema", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify({ success: true, data: {} }),
      });

      await expect(
        api.fileDispute("quest-101", {
          reason: "OTHER",
          statement: "Invalid response test",
        })
      ).rejects.toThrow();
    });
  });

  describe("getDispute", () => {
    it("returns DisputeCase when a dispute exists", async () => {
      const mockResponse = {
        success: true,
        data: {
          dispute: {
            id: "disp_01HXYZ123",
            questId: "quest-101",
            filerId: "student-1",
            filerRole: "WORKER",
            status: "DISPUTE_PENDING_ADMIN_REVIEW",
            reason: "COMMUNICATION_BREAKDOWN",
            statement: "Cannot contact hirer.",
            createdAt: "2026-09-17T15:30:00Z",
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await api.getDispute("quest-101");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("disp_01HXYZ123");
      expect(result?.reason).toBe("COMMUNICATION_BREAKDOWN");
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.test/api/v1/quests/quest-101/disputes",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("returns null when no dispute exists", async () => {
      const mockResponse = {
        success: true,
        data: {
          dispute: null,
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await api.getDispute("quest-101");

      expect(result).toBeNull();
    });

    it("throws on invalid getDispute response shape", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify({ success: false }),
      });

      await expect(api.getDispute("quest-101")).rejects.toThrow();
    });
  });
});
