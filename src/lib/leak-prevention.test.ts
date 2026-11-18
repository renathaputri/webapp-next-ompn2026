import { describe, it, expect, vi } from "vitest";
import { getQuestionsForExam } from "./exam-questions";

// Mock prisma untuk memverifikasi isolasi field
vi.mock("./prisma", () => ({
  prisma: {
    question: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "q1",
          number: 1,
          text: "Berapa 1 + 1?",
          options: ["1", "2", "3", "4"],
        },
        {
          id: "q2",
          number: 2,
          text: "Ibu kota Indonesia?",
          options: ["Jakarta", "Nusantara", "Surabaya", "Bandung"],
        },
      ]),
    },
  },
}));

describe("Uji Kebocoran Kunci Jawaban (Bab 2 Poin 3 & Bab 8 PRD)", () => {
  it("getQuestionsForExam TIDAK BOLEH memuat correctIndex atau explanation", async () => {
    const questions = await getQuestionsForExam("mock-exam-id");

    expect(questions.length).toBe(2);

    for (const q of questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("number");
      expect(q).toHaveProperty("displayNumber");
      expect(q).toHaveProperty("text");
      expect(q).toHaveProperty("options");

      // Verifikasi tegas: tidak ada correctIndex atau explanation
      expect((q as unknown as Record<string, unknown>).correctIndex).toBeUndefined();
      expect((q as unknown as Record<string, unknown>).explanation).toBeUndefined();
    }
  });

  it("getQuestionsForExam harus mempertahankan opsi jawaban tanpa kunci", async () => {
    const questions = await getQuestionsForExam("mock-exam-id");
    const jsonString = JSON.stringify(questions);

    expect(jsonString).not.toContain("correctIndex");
    expect(jsonString).not.toContain("explanation");
  });
});
