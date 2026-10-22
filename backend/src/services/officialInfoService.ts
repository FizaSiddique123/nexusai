import { ExamProfileService } from './examProfileService.js';

export interface OfficialExamInfo {
  examName: string;
  officialAuthority: string;
  officialPortalUrl: string;
  notificationCycle: string;
  admitCardCycle: string;
  examinationWindow: string;
  officialSourceDisclaimer: string;
  isRealTimeVerified: boolean;
  notes: string[];
}

export class OfficialInfoService {
  private static officialRegistry: Record<string, OfficialExamInfo> = {
    'upsc': {
      examName: 'UPSC Civil Services Examination (CSE)',
      officialAuthority: 'Union Public Service Commission (UPSC), Dholpur House, New Delhi',
      officialPortalUrl: 'https://upsc.gov.in',
      notificationCycle: 'Annual notification usually published in February on upsc.gov.in',
      admitCardCycle: 'E-Admit Cards are released 2 to 3 weeks before the exam date on upsconline.nic.in',
      examinationWindow: 'Prelims typically held in May/June; Mains descriptive in September/October',
      officialSourceDisclaimer: 'Always confirm exam dates against the official UPSC Annual Calendar released on upsc.gov.in. Third-party portals often carry tentative or outdated dates.',
      isRealTimeVerified: false,
      notes: [
        'Official Portal: https://upsc.gov.in',
        'Application Portal: https://upsconline.nic.in',
        'Helpline: Facilitation Counter at UPSC premises near Gate C',
        'Official Calendar: Check the "Examinations -> Examination Calendar" tab on upsc.gov.in'
      ]
    },
    'gate': {
      examName: 'Graduate Aptitude Test in Engineering (GATE)',
      officialAuthority: 'Organizing IIT / IISc Bangalore on behalf of National Coordination Board (NCB)-GATE',
      officialPortalUrl: 'https://gate2026.iitg.ac.in',
      notificationCycle: 'Official information brochure released in July/August each year',
      admitCardCycle: 'Admit cards downloadable through GOAPS portal in January',
      examinationWindow: 'Conducted on the first two weekends (Saturdays and Sundays) of February',
      officialSourceDisclaimer: 'The organizing institute alternates each year among IIT Bombay, IIT Delhi, IIT Guwahati, IIT Kanpur, IIT Kharagpur, IIT Madras, IIT Roorkee, and IISc Bangalore.',
      isRealTimeVerified: false,
      notes: [
        'Official Portal: Verified through gate.iitb.ac.in / gate2026 organizing portal',
        'Question Papers: Official master question papers and answer keys are uploaded within 10 days of exam completion'
      ]
    },
    'cat': {
      examName: 'Common Admission Test (CAT)',
      officialAuthority: 'Indian Institutes of Management (IIMs)',
      officialPortalUrl: 'https://iimcat.ac.in',
      notificationCycle: 'Official advertisement released on the last Sunday of July',
      admitCardCycle: 'Admit cards released around the fourth week of October',
      examinationWindow: 'Held annually on the last Sunday of November across three sessions',
      officialSourceDisclaimer: 'Registration and scoring are managed strictly through iimcat.ac.in. Scorecards are valid for one calendar year.',
      isRealTimeVerified: false,
      notes: [
        'Official Portal: https://iimcat.ac.in',
        'Format: 3 sessions of 120 minutes each with 40-minute sectional limits'
      ]
    },
    'ssc': {
      examName: 'Staff Selection Commission (SSC CGL / CHSL)',
      officialAuthority: 'Staff Selection Commission, Department of Personnel and Training (DoPT), Govt. of India',
      officialPortalUrl: 'https://ssc.gov.in',
      notificationCycle: 'Annual Examination Calendar published by SSC on its new portal (ssc.gov.in)',
      admitCardCycle: 'Region-specific admit cards uploaded 7-10 days prior on regional websites (e.g. sscnr.nic.in, sscer.org)',
      examinationWindow: 'Tier-I computer-based examinations scheduled across multiple shifts throughout the year',
      officialSourceDisclaimer: 'The commission transitioned to its new portal ssc.gov.in. All official corrigenda and date notices are hosted there.',
      isRealTimeVerified: false,
      notes: [
        'New Official Portal: https://ssc.gov.in',
        'One-Time Registration (OTR) is mandatory on the new portal'
      ]
    },
    'banking': {
      examName: 'Banking Examinations (IBPS PO/Clerk/SO & SBI PO)',
      officialAuthority: 'Institute of Banking Personnel Selection (IBPS) & State Bank of India (SBI)',
      officialPortalUrl: 'https://ibps.in',
      notificationCycle: 'Annual Tentative Calendar released by IBPS in January at ibps.in',
      admitCardCycle: 'Call letters available 7-10 days before Preliminary and Main online tests',
      examinationWindow: 'Prelims in August-October; Mains in November-January',
      officialSourceDisclaimer: 'Check ibps.in and sbi.co.in/careers for authentic recruitment advertisements.',
      isRealTimeVerified: false,
      notes: [
        'IBPS Portal: https://ibps.in',
        'SBI Careers: https://sbi.co.in/careers'
      ]
    }
  };

