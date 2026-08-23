import type { SupportedLocale } from './LocaleProvider';

export interface ChatMessages {
  title: string;
  subtitle: string;
  searchConversations: string;
  recentConversations: string;
  conversationCount: (count: number) => string;
  noConversations: string;
  noSearchResults: string;
  questOwner: string;
  questMember: string;
  questTeam: string;
  viewQuest: string;
  search: string;
  searchMessages: string;
  searchFiles: string;
  messages: string;
  files: string;
  closeSearch: string;
  searchInConversation: string;
  searchResultCount: (count: number, type: 'messages' | 'files') => string;
  noMessageResults: string;
  noFileResults: string;
  today: string;
  typeMessage: string;
  send: string;
  addAttachment: string;
  takePhoto: string;
  choosePhoto: string;
  chooseFile: string;
  cancel: string;
  mockAttachmentDescription: string;
  conversationNotFound: string;
  backToChat: string;
  openFile: string;
  moreOptions: string;
  attachment: string;
  unreadCount: (count: number) => string;
}

export const chatMessages: Record<SupportedLocale, ChatMessages> = {
  en: {
    title: 'Chat',
    subtitle: 'Coordinate with people from your Quests.',
    searchConversations: 'Search conversations',
    recentConversations: 'Recent conversations',
    conversationCount: (count) => `${count} conversations`,
    noConversations: 'Your Quest conversations will appear here.',
    noSearchResults: 'No conversations match your search.',
    questOwner: 'Quest owner',
    questMember: 'Quest member',
    questTeam: 'Quest team',
    viewQuest: 'View Quest details',
    search: 'Search',
    searchMessages: 'Messages',
    searchFiles: 'Files',
    messages: 'messages',
    files: 'files',
    closeSearch: 'Close search',
    searchInConversation: 'Search this Quest chat',
    searchResultCount: (count, type) => `${count} ${type}`,
    noMessageResults: 'No messages match your search.',
    noFileResults: 'No files match your search.',
    today: 'Today',
    typeMessage: 'Message the Quest team…',
    send: 'Send message',
    addAttachment: 'Add attachment',
    takePhoto: 'Take photo',
    choosePhoto: 'Choose photo',
    chooseFile: 'Choose file',
    cancel: 'Cancel',
    mockAttachmentDescription: 'Attachment actions are ready for the API connection.',
    conversationNotFound: 'This Quest conversation could not be found.',
    backToChat: 'Back to Chat',
    openFile: 'Open file',
    moreOptions: 'More conversation options',
    attachment: 'Attachment',
    unreadCount: (count) => `${count} unread messages`,
  },
  th: {
    title: 'แชต',
    subtitle: 'ประสานงานกับคนในเควสต์ของคุณ',
    searchConversations: 'ค้นหาบทสนทนา',
    recentConversations: 'บทสนทนาล่าสุด',
    conversationCount: (count) => `${count} บทสนทนา`,
    noConversations: 'บทสนทนาที่เกี่ยวข้องกับเควสต์จะแสดงที่นี่',
    noSearchResults: 'ไม่พบบทสนทนาที่ตรงกับการค้นหา',
    questOwner: 'เจ้าของเควสต์',
    questMember: 'สมาชิกเควสต์',
    questTeam: 'ทีมเควสต์',
    viewQuest: 'ดูรายละเอียดเควสต์',
    search: 'ค้นหา',
    searchMessages: 'ข้อความ',
    searchFiles: 'ไฟล์',
    messages: 'ข้อความ',
    files: 'ไฟล์',
    closeSearch: 'ปิดการค้นหา',
    searchInConversation: 'ค้นหาในแชตเควสต์นี้',
    searchResultCount: (count, type) => `${count} ${type === 'messages' ? 'ข้อความ' : 'ไฟล์'}`,
    noMessageResults: 'ไม่พบข้อความที่ตรงกับการค้นหา',
    noFileResults: 'ไม่พบไฟล์ที่ตรงกับการค้นหา',
    today: 'วันนี้',
    typeMessage: 'ส่งข้อความถึงทีมเควสต์…',
    send: 'ส่งข้อความ',
    addAttachment: 'เพิ่มไฟล์แนบ',
    takePhoto: 'ถ่ายรูป',
    choosePhoto: 'เลือกรูปภาพ',
    chooseFile: 'เลือกไฟล์',
    cancel: 'ยกเลิก',
    mockAttachmentDescription: 'เมนูไฟล์แนบพร้อมเชื่อมต่อกับ API ในขั้นถัดไป',
    conversationNotFound: 'ไม่พบบทสนทนาของเควสต์นี้',
    backToChat: 'กลับไปหน้าแชต',
    openFile: 'เปิดไฟล์',
    moreOptions: 'ตัวเลือกเพิ่มเติมของบทสนทนา',
    attachment: 'ไฟล์แนบ',
    unreadCount: (count) => `มี ${count} ข้อความที่ยังไม่ได้อ่าน`,
  },
};
