interface DeletedMessage {
  id: string;
  guildID: string;
  channel: import("oceanic.js").AnyTextableGuildChannel | {
    id: string;
    guild: {
      id: string;
    }
  }
};