  /**
   * Get official exam information and guidance
   */
  static getOfficialInfo(query: string): OfficialExamInfo {
    const q = query.toLowerCase();
    if (q.includes('upsc') || q.includes('civil service') || q.includes('ias')) {
      return this.officialRegistry['upsc'];
    }
    if (q.includes('gate') || q.includes('iit') || q.includes('mtech')) {
      return this.officialRegistry['gate'];
    }
    if (q.includes('cat') || q.includes('iim') || q.includes('mba')) {
      return this.officialRegistry['cat'];
    }
    if (q.includes('ssc') || q.includes('cgl') || q.includes('chsl')) {
      return this.officialRegistry['ssc'];
    }
    if (q.includes('bank') || q.includes('ibps') || q.includes('sbi')) {
      return this.officialRegistry['banking'];
    }

    // Default to general profile or UPSC
    const profile = ExamProfileService.detectExam(query);
    return {
      examName: profile.name,
      officialAuthority: profile.officialAuthority,
      officialPortalUrl: profile.officialReferenceUrl,
      notificationCycle: 'Published periodically in accordance with official governing board announcements',
      admitCardCycle: 'Issued prior to official examination date via authorized student portal',
      examinationWindow: 'Scheduled as per the authoritative calendar',
      officialSourceDisclaimer: profile.disclaimer,
      isRealTimeVerified: false,
      notes: [
        `Official Reference: ${profile.officialReferenceUrl}`,
        `Governing Body: ${profile.officialAuthority}`
      ]
    };
  }

  /**
   * Format an honest official-authority guidance response
   */
  static formatOfficialResponse(query: string): string {
    const info = this.getOfficialInfo(query);
    return `### 🏛️ Official Authority Information for **${info.examName}**

> **Official Authority**: ${info.officialAuthority}  
> **Official Portal**: [${info.officialPortalUrl}](${info.officialPortalUrl})

#### 📅 Examination Schedule & Notification Cycle
- **Notification Period**: ${info.notificationCycle}
- **Admit Card Issuance**: ${info.admitCardCycle}
- **Examination Window**: ${info.examinationWindow}

#### ⚠️ Authoritative Verification Notice
${info.officialSourceDisclaimer}

*Important:* Official dates, session timings, and admit card links are published exclusively by the official authority on their portal ([${info.officialPortalUrl}](${info.officialPortalUrl})). Never rely on unverified social media leaks or commercial coaching aggregators.

#### 📌 Official Reference Checkpoints:
${info.notes.map(n => `- ${n}`).join('\n')}

---
*Would you like me to create an adaptive revision schedule or generate practice questions tailored to this exam pattern?*`;
  }
}
