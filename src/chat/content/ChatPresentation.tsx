import { createContext, useContext, type ReactNode } from "react";

const ChatPresentationContext = createContext<{
  wrapText: boolean;
  density: "comfortable" | "compact";
}>({ wrapText: false, density: "comfortable" });

export type ChatPresentationProviderProps = {
  wrapText: boolean;
  density?: "comfortable" | "compact";
  children: ReactNode;
};

export function ChatPresentationProvider({
  wrapText,
  density = "comfortable",
  children,
}: ChatPresentationProviderProps) {
  return (
    <ChatPresentationContext value={{ wrapText, density }}>
      {children}
    </ChatPresentationContext>
  );
}

export function useChatPresentation() {
  return useContext(ChatPresentationContext);
}
