import { PrizeConfig } from '../types';

export const PRIZES: PrizeConfig[] = [
  {
    id: 'prize_1_kit_icecream',
    rank: 1,
    name: '응급키트 + 아이스크림',
    quota: 2,
    icon: 'Sparkles',
    badgeColor: 'amber',
    tagline: '최고 행운의 1등 세트!',
    description: '안전 응급키트와 시원한 아이스크림을 모두 드립니다.',
    isSpecialCombo: true,
  },
  {
    id: 'prize_2_kit',
    rank: 2,
    name: '응급키트',
    quota: 4,
    icon: 'ShieldAlert',
    badgeColor: 'rose',
    tagline: '안전 필수템 든든 키트',
    description: '가정이나 학교에서 유용한 비상 상비 응급키트입니다.',
  },
  {
    id: 'prize_3_lipbalm',
    rank: 3,
    name: '립밤',
    quota: 10,
    icon: 'Heart',
    badgeColor: 'pink',
    tagline: '촉촉한 입술 보습 케어',
    description: '건조한 환절기 필수 입술 보습 립밤입니다.',
  },
  {
    id: 'prize_4_tissue',
    rank: 4,
    name: '비염티슈',
    quota: 20,
    icon: 'Wind',
    badgeColor: 'teal',
    tagline: '부드럽고 촉촉한 코 편한 티슈',
    description: '먼지와 알레르기로부터 코를 보호하는 부드러운 로션 티슈입니다.',
  },
  {
    id: 'prize_5_milkamoo',
    rank: 5,
    name: '밀카무',
    quota: 60,
    icon: 'Cookie',
    badgeColor: 'indigo',
    tagline: '달콤 바삭 귀여운 밀카무 쿠키',
    description: '초콜릿이 묻은 바삭하고 맛있는 귀여운 소 모양 밀카 쿠키입니다.',
  },
  {
    id: 'prize_6_icecream',
    rank: 6,
    name: '아이스크림',
    quota: 128,
    icon: 'IceCream',
    badgeColor: 'sky',
    tagline: '기분까지 시원달콤한 아이스크림',
    description: '친구들과 나눠먹는 인기 만점 시원한 아이스크림입니다.',
  },
];

export const TOTAL_PRIZES_QUOTA = PRIZES.reduce((sum, p) => sum + p.quota, 0); // 224

export const DEFAULT_TEACHER_PASSWORD = '43234323';
export const STORAGE_KEYS = {
  CLAIMS: 'school_lucky_draw_claims_v1',
  GAS_CONFIG: 'school_lucky_draw_gas_config_v1',
  DEVICE_LABEL: 'school_lucky_draw_device_label_v1',
  TEACHER_AUTH: 'school_lucky_draw_teacher_auth_v1',
};
