import type { SupportedLocale } from '@/locales/LocaleProvider';
import type { QuestBoardQuest } from './types';

type QuestTranslation = {
  title: string;
  tags: string[];
  description: string;
  completionCriteria: string;
  location: string;
  creatorName: string;
  creatorFaculty?: string;
};

const thaiQuestTranslations: Record<string, QuestTranslation> = {
  'move-boxes': { title: 'ช่วยยกกล่องไปหอพัก', tags: ['ยกของ'], description: 'ช่วยขนกล่องที่ติดป้ายจากลานจอดรถไปยังหอพัก 13', completionCriteria: 'ส่งกล่องทั้งหมดถึงห้องที่กำหนดอย่างปลอดภัย', location: 'หอพัก 13', creatorName: 'นิชา ส.', creatorFaculty: 'สถาปัตยกรรมศาสตร์' },
  'clean-fan': { title: 'ล้างพัดลมหอพัก', tags: ['ทำความสะอาด'], description: 'ทำความสะอาดพัดลมส่วนกลางใต้หอพัก 13 ก่อนช่วงเย็น', completionCriteria: 'พัดลมสะอาดและใช้งานได้หลังทำงานเสร็จ', location: 'ใต้หอพัก 13', creatorName: 'พลอย เค.', creatorFaculty: 'วิศวกรรมศาสตร์' },
  'print-documents': { title: 'ถ่ายเอกสารประกอบการเรียน', tags: ['ถ่ายเอกสาร'], description: 'ถ่ายเอกสารประกอบการเรียนและนำส่งให้ผู้ว่าจ้าง', completionCriteria: 'ส่งสำเนาเอกสารที่คมชัดครบตามจำนวนที่ต้องการ', location: 'ร้านถ่ายเอกสารใกล้หอพัก 13', creatorName: 'มายด์ พ.', creatorFaculty: 'วิทยาศาสตร์' },
  'buy-lunch': { title: 'ซื้อข้าวจากโรงอาหาร', tags: ['ส่งของ'], description: 'ซื้ออาหารจากโรงอาหารและนำไปส่งให้ผู้ว่าจ้าง', completionCriteria: 'ส่งอาหารที่สั่งครบและตรงเวลา', location: 'โรงอาหารกลาง', creatorName: 'บีม ที.', creatorFaculty: 'ศึกษาศาสตร์' },
  'run-together': { title: 'ไปวิ่งเป็นเพื่อน', tags: ['ออกกำลังกาย'], description: 'วิ่งรอบมหาวิทยาลัยด้วยกันในช่วงเย็นแบบสบาย ๆ', completionCriteria: 'วิ่งครบเส้นทางที่ตกลงกันด้วยกัน', location: 'สนามอินทรีจันทรสถิตย์', creatorName: 'เฟิร์น ล.', creatorFaculty: 'วิศวกรรมศาสตร์' },
  'move-water-packs': { title: 'ช่วยยกแพ็กน้ำไปหอพัก', tags: ['ยกของ'], description: 'ช่วยยกน้ำดื่มบรรจุขวดจากร้านค้าไปยังหอพัก 12', completionCriteria: 'ส่งแพ็กน้ำทั้งหมดถึงห้องพัก', location: 'หอพัก 12', creatorName: 'อ้อม ร.', creatorFaculty: 'มนุษยศาสตร์' },
  'move-club-equipment': { title: 'ช่วยย้ายอุปกรณ์ชมรม', tags: ['ยกของ'], description: 'ย้ายอุปกรณ์สำหรับกิจกรรมจากห้องเก็บของไปยังห้องจัดกิจกรรม', completionCriteria: 'ติดตั้งอุปกรณ์ตามรายการทั้งหมดในห้องจัดกิจกรรม', location: 'อาคารกิจกรรมนิสิต', creatorName: 'นนท์ พ.', creatorFaculty: 'กิจการนิสิต' },
  'clean-study-table': { title: 'ทำความสะอาดโต๊ะอ่านหนังสือ', tags: ['ทำความสะอาด'], description: 'เช็ดและจัดระเบียบโต๊ะอ่านหนังสือส่วนกลางในห้องสมุด', completionCriteria: 'โต๊ะสะอาดและพร้อมใช้งาน', location: 'สำนักหอสมุด', creatorName: 'พิม ซี.', creatorFaculty: 'วิศวกรรมศาสตร์' },
  'clean-bike': { title: 'ล้างจักรยาน', tags: ['ทำความสะอาด'], description: 'ล้างจักรยานและเช็ดให้แห้งบริเวณใกล้หอพัก', completionCriteria: 'จักรยานสะอาดและแห้ง', location: 'ลานจอดจักรยานหอพัก 13', creatorName: 'ฟ้า ว.', creatorFaculty: 'เกษตรศาสตร์' },
  'print-presentation': { title: 'พิมพ์สไลด์นำเสนอ', tags: ['ถ่ายเอกสาร'], description: 'พิมพ์ชุดสไลด์นำเสนอก่อนเข้าเรียน', completionCriteria: 'ส่งสไลด์ที่พิมพ์ครบทุกหน้า', location: 'ร้านถ่ายเอกสารคณะวิศวกรรมศาสตร์', creatorName: 'หมิว จ.', creatorFaculty: 'วิศวกรรมศาสตร์' },
  'print-event-posters': { title: 'พิมพ์โปสเตอร์งานกิจกรรม', tags: ['ถ่ายเอกสาร'], description: 'พิมพ์และรับโปสเตอร์สำหรับงานกิจกรรมของคณะ', completionCriteria: 'ส่งโปสเตอร์ที่คมชัด 10 แผ่นให้ผู้จัดงาน', location: 'ร้านถ่ายเอกสารหน้า มก.', creatorName: 'ต้น เค.', creatorFaculty: 'วิทยาศาสตร์' },
  'deliver-snacks': { title: 'ส่งขนมให้กลุ่มอ่านหนังสือ', tags: ['ส่งของ'], description: 'รับขนมจากร้านสะดวกซื้อและนำไปส่งให้กลุ่มอ่านหนังสือ', completionCriteria: 'ส่งขนมที่สั่งครบทั้งหมด', location: 'สำนักหอสมุด', creatorName: 'พลอย น.', creatorFaculty: 'มนุษยศาสตร์' },
  'deliver-parcel': { title: 'ส่งพัสดุไปหอพัก', tags: ['ส่งของ'], description: 'รับพัสดุที่จุดไปรษณีย์ในมหาวิทยาลัยและนำไปส่งที่หอพัก 11', completionCriteria: 'ส่งพัสดุถึงผู้ว่าจ้าง', location: 'หอพัก 11', creatorName: 'บีม ที.', creatorFaculty: 'ศึกษาศาสตร์' },
  'walk-together': { title: 'ไปเดินเล่นเป็นเพื่อน', tags: ['ออกกำลังกาย'], description: 'เดินเล่นรอบมหาวิทยาลัยแบบสบาย ๆ ก่อนพระอาทิตย์ตก', completionCriteria: 'เดินครบเส้นทางที่วางแผนไว้ด้วยกัน', location: 'สวนวชิรเบญจทัศ', creatorName: 'มิ้นท์ ส.', creatorFaculty: 'เศรษฐศาสตร์' },
  'play-badminton': { title: 'เล่นแบดมินตันด้วยกัน', tags: ['ออกกำลังกาย'], description: 'ร่วมเล่นแบดมินตันแบบเป็นกันเองหลังเลิกเรียน', completionCriteria: 'เข้าร่วมและเล่นครบตามเวลาที่ตกลงกัน', location: 'สนามแบดมินตัน มก.', creatorName: 'กานต์ พ.', creatorFaculty: 'วิทยาศาสตร์การกีฬา' },
  'move-plants': { title: 'ช่วยย้ายต้นไม้ไปห้องใหม่', tags: ['ยกของ'], description: 'ช่วยย้ายต้นไม้กระถางไปยังห้องพักใหม่', completionCriteria: 'ต้นไม้ทั้งหมดถึงที่หมายโดยไม่เสียหาย', location: 'หอพัก 9', creatorName: 'ดาว ล.', creatorFaculty: 'วนศาสตร์' },
  'clean-fridge': { title: 'ทำความสะอาดตู้เย็นหอพัก', tags: ['ทำความสะอาด'], description: 'ทำความสะอาดภายในตู้เย็นขนาดเล็กในห้องพัก', completionCriteria: 'ตู้เย็นสะอาดและแห้ง', location: 'หอพัก 10', creatorName: 'เกม ที.', creatorFaculty: 'สัตวแพทยศาสตร์' },
  'print-notes': { title: 'พิมพ์โน้ตการเรียน', tags: ['ถ่ายเอกสาร'], description: 'พิมพ์โน้ตการเรียนสำหรับคลาสช่วงบ่าย', completionCriteria: 'ส่งโน้ตครบถ้วนก่อนเริ่มเรียน', location: 'คณะวิทยาศาสตร์', creatorName: 'เมย์ เค.', creatorFaculty: 'วิทยาศาสตร์' },
  'deliver-drinks': { title: 'ส่งเครื่องดื่มไปห้องสมุด', tags: ['ส่งของ'], description: 'ซื้อเครื่องดื่มและนำไปส่งให้กลุ่มที่อ่านหนังสือในห้องสมุด', completionCriteria: 'ส่งเครื่องดื่มทั้งหมดถึงโต๊ะที่ถูกต้อง', location: 'สำนักหอสมุด', creatorName: 'ไอซ์ น.', creatorFaculty: 'บริหารธุรกิจ' },
  'stretch-together': { title: 'ยืดเหยียดร่างกายด้วยกันหลังเลิกเรียน', tags: ['ออกกำลังกาย'], description: 'ทำกิจกรรมยืดเหยียดร่างกายสั้น ๆ หลังเลิกเรียน', completionCriteria: 'ทำกิจกรรมยืดเหยียดครบทั้งช่วงด้วยกัน', location: 'ลานกิจกรรมกลางแจ้ง', creatorName: 'แนน บ.', creatorFaculty: 'ศึกษาศาสตร์' },
  'team-forming-demo': { title: 'รวมทีมกิจกรรมในมหาวิทยาลัย', tags: ['ชีวิตในมหาวิทยาลัย'], description: 'เข้าร่วมทีมเล็ก ๆ เพื่อช่วยงานกิจกรรมในมหาวิทยาลัย', completionCriteria: 'ทำรายการตรวจสอบงานกิจกรรมให้ครบถ้วน', location: 'อาคารกิจกรรมนิสิต', creatorName: 'ผู้ว่าจ้างตัวอย่าง' },
  'team-selection-demo': { title: 'เลือกทีมกิจกรรมในมหาวิทยาลัย', tags: ['ชีวิตในมหาวิทยาลัย'], description: 'ผู้ว่าจ้างตรวจสอบข้อเสนอจากหลายทีมสำหรับงานกิจกรรม', completionCriteria: 'ทำรายการตรวจสอบงานกิจกรรมให้ครบถ้วน', location: 'อาคารกิจกรรมนิสิต', creatorName: 'ผู้ว่าจ้างตัวอย่าง' },
  'single-candidate-demo': { title: 'เลือกผู้ช่วยในมหาวิทยาลัย', tags: ['ชีวิตในมหาวิทยาลัย'], description: 'ตรวจสอบข้อเสนอจากผู้สมัครหลายคนสำหรับงานผู้ช่วย', completionCriteria: 'ทำรายการตรวจสอบงานผู้ช่วยให้ครบถ้วน', location: 'อาคารกิจกรรมนิสิต', creatorName: 'ผู้ว่าจ้างตัวอย่าง' },
  'partial-group-start-demo': { title: 'เริ่มทีมมหาวิทยาลัยแบบไม่เต็มจำนวน', tags: ['ชีวิตในมหาวิทยาลัย'], description: 'ตัวอย่างเควสต์กลุ่มแบบมาก่อนได้ก่อนที่ใช้การยินยอมก่อนเริ่ม', completionCriteria: 'ทำรายการตรวจสอบงานช่วยกิจกรรมให้ครบถ้วน', location: 'อาคารกิจกรรมนิสิต', creatorName: 'ผู้ว่าจ้างตัวอย่าง' },
};

export function getLocalizedTag(tag: string, locale: SupportedLocale): string {
  if (locale !== 'th') return tag;
  const translations: Record<string, string> = { moving: 'ยกของ', cleaning: 'ทำความสะอาด', printing: 'ถ่ายเอกสาร', delivery: 'ส่งของ', exercise: 'ออกกำลังกาย' };
  return translations[tag] ?? tag;
}

export interface LocalizedQuest extends QuestBoardQuest {
  title: string;
  tags: string[];
  description: string;
  completionCriteria: string;
  location: string;
  creator: QuestBoardQuest['creator'];
}

export function getLocalizedQuest(quest: QuestBoardQuest, locale: SupportedLocale): LocalizedQuest {
  if (locale !== 'th') return quest;
  const translation = thaiQuestTranslations[quest.id];
  if (!translation) return quest;
  return { ...quest, title: translation.title, tags: translation.tags, description: translation.description, completionCriteria: translation.completionCriteria, location: translation.location, creator: { ...quest.creator, name: translation.creatorName, faculty: translation.creatorFaculty } };
}
