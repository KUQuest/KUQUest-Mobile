import type { SupportedLocale } from "./locale";

const facultyNames: Record<string, string> = {
  Agriculture: "คณะเกษตร",
  "Business Administration": "คณะบริหารธุรกิจ",
  Fisheries: "คณะประมง",
  Humanities: "คณะมนุษยศาสตร์",
  Forestry: "คณะวนศาสตร์",
  Science: "คณะวิทยาศาสตร์",
  Engineering: "คณะวิศวกรรมศาสตร์",
  Education: "คณะศึกษาศาสตร์",
  Economics: "คณะเศรษฐศาสตร์",
  Architecture: "คณะสถาปัตยกรรมศาสตร์",
  "Social Sciences": "คณะสังคมศาสตร์",
  "Veterinary Medicine": "คณะสัตวแพทยศาสตร์",
  "Agro-Industry": "คณะอุตสาหกรรมเกษตร",
  "Veterinary Technology": "คณะเทคนิคการสัตวแพทย์",
  Environment: "คณะสิ่งแวดล้อม",
  Medicine: "คณะแพทยศาสตร์",
  Nurse: "คณะพยาบาลศาสตร์",
  "Pharmaceutical Sciences": "คณะเภสัชศาสตร์",
  "Interdisciplinary Management and Technology":
    "คณะสหวิทยาการจัดการและเทคโนโลยี",
  "School of Integrated Science (SIS)": "วิทยาลัยบูรณาการศาสตร์",
  "International College": "วิทยาลัยนานาชาติ",
  "Graduate School": "บัณฑิตวิทยาลัย",
};

