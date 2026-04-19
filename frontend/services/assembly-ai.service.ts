"use client";

const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

interface TranscriptResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
}

interface UploadResponse {
  upload_url: string;
}

class AssemblyAIService {
  private getApiKey(): string {
    return localStorage.getItem("assemblyAiToken") || "";
  }

  private getAuthHeader(): string {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        "AssemblyAI token not configured. Please add your token in Settings.",
      );
    }
    return apiKey;
  }

  private async uploadAudio(audioBlob: Blob): Promise<string> {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
      },
      body: audioBlob,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data: UploadResponse = await response.json();
    return data.upload_url;
  }

  private async waitForTranscript(transcriptId: string): Promise<string> {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
        {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get transcript status: ${response.statusText}`,
        );
      }

      const data: TranscriptResponse = await response.json();

      if (data.status === "completed") {
        return data.text || "";
      }

      if (data.status === "error") {
        throw new Error(data.error || "Transcription failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;
    }

    throw new Error("Transcription timeout");
  }

  async transcribe(audioBase64: string): Promise<string> {
    const response = await fetch(audioBase64);
    const audioBlob = await response.blob();

    const uploadUrl = await this.uploadAudio(audioBlob);

    const transcriptResponse = await fetch(
      `${ASSEMBLYAI_BASE_URL}/transcript`,
      {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: uploadUrl,
          punctuate: true,
          format_text: true,
          language_detection: true,
        }),
      },
    );

    if (!transcriptResponse.ok) {
      throw new Error(
        `Transcript creation failed: ${transcriptResponse.statusText}`,
      );
    }

    const transcriptData: TranscriptResponse = await transcriptResponse.json();
    const text = await this.waitForTranscript(transcriptData.id);

    return text;
  }
}

export const assemblyAIService = new AssemblyAIService();
export default AssemblyAIService;
