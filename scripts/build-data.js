import { mkdir, writeFile } from 'node:fs/promises';
import XLSX from '@e965/xlsx';

const DATA_DIR = new URL('../public/data/', import.meta.url);

const sources = {
  educationStatBulletin2024: {
    title: '2024年全国教育事业发展统计公报',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_sjzl/sjzl_fztjgb/202506/t20250611_1193760.html',
    published: '2025-06-11',
  },
  schoolList2025: {
    title: '全国高等学校名单（截至2025年6月20日）',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202506/t20250627_1195683.html',
    published: '2025-06-27',
  },
  regularSchoolListXls: {
    title: '全国普通高等学校名单',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202506/W020250729615142156867.xls',
    published: '2025-06-27',
  },
  adultSchoolListXls: {
    title: '全国成人高等学校名单',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202506/W020250627301230143042.xls',
    published: '2025-06-27',
  },
  provinceSchoolStats2024: {
    title: '高等教育学校（机构）数',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_sjzl/moe_560/2024/gedi/202603/t20260317_1431201.html',
    published: '2026-03-17',
  },
  undergraduateStudents2024: {
    title: '高等教育普通本科学生数',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_sjzl/moe_560/2024/gedi/202603/t20260317_1431199.html',
    published: '2026-03-17',
  },
  vocationalStudents2024: {
    title: '高等教育职业本专科学生数',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_sjzl/moe_560/2024/gedi/202603/t20260317_1431198.html',
    published: '2026-03-17',
  },
  postgraduateStudents2024: {
    title: '高等学校（机构）研究生数',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/jyb_sjzl/moe_560/2024/gedi/202603/t20260317_1431200.html',
    published: '2026-03-17',
  },
  admissionsNotice2026: {
    title: '教育部关于做好2026年普通高校招生工作的通知',
    publisher: '中华人民共和国教育部',
    url: 'https://www.moe.gov.cn/srcsite/A15/moe_776/s3258/202601/t20260121_1427110.html',
    published: '2026-01-21',
  },
};

const provinceNames = [
  '北京',
  '天津',
  '河北',
  '山西',
  '内蒙古',
  '辽宁',
  '吉林',
  '黑龙江',
  '上海',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '广西',
  '海南',
  '重庆',
  '四川',
  '贵州',
  '云南',
  '西藏',
  '陕西',
  '甘肃',
  '青海',
  '宁夏',
  '新疆',
];

const regionMap = {
  北京: '华北',
  天津: '华北',
  河北: '华北',
  山西: '华北',
  内蒙古: '华北',
  辽宁: '东北',
  吉林: '东北',
  黑龙江: '东北',
  上海: '华东',
  江苏: '华东',
  浙江: '华东',
  安徽: '华东',
  福建: '华东',
  江西: '华东',
  山东: '华东',
  河南: '华中',
  湖北: '华中',
  湖南: '华中',
  广东: '华南',
  广西: '华南',
  海南: '华南',
  重庆: '西南',
  四川: '西南',
  贵州: '西南',
  云南: '西南',
  西藏: '西南',
  陕西: '西北',
  甘肃: '西北',
  青海: '西北',
  宁夏: '西北',
  新疆: '西北',
};

const aliases = new Map([
  ['北　京', '北京'],
  ['天　津', '天津'],
  ['河　北', '河北'],
  ['山　西', '山西'],
  ['内蒙古', '内蒙古'],
  ['辽　宁', '辽宁'],
  ['吉　林', '吉林'],
  ['黑龙江', '黑龙江'],
  ['上　海', '上海'],
  ['江　苏', '江苏'],
  ['浙　江', '浙江'],
  ['安　徽', '安徽'],
  ['福　建', '福建'],
  ['江　西', '江西'],
  ['山　东', '山东'],
  ['河　南', '河南'],
  ['湖　北', '湖北'],
  ['湖　南', '湖南'],
  ['广　东', '广东'],
  ['广　西', '广西'],
  ['海　南', '海南'],
  ['重　庆', '重庆'],
  ['四　川', '四川'],
  ['贵　州', '贵州'],
  ['云　南', '云南'],
  ['西　藏', '西藏'],
  ['陕　西', '陕西'],
  ['甘　肃', '甘肃'],
  ['青　海', '青海'],
  ['宁　夏', '宁夏'],
  ['新　疆', '新疆'],
]);

