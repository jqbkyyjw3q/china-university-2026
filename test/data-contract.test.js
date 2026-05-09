import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

test('official baseline summary has the required national counts', async () => {
  const summary = await readJson('../public/data/summary.json');

  assert.equal(summary.scope.region, '中国大陆');
  assert.equal(summary.scope.excludes.includes('港澳台高校'), true);
  assert.equal(summary.schoolCounts.totalHigherEducationInstitutions, 3167);
  assert.equal(summary.schoolCounts.regularHigherEducationInstitutions, 2919);
  assert.equal(summary.schoolCounts.adultHigherEducationInstitutions, 248);
  assert.equal(summary.schoolCounts.undergraduateInstitutions, 1365);
  assert.equal(summary.schoolCounts.higherVocationalInstitutions, 1554);
  assert.equal(summary.students.totalHigherEducationScale, 48460000);
  assert.equal(summary.students.regularAndVocationalEnrollment, 38912600);
  assert.equal(summary.admissions.regularUndergraduateEntrants, 4899652);
  assert.equal(summary.admissions.vocationalUndergraduateEntrants, 109619);
  assert.equal(summary.admissions.higherVocationalEntrants, 5679401);
  assert.equal(summary.admissions.postgraduateEntrants, 1356778);
});

test('school database contains the official school-list totals and source metadata', async () => {
  const schools = await readJson('../public/data/schools.json');

  assert.equal(schools.meta.total, 3167);
  assert.equal(schools.meta.regularTotal, 2919);
  assert.equal(schools.meta.adultTotal, 248);
  assert.equal(schools.rows.length, 3167);
  assert.equal(schools.rows.some((school) => school.province === '北京'), true);
  assert.equal(schools.rows.every((school) => school.name && school.province && school.type), true);
});

test('province stats and 2026 admissions tracker cover every provincial unit', async () => {
  const provinceStats = await readJson('../public/data/province-stats.json');
  const admissions = await readJson('../public/data/admissions-2026.json');

  assert.equal(provinceStats.rows.length, 31);
  assert.equal(admissions.rows.length, 31);
  assert.equal(provinceStats.rows.reduce((sum, row) => sum + row.schoolCount, 0), 3167);
  assert.equal(
    provinceStats.rows.reduce((sum, row) => sum + row.regularAndVocationalEnrollment, 0),
    38912568,
  );
  assert.equal(provinceStats.rows.find((row) => row.province === '河南').regularAndVocationalEnrollment > 0, true);
  assert.equal(admissions.rows.every((row) => row.status === '待更新'), true);
});

test('ten-year trends cover undergraduate, master and doctor entrants and graduates', async () => {
  const trends = await readJson('../public/data/trends-10y.json');

  assert.equal(trends.meta.yearRange, '2015-2024');
  assert.deepEqual(
    trends.rows.map((row) => row.year),
    [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  );
  for (const row of trends.rows) {
    assert.equal(row.undergraduateEntrants > 0, true);
    assert.equal(row.undergraduateGraduates > 0, true);
    assert.equal(row.masterEntrants > 0, true);
    assert.equal(row.masterGraduates > 0, true);
    assert.equal(row.doctorEntrants > 0, true);
    assert.equal(row.doctorGraduates > 0, true);
  }

  const latest = trends.rows.at(-1);
  assert.equal(latest.undergraduateEntrants, 4899652);
  assert.equal(latest.undergraduateGraduates, 5119577);
  assert.equal(latest.masterEntrants, 1185664);
  assert.equal(latest.masterGraduates, 986410);
  assert.equal(latest.doctorEntrants, 171114);
  assert.equal(latest.doctorGraduates, 97185);
});

test('major estimates scale official discipline shares to the current undergraduate population', async () => {
  const majors = await readJson('../public/data/major-estimates.json');

  assert.equal(majors.meta.method.includes('2022年普通本科分学科门类学生数'), true);
  assert.equal(majors.rows.length, 12);
  assert.equal(majors.rows[0].category, '工学');
  assert.equal(majors.rows.every((row) => row.estimatedStudents > 0 && row.share > 0), true);
  assert.equal(
    majors.rows.reduce((total, row) => total + row.estimatedStudents, 0),
    20859138,
  );
});
