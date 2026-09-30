import { ClaimRecord } from '../types';
import { PRIZES } from '../constants/prizes';

const SAMPLE_STUDENTS = [
  { grade: 1, classNum: 3, name: '김민준' },
  { grade: 2, classNum: 1, name: '이서아' },
  { grade: 3, classNum: 5, name: '박도윤' },
  { grade: 1, classNum: 7, name: '정하윤' },
  { grade: 2, classNum: 4, name: '최시우' },
  { grade: 3, classNum: 2, name: '강지유' },
  { grade: 1, classNum: 2, name: '조은우' },
  { grade: 2, classNum: 6, name: '윤지아' },
  { grade: 3, classNum: 8, name: '장건우' },
  { grade: 2, classNum: 3, name: '임수아' },
];

export function generateSampleRecords(): ClaimRecord[] {
  const now = Date.now();
  const samplePrizes = [
    PRIZES[0], // 1등 응급키트+아이스크림
    PRIZES[1], // 2등 응급키트
    PRIZES[2], // 3등 립밤
    PRIZES[3], // 4등 비염티슈
    PRIZES[4], // 5등 밀카무
    PRIZES[4], // 5등 밀카무
    PRIZES[5], // 6등 아이스크림
    PRIZES[5], // 6등 아이스크림
    PRIZES[5], // 6등 아이스크림
  ];

  return SAMPLE_STUDENTS.map((student, idx) => {
    const prize = samplePrizes[idx % samplePrizes.length];
    const timeOffset = (SAMPLE_STUDENTS.length - idx) * 3 * 60 * 1000;
    const date = new Date(now - timeOffset);
    const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

    return {
      id: `sample_${now}_${idx}`,
      timestamp: date.toISOString(),
      formattedTime: timeStr,
      userType: 'student',
      grade: student.grade,
      classNum: student.classNum,
      name: student.name,
      prizeId: prize.id,
      prizeName: prize.name,
      prizeRank: prize.rank,
      deviceLabel: idx % 2 === 0 ? '디벗 1호기' : '디벗 2호기',
      syncedToGoogleSheet: false,
    };
  });
}