const summary = {
  generatedAt: new Date().toISOString(),
  dataVersion: '0.1',
  scope: {
    region: '中国大陆',
    excludes: ['港澳台高校', '军事院校'],
    note: '学校数量采用教育部截至2025年6月20日全国高等学校名单；人数规模采用教育部2024年教育统计数据与2024年全国教育事业发展统计公报。2026年招生计划和录取数据尚在招生季中，本站先建立跟踪表。',
  },
  schoolCounts: {
    totalHigherEducationInstitutions: 3167,
    regularHigherEducationInstitutions: 2919,
    adultHigherEducationInstitutions: 248,
    undergraduateInstitutions: 1365,
    higherVocationalInstitutions: 1554,
  },
  students: {
    totalHigherEducationScale: 48460000,
    regularAndVocationalEnrollment: 38912600,
    regularUndergraduateEnrollment: 20859138,
    vocationalUndergraduateEnrollment: 406835,
    higherVocationalEnrollment: 17646595,
    postgraduateEnrollment: 4095436,
    adultEnrollment: 9425958,
    webBasedEnrollment: 6002718,
  },
  admissions: {
    regularUndergraduateEntrants: 4899652,
    regularUndergraduateEntrantsWan: 489.97,
    vocationalUndergraduateEntrants: 109619,
    higherVocationalEntrants: 5679401,
    postgraduateEntrants: 1356778,
    adultEntrants: 3619101,
    webBasedEntrants: 1499962,
  },
  teachers: {
    higherEducationTeachers: 2163500,
    regularUndergraduateTeachers: 1387600,
    vocationalUndergraduateTeachers: 45300,
    higherVocationalTeachers: 717000,
    adultHigherEducationTeachers: 13500,
  },
};

async function fetchArrayBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }
  return response.arrayBuffer();
}

async function readWorkbookFromUrl(url) {
  const buffer = await fetchArrayBuffer(url);
  return XLSX.read(buffer, { type: 'array' });
}

async function readHtmlRows(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }
  const html = await response.text();
  const workbook = XLSX.read(html, { type: 'string' });
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    header: 1,
    defval: '',
  });
}

