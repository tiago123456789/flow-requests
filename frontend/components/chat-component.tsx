"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Minus, Plus, MessageCircle, Mic } from "lucide-react";
import Message from "@/types/message";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { assemblyAIService } from "@/services/assembly-ai.service";
import { AudioRecorderButton } from "./audio-recorder-button";

interface ChatComponentProps {
  messages?: Message[];
  onSendMessage?: (message: string, audioUrl?: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  defaultMinimized?: boolean;
  title?: string;
  isFloating?: boolean;
  defaultPosition?: { x: number; y: number };
}

export function ChatComponent({
  messages = [],
  onSendMessage,
  placeholder = "Type your message here...",
  className,
  maxHeight = "800px",
  defaultMinimized = false,
  title = "Chat",
  isFloating = false,
  defaultPosition = { x: 20, y: 20 },
}: ChatComponentProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    recordingDuration,
    audioBase64,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!input.trim() || isLoading) && !audioBase64) return;

    if (audioBase64) {
      setIsTranscribing(true);
      try {
        await stopRecording();
        const transcription = await assemblyAIService.transcribe(audioBase64);
        resetRecording();
        setIsLoading(true);
        await onSendMessage?.(transcription, audioBase64);
      } catch (error) {
        console.error("Transcription error:", error);
        resetRecording();
      } finally {
        setIsTranscribing(false);
        setIsLoading(false);
      }
      return;
    }

    const messageContent = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await onSendMessage?.(messageContent);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioBase64) {
      (async () => {
        try {
          const transcription = await assemblyAIService.transcribe(audioBase64);
          resetRecording();
          setIsLoading(true);
          await onSendMessage?.(transcription, audioBase64);
        } catch (error) {
          console.error("Transcription error:", error);
          resetRecording();
        } finally {
          setIsTranscribing(false);
          setIsLoading(false);
        }
      })();
    }
  }, [audioBase64]);

  const handleAudioSend = async () => {
    setIsTranscribing(true);
    try {
      await stopRecording();
    } catch (error) {
      console.error("Transcription error:", error);
      resetRecording();
      setIsTranscribing(false);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFloating) {
      setIsDragging(true);
      const rect = chatRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && isFloating) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging && isFloating) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, isFloating]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const chatClasses = cn(
    "flex flex-col",
    className,
    isFloating && "fixed z-50 shadow-lg border-2",
  );

  return (
    <div
      ref={chatRef}
      style={
        isFloating
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: isDragging ? "grabbing" : "grab",
            }
          : {}
      }
      className={chatClasses}
    >
      <Card className="w-full h-full">
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between space-y-0 pb-2",
            isFloating && "cursor-grab active:cursor-grabbing select-none",
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-sm font-semibold">{title}</h2>
            {!isMinimized && (
              <span className="text-xs text-muted-foreground">
                ({messages.length} messages)
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimize}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col h-full p-4 pt-0">
          <ScrollArea className="flex-1 mb-4 pr-4" style={{ maxHeight }}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1 opacity-70",
                          message.sender === "user"
                            ? "text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <div className="flex-1 relative">
                {isRecording ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                    <Mic className="h-4 w-4 text-red-500 animate-pulse" />
                    <span className="text-sm text-slate-600 flex-1">
                      Recording... {Math.floor(recordingDuration / 60)}:
                      {(recordingDuration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                ) : (
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="resize-none pr-12 min-h-[40px] max-h-[120px]"
                    disabled={isLoading || isTranscribing}
                  />
                )}
              </div>
              {isTranscribing ? (
                <div className="self-end px-3 py-2 bg-slate-100 rounded-md">
                  <span className="text-sm text-slate-500">
                    Transcribing...
                  </span>
                </div>
              ) : isRecording ? (
                <Button
                  type="button"
                  onClick={handleAudioSend}
                  className="self-end bg-red-500 hover:bg-red-600"
                  size="sm"
                >
                  Send
                </Button>
              ) : (
                <AudioRecorderButton
                  isRecording={isRecording}
                  recordingDuration={recordingDuration}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  // disabled={isLoading}
                />
              )}
              <Button
                type="submit"
                disabled={(!input.trim() || isLoading) && !audioBase64}
                className="self-end"
                size="sm"
              >
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </form>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatComponent;
