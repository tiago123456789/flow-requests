"use client";

import { useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderButtonProps {
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AudioRecorderButton({
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  disabled = false,
}: AudioRecorderButtonProps) {
  const handleClick = useCallback(async () => {
    if (isRecording) {
      await onStopRecording();
    } else {
      await onStartRecording();
    }
  }, [isRecording, onStartRecording, onStopRecording]);

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-600">
            {formatDuration(recordingDuration)}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            console.log("clicked here to stop");
            // onStopRecording();
          }}
          // className="h-10 w-10 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-10 w-10 p-0 hover:bg-slate-100 rounded-full"
      disabled={disabled}
    >
      <Mic className="h-5 w-5 text-slate-600" />
    </Button>
  );
}

export default AudioRecorderButton;
