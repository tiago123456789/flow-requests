export type SenderTypes = "user" | "assistant";

interface Message {
  id: string;
  content: string;
  sender: SenderTypes;
  timestamp: Date;
  audioUrl?: string;
  isTranscribing?: boolean;
}

export default Message;
