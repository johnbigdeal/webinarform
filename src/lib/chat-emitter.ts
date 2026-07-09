import { EventEmitter } from "events";

declare global {
  var chatEmitter: EventEmitter | undefined;
}

export const chatEmitter = globalThis.chatEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.chatEmitter = chatEmitter;
}