function writeJson(name, value) {
  return writeFile(new URL(name, DATA_DIR), `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeProvinceCell(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  const compact = String(value ?? '').replace(/\s+/g, '').replace(/　/g, '').trim();
  if (aliases.has(text.split(' ')[0])) return aliases.get(text.split(' ')[0]);
  for (const province of provinceNames) {
    if (text.includes(province) || compact.includes(province)) return province;
  }
  return null;
}

function parseSchoolListRows(rows, category) {
  const schools = [];
  let province = '';

  for (const row of rows) {
    const first = String(row[0] ?? '').trim();
    const provinceMatch = first.match(/^(.+?)[省市区]?（\d+所）$/);
    if (provinceMatch) {
      province = normalizeProvinceCell(provinceMatch[1]) ?? provinceMatch[1];
      continue;
    }

    if (typeof row[0] !== 'number') continue;
    const name = String(row[1] ?? '').trim();
    if (!name) continue;

    const level = category === 'regular' ? String(row[5] ?? '').trim() : '成人高等教育';
    const city = category === 'regular' ? String(row[4] ?? '').trim() : '';
    const remark = category === 'regular' ? String(row[6] ?? '').trim() : String(row[4] ?? '').trim();
    schools.push({
      id: `${category}-${row[0]}`,
      sourceCategory: category === 'regular' ? '普通高等学校' : '成人高等学校',
      sequence: row[0],
      name,
      code: String(row[2] ?? '').trim(),
      authority: String(row[3] ?? '').trim(),
      province,
      city,
      level,
      type: category === 'regular' ? (level === '本科' ? '本科院校' : '高职（专科）院校') : '成人高校',
      ownership: remark.includes('民办') ? '民办' : '公办/其他',
      note: remark,
    });
  }

  return schools;
}

function parseStudentRows(rows, columns) {
  const output = new Map();
  for (const row of rows) {
    const province = normalizeProvinceCell(row[0]);
    if (!province) continue;
    const record = { province };
    for (const [key, index] of Object.entries(columns)) {
      record[key] = Number(row[index] || 0);
    }
    output.set(province, record);
  }
  return output;
}

function countBy(items, predicate) {
  return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function validate(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const [regularWorkbook, adultWorkbook] = await Promise.all([
    readWorkbookFromUrl(sources.regularSchoolListXls.url),
    readWorkbookFromUrl(sources.adultSchoolListXls.url),
  ]);

  const regularRows = XLSX.utils.sheet_to_json(
    regularWorkbook.Sheets[regularWorkbook.SheetNames[0]],
    { header: 1, defval: '' },
  );
  const adultRows = XLSX.utils.sheet_to_json(adultWorkbook.Sheets[adultWorkbook.SheetNames[0]], {
    header: 1,
    defval: '',
  });

  const schools = [
    ...parseSchoolListRows(regularRows, 'regular'),
    ...parseSchoolListRows(adultRows, 'adult'),
  ];

  validate(schools.length === 3167, `expected 3167 schools, got ${schools.length}`);
  validate(countBy(schools, (school) => school.sourceCategory === '普通高等学校') === 2919, 'regular school total mismatch');
  validate(countBy(schools, (school) => school.sourceCategory === '成人高等学校') === 248, 'adult school total mismatch');
  validate(countBy(schools, (school) => school.level === '本科') === 1365, 'undergraduate school total mismatch');
  validate(countBy(schools, (school) => school.level === '专科') === 1554, 'higher vocational school total mismatch');

  const [undergraduateRows, vocationalRows, postgraduateRows] = await Promise.all([
    readHtmlRows(sources.undergraduateStudents2024.url),
    readHtmlRows(sources.vocationalStudents2024.url),
    readHtmlRows(sources.postgraduateStudents2024.url),
  ]);

  const undergraduateByProvince = parseStudentRows(undergraduateRows, {
    undergraduateEntrants: 4,
    undergraduateEnrollment: 5,
    undergraduateGraduates: 1,
  });
  const vocationalByProvince = parseStudentRows(vocationalRows, {
    vocationalEntrants: 6,
    vocationalEnrollment: 9,
    vocationalGraduates: 1,
  });
  const postgraduateByProvince = parseStudentRows(postgraduateRows, {
    postgraduateEntrants: 6,
    postgraduateEnrollment: 10,
    postgraduateGraduates: 1,
  });

  const provinceRows = provinceNames.map((province) => {
    const provinceSchools = schools.filter((school) => school.province === province);
    const undergraduate = undergraduateByProvince.get(province) ?? {};
    const vocational = vocationalByProvince.get(province) ?? {};
    const postgraduate = postgraduateByProvince.get(province) ?? {};
    const regularEnrollment = Number(undergraduate.undergraduateEnrollment || 0) + Number(vocational.vocationalEnrollment || 0);
    const regularEntrants = Number(undergraduate.undergraduateEntrants || 0) + Number(vocational.vocationalEntrants || 0);
    return {
      province,
      region: regionMap[province],
      schoolCount: provinceSchools.length,
      regularSchoolCount: countBy(provinceSchools, (school) => school.sourceCategory === '普通高等学校'),
      adultSchoolCount: countBy(provinceSchools, (school) => school.sourceCategory === '成人高等学校'),
      undergraduateSchoolCount: countBy(provinceSchools, (school) => school.level === '本科'),
      higherVocationalSchoolCount: countBy(provinceSchools, (school) => school.level === '专科'),
      undergraduateEntrants: Number(undergraduate.undergraduateEntrants || 0),
      undergraduateEnrollment: Number(undergraduate.undergraduateEnrollment || 0),
      vocationalEntrants: Number(vocational.vocationalEntrants || 0),
      vocationalEnrollment: Number(vocational.vocationalEnrollment || 0),
      regularAndVocationalEntrants: regularEntrants,
      regularAndVocationalEnrollment: regularEnrollment,
      postgraduateEntrants: Number(postgraduate.postgraduateEntrants || 0),
      postgraduateEnrollment: Number(postgraduate.postgraduateEnrollment || 0),
      studentsPerSchool: provinceSchools.length ? Math.round(regularEnrollment / provinceSchools.length) : 0,
    };
  });

  validate(sum(provinceRows, 'schoolCount') === 3167, 'province school count does not sum to 3167');
  validate(sum(provinceRows, 'regularSchoolCount') === 2919, 'province regular school count does not sum to 2919');
  validate(sum(provinceRows, 'adultSchoolCount') === 248, 'province adult school count does not sum to 248');

  const admissionsRows = provinceNames.map((province) => ({
    province,
    region: regionMap[province],
    status: '待更新',
    planPublished: false,
    admissionResultPublished: false,
    policySource: '',
    planSource: '',
    resultSource: '',
    note: '2026年省级招生计划和录取数据发布后补录；当前仅保留跟踪位。',
  }));

  await Promise.all([
    writeJson('summary.json', { ...summary, sources: [sources.educationStatBulletin2024, sources.schoolList2025] }),
    writeJson('schools.json', {
      meta: {
        total: schools.length,
        regularTotal: 2919,
        adultTotal: 248,
        undergraduateTotal: 1365,
        higherVocationalTotal: 1554,
        generatedAt: new Date().toISOString(),
        sources: [sources.schoolList2025, sources.regularSchoolListXls, sources.adultSchoolListXls],
      },
      rows: schools,
    }),
    writeJson('province-stats.json', {
      meta: {
        generatedAt: new Date().toISOString(),
        schoolCountSource: '2025-06-20全国高等学校名单',
        studentSource: '2024年教育统计数据各地基本情况',
        sources: [
          sources.schoolList2025,
          sources.undergraduateStudents2024,
          sources.vocationalStudents2024,
          sources.postgraduateStudents2024,
        ],
      },
      rows: provinceRows,
    }),
    writeJson('admissions-2026.json', {
      meta: {
        generatedAt: new Date().toISOString(),
        status: 'tracking-skeleton',
        source: sources.admissionsNotice2026,
      },
      rows: admissionsRows,
    }),
    writeJson('sources.json', sources),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
