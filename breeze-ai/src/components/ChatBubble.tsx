import React from "react";
import type { ChatMessage } from "../types";
import "./ChatBubble.css";

interface Props {
  message: ChatMessage;
}

export const ChatBubble: React.FC<Props> = ({ message }) => {
  const isAgent = message.role === "agent";
  return (
    <div className={`bubble-row ${isAgent ? "agent-row" : "user-row"}`}>
      {isAgent && (
        <div className="avatar">
          <span>🗺️</span>
        </div>
      )}
      <div className={`bubble ${isAgent ? "agent-bubble" : "user-bubble"}`}>
        {message.text.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < message.text.split("\n").length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
