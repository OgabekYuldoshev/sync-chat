import { ChatWorkspace, MOCK_CHATS, MOCK_MESSAGES } from "@/features/chat";

export default function ChatsPage() {
	return <ChatWorkspace chats={MOCK_CHATS} messages={MOCK_MESSAGES} />;
}