const departmentNames: Record<string, string> = {
  "Agricultural Extension and Communication":
    "ภาควิชาส่งเสริมและนิเทศศาสตร์เกษตร",
  Agronomy: "ภาควิชาพืชไร่นา",
  "Animal Science": "ภาควิชาสัตวบาล",
  Entomology: "ภาควิชากีฏวิทยา",
  "Farm Mechanics": "ภาควิชาเกษตรกลวิธาน",
  "Home Economics": "ภาควิชาคหกรรมศาสตร์",
  Horticulture: "ภาควิชาพืชสวน",
  "Plant Pathology": "ภาควิชาโรคพืช",
  "Soil Science": "ภาควิชาปฐพีวิทยา",
  "Tropical Agriculture": "เกษตรเขตร้อน (หลักสูตรนานาชาติ)",
  Accounting: "ภาควิชาบัญชี",
  "Bachelor of Accountancy": "บัญชีบัณฑิต",
  "Business Administration": "บริหารธุรกิจ",
  Finance: "ภาควิชาการเงิน",
  Management: "ภาควิชาการจัดการ",
  Marketing: "ภาควิชาการตลาด",
  "Technology and Operations Management":
    "ภาควิชาการจัดการเทคโนโลยีและการปฏิบัติการ",
  Aquaculture: "ภาควิชาเพาะเลี้ยงสัตว์น้ำ",
  "Fisheries Biology": "ภาควิชาชีววิทยาประมง",
  "Fisheries Management": "ภาควิชาการจัดการประมง",
  "Fisheries Technology and Innovation": "ภาควิชาเทคโนโลยีและนวัตกรรมประมง",
  "Fishery Products": "ภาควิชาผลิตภัณฑ์ประมง",
  "Marine Science": "ภาควิชาวิทยาศาสตร์ทางทะเล",
  "Communication Arts and Information Science":
    "ภาควิชานิเทศศาสตร์และสารสนเทศศาสตร์",
  "Communicative Thai Language for Foreigners":
    "ภาษาไทยเพื่อการสื่อสารสำหรับชาวต่างประเทศ",
  "Eastern Languages": "ภาควิชาภาษาตะวันออก",
  "Foreign Languages": "ภาควิชาภาษาต่างประเทศ",
  "Integrated Tourism Management": "การจัดการการท่องเที่ยวแบบบูรณาการ",
  Linguistics: "ภาควิชาภาษาศาสตร์",
  Literature: "ภาควิชาวรรณคดี",
  Music: "ภาควิชาดนตรี",
  "Philosophy and Religion": "ภาควิชาปรัชญาและศาสนา",
  "Thai Language": "ภาควิชาภาษาไทย",
  "Tourism and Hospitality Industry": "ภาควิชาอุตสาหกรรมท่องเที่ยวและบริการ",
  Conservation: "ภาควิชาอนุรักษ์วิทยา",
  "Forest Biology": "ภาควิชาชีววิทยาป่าไม้",
  "Forest Engineering": "ภาควิชาวิศวกรรมป่าไม้",
  "Forest Management": "ภาควิชาการจัดการป่าไม้",
  "Forest Products": "ภาควิชาวนผลิตภัณฑ์",
  Forestry: "การป่าไม้",
  Silviculture: "ภาควิชาวนวัฒนวิทยา",
  "Applied Radiation and Isotopes": "ภาควิชารังสีประยุกต์และไอโซโทป",
  Biochemistry: "ภาควิชาชีวเคมี",
  "Bioscience and Technology": "วิทยาศาสตร์ชีวภาพและเทคโนโลยี",
  Botany: "ภาควิชาพฤกษศาสตร์",
  Chemistry: "ภาควิชาเคมี",
  "Computer Science": "ภาควิชาวิทยาการคอมพิวเตอร์",
  "Earth Science": "ภาควิชาวิทยาศาสตร์พื้นพิภพ",
  Genetics: "ภาควิชาพันธุศาสตร์",
  "Integrated Chemistry": "เคมีบูรณาการ",
  "Materials Science": "ภาควิชาวัสดุศาสตร์",
  Mathematics: "ภาควิชาคณิตศาสตร์",
  Microbiology: "ภาควิชาจุลชีววิทยา",
  Physics: "ภาควิชาฟิสิกส์",
  "Polymer Science and Technology": "วิทยาศาสตร์และเทคโนโลยีพอลิเมอร์",
  Statistics: "ภาควิชาสถิติ",
  Zoology: "ภาควิชาสัตววิทยา",
  "Aerospace Engineering": "ภาควิชาวิศวกรรมการบินและอวกาศ",
  "Aerospace Engineering and Business Management":
    "วิศวกรรมการบินและอวกาศและการบริหารธุรกิจ",
  "Chemical Engineering": "ภาควิชาวิศวกรรมเคมี",
  "Civil Engineering": "ภาควิชาวิศวกรรมโยธา",
  "Computer Engineering": "ภาควิชาวิศวกรรมคอมพิวเตอร์",
  "Digital Manufacturing and Robotics Integration Engineering":
    "วิศวกรรมระบบการผลิตดิจิทัลและบูรณาการหุ่นยนต์",
  "Electrical Engineering": "ภาควิชาวิศวกรรมไฟฟ้า",
  Engineering: "วิศวกรรมศาสตร์ (หลักสูตรทั่วไป)",
  "Environmental Engineering": "ภาควิชาวิศวกรรมสิ่งแวดล้อม",
  "Industrial Engineering": "ภาควิชาวิศวกรรมอุตสาหการ",
  "Materials Engineering": "ภาควิชาวิศวกรรมวัสดุ",
  "Mechanical Engineering": "ภาควิชาวิศวกรรมเครื่องกล",
  "Software and Knowledge Engineering": "วิศวกรรมซอฟต์แวร์และความรู้",
  "Water Resources Engineering": "ภาควิชาวิศวกรรมทรัพยากรน้ำ",
  Education: "ภาควิชาการศึกษา",
  "Educational Psychology and Guidance": "ภาควิชาจิตวิทยาการศึกษาและการแนะแนว",
  "Educational Technology": "ภาควิชาเทคโนโลยีการศึกษา",
  "Physical Education": "ภาควิชาพลศึกษา",
  "Vocational Education": "ภาควิชาอาชีวศึกษา",
  "Agricultural and Resource Economics": "ภาควิชาเศรษฐศาสตร์เกษตรและทรัพยากร",
  Cooperatives: "ภาควิชาสหกรณ์",
  Economics: "ภาควิชาเศรษฐศาสตร์",
  "Entrepreneurial Economics": "เศรษฐศาสตร์ผู้ประกอบการ",
  Architecture: "ภาควิชาสถาปัตยกรรม",
  "Building Innovation": "ภาควิชานวัตกรรมอาคาร",
  "Landscape Architecture": "ภาควิชาภูมิสถาปัตยกรรม",
  Geography: "ภาควิชาภูมิศาสตร์",
  History: "ภาควิชาประวัติศาสตร์",
  Law: "ภาควิชานิติศาสตร์",
  "Political Science": "รัฐศาสตร์",
  "Political Science and Public Administration":
    "ภาควิชารัฐศาสตร์และรัฐประศาสนศาสตร์",
  Psychology: "ภาควิชาจิตวิทยา",
  "Sociology and Anthropology": "ภาควิชาสังคมวิทยาและมานุษยวิทยา",
  "Southeast Asian Studies": "เอเชียตะวันออกเฉียงใต้ศึกษา",
  Anatomy: "ภาควิชากายวิภาคศาสตร์",
  "Companion Animal Clinical Sciences": "ภาควิชาเวชศาสตร์คลินิกสัตว์เลี้ยง",
  "Farm Animal Production and Resource Medicine":
    "ภาควิชาเวชศาสตร์และทรัพยากรการผลิตสัตว์",
  "Large Animal and Wildlife Clinical Sciences":
    "ภาควิชาเวชศาสตร์คลินิกสัตว์ใหญ่และสัตว์ป่า",
  "Microbiology and Immunology": "ภาควิชาจุลชีววิทยาและวิทยาภูมิคุ้มกัน",
  Parasitology: "ภาควิชาปรสิตวิทยา",
  Pathology: "ภาควิชาพยาธิวิทยา",
  Pharmacology: "ภาควิชาเภสัชวิทยา",
  Physiology: "ภาควิชาสรีรวิทยา",
  "Veterinary Medicine": "สัตวแพทยศาสตร์",
  "Veterinary Public Health": "ภาควิชาสัตวแพทยสาธารณสุขศาสตร์",
  "Agro-Industrial Innovation and Technology":
    "นวัตกรรมและเทคโนโลยีอุตสาหกรรมเกษตร",
  "Agro-Industrial Technology": "ภาควิชาเทคโนโลยีอุตสาหกรรมเกษตร",
  Biotechnology: "ภาควิชาเทคโนโลยีชีวภาพ",
  "Food Science and Technology": "ภาควิชาวิทยาศาสตร์และเทคโนโลยีการอาหาร",
  "Packaging and Materials Technology": "ภาควิชาเทคโนโลยีการบรรจุและวัสดุ",
  "Product Development": "ภาควิชาพัฒนาผลิตภัณฑ์",
  "Textile Science": "ภาควิชาวิทยาการสิ่งทอ",
  "Animal Nursing": "ภาควิชาการพยาบาลสัตว์",
  "Veterinary Technology": "ภาควิชาเทคนิคการสัตวแพทย์",
  "Environmental Science": "ภาควิชาวิทยาศาสตร์สิ่งแวดล้อม",
  "Environmental Technology and Management":
    "ภาควิชาเทคโนโลยีและการจัดการสิ่งแวดล้อม",
  "Biochemistry and Genetic Engineering": "ภาควิชาชีวเคมีและพันธุวิศวกรรม",
  "Clinical Pathology": "ภาควิชาพยาธิคลินิก",
  Medicine: "แพทยศาสตร์",
  "Adult and Gerontological Nursing": "ภาควิชาการพยาบาลผู้ใหญ่และผู้สูงอายุ",
  "Community and Environmental Health Nursing":
    "ภาควิชาการพยาบาลอนามัยชุมชนและสิ่งแวดล้อม",
  "Fundamentals of Nursing": "ภาควิชาการพยาบาลพื้นฐาน",
  "Maternal-Newborn and Midwifery Nursing":
    "ภาควิชาการพยาบาลมารดา ทารก ผดุงครรภ์",
  "Mental Health and Psychiatric Nursing":
    "ภาควิชาสุขภาพจิตและการพยาบาลจิตเวชศาสตร์",
  Nursing: "พยาบาลศาสตร์",
  "Pediatric Nursing": "ภาควิชาการพยาบาลเด็กและวัยรุ่น",
  "Pharmaceutical Sciences": "ภาควิชาวิทยาการเภสัชกรรม",
  "Pharmacy Practice": "ภาควิชาการบริบาลทางเภสัชกรรม",
  "Agricultural Management": "ภาควิชาการจัดการการเกษตร",
  "Health Management": "ภาควิชาการจัดการสุขภาพ",
  "Hospitality Business Management": "ภาควิชาการจัดการธุรกิจบริการ",
  "Interdisciplinary Management and Technology": "สหวิทยาการจัดการและเทคโนโลยี",
  "Knowledge of The Land for Sustainable Development":
    "ศาสตร์แห่งแผ่นดินเพื่อการพัฒนาที่ยั่งยืน",
  "International Undergraduate Programs": "หลักสูตรระดับปริญญาตรีนานาชาติ",
  "Agricultural Biotechnology": "เทคโนโลยีชีวภาพเกษตร (สหสาขาวิชา)",
  "Sustainable Land Use and Natural Resource Management":
    "การใช้ที่ดินและการจัดการทรัพยากรธรรมชาติอย่างยั่งยืน (สหสาขาวิชา)",
};

export function localizeFacultyName(
  name: string,
  locale: SupportedLocale
): string {
  if (locale === "en") return name;
  const key = name.startsWith("Faculty of ")
    ? name.slice("Faculty of ".length)
    : name;
  return Object.prototype.hasOwnProperty.call(facultyNames, key)
    ? facultyNames[key]
    : name;
}

export function localizeDepartmentName(
  name: string,
  locale: SupportedLocale
): string {
  if (locale === "en") return name;
  return Object.prototype.hasOwnProperty.call(departmentNames, name)
    ? departmentNames[name]
    : name;
}
