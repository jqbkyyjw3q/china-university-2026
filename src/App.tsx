import { BarChart3, Database, GraduationCap, MapPinned, Search, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import summary from '../public/data/summary.json';
import provinceStats from '../public/data/province-stats.json';
import schools from '../public/data/schools.json';
import admissions from '../public/data/admissions-2026.json';
import trends from '../public/data/trends-10y.json';
import majorEstimates from '../public/data/major-estimates.json';

type ProvinceRow = (typeof provinceStats.rows)[number];
type SchoolRow = (typeof schools.rows)[number];
type TrendRow = (typeof trends.rows)[number];
type TrendMetricKey = Exclude<keyof TrendRow, 'year'>;

const chartColors = {
  entrants: '#286f9f',
  graduates: '#a4483f',
};

const formatter = new Intl.NumberFormat('zh-CN');

function wan(value: number, digits = 1) {
  return `${(value / 10000).toFixed(digits)}万`;
}

function percent(value: number, total: number) {
  return `${((value / total) * 100).toFixed(1)}%`;
}

const topSchoolProvinces = [...provinceStats.rows].sort((a, b) => b.schoolCount - a.schoolCount).slice(0, 8);
const topStudentProvinces = [...provinceStats.rows]
  .sort((a, b) => b.regularAndVocationalEnrollment - a.regularAndVocationalEnrollment)
  .slice(0, 8);

const regionSummary = Object.values(
  provinceStats.rows.reduce<Record<string, { region: string; schoolCount: number; enrollment: number; entrants: number }>>(
    (acc, row) => {
      acc[row.region] ??= { region: row.region, schoolCount: 0, enrollment: 0, entrants: 0 };
      acc[row.region].schoolCount += row.schoolCount;
      acc[row.region].enrollment += row.regularAndVocationalEnrollment;
      acc[row.region].entrants += row.regularAndVocationalEntrants;
      return acc;
    },
    {},
  ),
).sort((a, b) => b.schoolCount - a.schoolCount);
const latestTrendSource = trends.meta.sources.find((source) => source.year === 2024) ?? trends.meta.sources.at(-1);

function growth(first: number, last: number) {
  return `${(((last - first) / first) * 100).toFixed(1)}%`;
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="metric">
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function BarList({
  rows,
  valueKey,
  format,
}: {
  rows: ProvinceRow[];
  valueKey: keyof ProvinceRow;
  format: (value: number) => string;
}) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey])));
  return (
    <div className="bar-list">
      {rows.map((row) => {
        const value = Number(row[valueKey]);
        return (
          <div className="bar-row" key={`${row.province}-${String(valueKey)}`}>
            <span>{row.province}</span>
            <div className="bar-track">
              <div style={{ width: `${(value / max) * 100}%` }} />
            </div>
            <strong>{format(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function linePath(rows: TrendRow[], key: TrendMetricKey, max: number) {
  return rows
    .map((row, index) => {
      const x = 38 + index * (340 / (rows.length - 1));
      const y = 152 - (Number(row[key]) / max) * 112;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function LinePanel({
  title,
  entrantKey,
  graduateKey,
}: {
  title: string;
  entrantKey: TrendMetricKey;
  graduateKey: TrendMetricKey;
}) {
  const max = Math.max(...trends.rows.flatMap((row) => [Number(row[entrantKey]), Number(row[graduateKey])])) * 1.08;
  const latest = trends.rows.at(-1);
  return (
    <div className="line-panel">
      <div className="line-head">
        <h3>{title}</h3>
        <span>{latest ? `${wan(Number(latest[entrantKey]))} / ${wan(Number(latest[graduateKey]))}` : ''}</span>
      </div>
      <svg className="trend-chart" viewBox="0 0 410 178" role="img" aria-label={`${title}最近10年入学与毕业趋势`}>
        <line x1="38" y1="40" x2="378" y2="40" />
        <line x1="38" y1="96" x2="378" y2="96" />
        <line x1="38" y1="152" x2="378" y2="152" />
        <text x="8" y="43">{wan(max, 0)}</text>
        <text x="24" y="156">0</text>
        <text x="38" y="172">{trends.rows[0].year}</text>
        <text x="344" y="172">{trends.rows.at(-1)?.year}</text>
        <path d={linePath(trends.rows as TrendRow[], entrantKey, max)} style={{ stroke: chartColors.entrants }} />
        <path d={linePath(trends.rows as TrendRow[], graduateKey, max)} style={{ stroke: chartColors.graduates }} />
        {trends.rows.map((row, index) => {
          const x = 38 + index * (340 / (trends.rows.length - 1));
          const y = 152 - (Number(row[entrantKey]) / max) * 112;
          return <circle key={`${title}-${row.year}-entrant`} cx={x} cy={y} r={2.5} style={{ fill: chartColors.entrants }} />;
        })}
        {trends.rows.map((row, index) => {
          const x = 38 + index * (340 / (trends.rows.length - 1));
          const y = 152 - (Number(row[graduateKey]) / max) * 112;
          return <circle key={`${title}-${row.year}-graduate`} cx={x} cy={y} r={2.5} style={{ fill: chartColors.graduates }} />;
        })}
      </svg>
      <div className="chart-legend">
        <span>
          <i style={{ background: chartColors.entrants }} />
          入学
        </span>
        <span>
          <i style={{ background: chartColors.graduates }} />
          毕业
        </span>
      </div>
    </div>
  );
}

function TrendSection() {
  const first = trends.rows[0];
  const latest = trends.rows.at(-1) ?? first;
  return (
    <section className="band" id="trends">
      <div className="section-heading">
        <div>
          <p>最近10年</p>
          <h2>本科、硕士、博士入学与毕业</h2>
        </div>
        <span>{trends.meta.note}</span>
      </div>
      <div className="trend-grid">
        <LinePanel title="本科入学 / 本科毕业" entrantKey="undergraduateEntrants" graduateKey="undergraduateGraduates" />
        <LinePanel title="硕士入学 / 硕士毕业" entrantKey="masterEntrants" graduateKey="masterGraduates" />
        <LinePanel title="博士入学 / 博士毕业" entrantKey="doctorEntrants" graduateKey="doctorGraduates" />
      </div>
      <div className="trend-summary">
        <div>
          <span>2024 本科入学</span>
          <strong>{wan(latest.undergraduateEntrants)}</strong>
          <small>较2015年 {growth(first.undergraduateEntrants, latest.undergraduateEntrants)}</small>
        </div>
        <div>
          <span>2024 硕士毕业</span>
          <strong>{wan(latest.masterGraduates)}</strong>
          <small>较2015年 {growth(first.masterGraduates, latest.masterGraduates)}</small>
        </div>
        <div>
          <span>2024 博士入学</span>
          <strong>{wan(latest.doctorEntrants)}</strong>
          <small>较2015年 {growth(first.doctorEntrants, latest.doctorEntrants)}</small>
        </div>
      </div>
    </section>
  );
}

function MajorSection() {
  const max = Math.max(...majorEstimates.rows.map((row) => row.estimatedStudents));
  return (
    <section className="band" id="majors">
      <div className="section-heading">
        <div>
          <p>专业结构</p>
          <h2>专业大致人数</h2>
        </div>
        <span>{majorEstimates.meta.method}</span>
      </div>
      <div className="major-layout">
        <div className="panel">
          <h3>普通本科专业大类估算</h3>
          <div className="major-list">
            {majorEstimates.rows.map((row) => (
              <div className="major-row" key={row.category}>
                <span>{row.category}</span>
                <div className="major-track">
                  <div style={{ width: `${(row.estimatedStudents / max) * 100}%` }} />
                </div>
                <strong>{wan(row.estimatedStudents)}</strong>
                <small>{(row.share * 100).toFixed(1)}%</small>
              </div>
            ))}
          </div>
        </div>
        <div className="panel method-panel">
          <h3>口径</h3>
          <dl className="facts single">
            <div>
              <dt>估算目标</dt>
              <dd>{wan(majorEstimates.meta.targetUndergraduateEnrollment)}</dd>
            </div>
            <div>
              <dt>结构来源</dt>
              <dd>{majorEstimates.meta.basisYear} 年</dd>
            </div>
            <div>
              <dt>最大类</dt>
              <dd>{majorEstimates.rows[0].category}</dd>
            </div>
          </dl>
          <p className="source-note">“专业”在这里按教育部学科门类/专业大类展示；逐个本科专业的在校人数尚无同口径全国公开表。</p>
        </div>
      </div>
    </section>
  );
}

function ProvinceMap() {
  const max = Math.max(...provinceStats.rows.map((row) => row.schoolCount));
  return (
    <div className="province-map" aria-label="省份高校数量地图">
      {provinceStats.rows.map((row) => {
        const level = Math.max(1, Math.ceil((row.schoolCount / max) * 5));
        return (
          <div className={`province-tile level-${level}`} key={row.province} title={`${row.province}: ${row.schoolCount}所`}>
            <span>{row.province}</span>
            <strong>{row.schoolCount}</strong>
          </div>
        );
      })}
    </div>
  );
}

function SchoolDatabase() {
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('全部');
  const [level, setLevel] = useState('全部');

  const provinces = useMemo(() => ['全部', ...provinceStats.rows.map((row) => row.province)], []);
  const filtered = useMemo(() => {
    return (schools.rows as SchoolRow[])
      .filter((school) => province === '全部' || school.province === province)
      .filter((school) => level === '全部' || school.level === level)
      .filter((school) => {
        const keyword = query.trim();
        if (!keyword) return true;
        return `${school.name}${school.province}${school.city}${school.authority}${school.type}`.includes(keyword);
      })
      .slice(0, 80);
  }, [level, province, query]);

  return (
    <section className="band" id="schools">
      <div className="section-heading">
        <div>
          <p>学校级数据库</p>
          <h2>3167 所高校清单</h2>
        </div>
        <span>当前展示前 80 条，可按省份、层次、关键词筛选</span>
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索学校、城市、主管部门" />
        </label>
        <select value={province} onChange={(event) => setProvince(event.target.value)} aria-label="省份">
          {provinces.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="层次">
          {['全部', '本科', '专科', '成人高等教育'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>学校</th>
              <th>省份</th>
              <th>所在地</th>
              <th>层次</th>
              <th>类型</th>
              <th>主管部门</th>
              <th>属性</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((school) => (
              <tr key={school.id}>
                <td>{school.name}</td>
                <td>{school.province}</td>
                <td>{school.city || '-'}</td>
                <td>{school.level}</td>
                <td>{school.type}</td>
                <td>{school.authority}</td>
                <td>{school.ownership}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function App() {
  return (
    <main>
      <header className="topbar">
        <a href="#overview">中国大学 2026 调研</a>
        <nav>
          <a href="#province">省份分布</a>
          <a href="#trends">十年趋势</a>
          <a href="#majors">专业结构</a>
          <a href="#schools">学校库</a>
          <a href="#admissions">招生跟踪</a>
          <a href="#conclusion">结论</a>
        </nav>
      </header>

      <section className="hero" id="overview">
        <div className="hero-copy">
          <p>官方基准表 · 中国大陆高等教育</p>
          <h1>中国大学 2026 调研</h1>
          <div className="scope">
            <span>学校数：教育部截至 2025-06-20 名单</span>
            <span>人数：教育部 2024 教育统计数据</span>
            <span>2026：招生计划与录取数据持续跟踪</span>
          </div>
        </div>
        <div className="metrics">
          <Metric
            icon={GraduationCap}
            label="高等学校"
            value="3167 所"
            detail={`${summary.schoolCounts.regularHigherEducationInstitutions} 所普通高校，${summary.schoolCounts.adultHigherEducationInstitutions} 所成人高校`}
          />
          <Metric
            icon={Database}
            label="本专科在校生"
            value={wan(summary.students.regularAndVocationalEnrollment)}
            detail={`普通本科 ${wan(summary.students.regularUndergraduateEnrollment)}，高职专科 ${wan(summary.students.higherVocationalEnrollment)}`}
          />
          <Metric
            icon={TrendingUp}
            label="普通本科招生"
            value="489.97 万"
            detail={`职业本科 ${wan(summary.admissions.vocationalUndergraduateEntrants)}，高职专科 ${wan(summary.admissions.higherVocationalEntrants)}`}
          />
          <Metric
            icon={BarChart3}
            label="研究生招生"
            value={wan(summary.admissions.postgraduateEntrants)}
            detail={`在学研究生 ${wan(summary.students.postgraduateEnrollment)}，博士 ${wan(676262)}`}
          />
        </div>
      </section>

      <section className="band compact">
        <div className="section-heading">
          <div>
            <p>第 1 步</p>
            <h2>多少所、多少人</h2>
          </div>
          <span>{summary.scope.note}</span>
        </div>
        <div className="split">
          <div className="panel">
            <h3>结构拆分</h3>
            <div className="stack-bars">
              <div>
                <span>本科院校</span>
                <strong>{summary.schoolCounts.undergraduateInstitutions}</strong>
                <i style={{ width: percent(summary.schoolCounts.undergraduateInstitutions, summary.schoolCounts.totalHigherEducationInstitutions) }} />
              </div>
              <div>
                <span>高职专科</span>
                <strong>{summary.schoolCounts.higherVocationalInstitutions}</strong>
                <i style={{ width: percent(summary.schoolCounts.higherVocationalInstitutions, summary.schoolCounts.totalHigherEducationInstitutions) }} />
              </div>
              <div>
                <span>成人高校</span>
                <strong>{summary.schoolCounts.adultHigherEducationInstitutions}</strong>
                <i style={{ width: percent(summary.schoolCounts.adultHigherEducationInstitutions, summary.schoolCounts.totalHigherEducationInstitutions) }} />
              </div>
            </div>
          </div>
          <div className="panel">
            <h3>人数规模</h3>
            <dl className="facts">
              <div>
                <dt>高等教育在学总规模</dt>
                <dd>{wan(summary.students.totalHigherEducationScale)}</dd>
              </div>
              <div>
                <dt>普通、职业本专科在校生</dt>
                <dd>{wan(summary.students.regularAndVocationalEnrollment)}</dd>
              </div>
              <div>
                <dt>普通、职业本专科毕业生</dt>
                <dd>1059.38万</dd>
              </div>
              <div>
                <dt>高等教育专任教师</dt>
                <dd>{wan(summary.teachers.higherEducationTeachers)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <TrendSection />

      <MajorSection />

      <section className="band" id="province">
        <div className="section-heading">
          <div>
            <p>第 1 步 · 省份分布</p>
            <h2>地域分布地图与排行</h2>
          </div>
          <span>地图色阶按 2025 学校数量，排行按学校数和本专科在校生分别排序。</span>
        </div>
        <ProvinceMap />
        <div className="split">
          <div className="panel">
            <h3>高校数量 Top 8</h3>
            <BarList rows={topSchoolProvinces} valueKey="schoolCount" format={(value) => `${value}所`} />
          </div>
          <div className="panel">
            <h3>本专科在校生 Top 8</h3>
            <BarList rows={topStudentProvinces} valueKey="regularAndVocationalEnrollment" format={(value) => wan(value)} />
          </div>
        </div>
      </section>

      <SchoolDatabase />

      <section className="band" id="admissions">
        <div className="section-heading">
          <div>
            <p>第 3 步</p>
            <h2>2026 招生跟踪</h2>
          </div>
          <span>目前 31 个省级单位已建跟踪位，状态默认“待更新”。</span>
        </div>
        <div className="tracker-grid">
          {admissions.rows.map((row) => (
            <div className="tracker" key={row.province}>
              <strong>{row.province}</strong>
              <span>{row.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="band" id="conclusion">
        <div className="section-heading">
          <div>
            <p>第 4 步</p>
            <h2>图表、地图和结论</h2>
          </div>
          <span>结论基于当前官方基准表，2026 录取数据发布后会更新。</span>
        </div>
        <div className="insights">
          <article>
            <MapPinned size={22} />
            <h3>高校资源集中在东中部人口大省</h3>
            <p>河南、江苏、广东、山东位居学校数量前列，省级学校库能支撑后续按城市和学校层次继续拆解。</p>
          </article>
          <article>
            <Database size={22} />
            <h3>学校库已经覆盖普通与成人高校</h3>
            <p>3167 条学校记录来自教育部 XLS 名单，字段包含省份、所在地、层次、类型、主管部门和属性。</p>
          </article>
          <article>
            <TrendingUp size={22} />
            <h3>2026 需要持续追踪计划与实际录取</h3>
            <p>当前能确定中央招生工作通知，省级招生计划和最终录取人数需要按考试院发布节奏补齐。</p>
          </article>
        </div>
        <div className="region-table">
          <h3>区域汇总</h3>
          <table>
            <thead>
              <tr>
                <th>区域</th>
                <th>高校数</th>
                <th>本专科招生</th>
                <th>本专科在校生</th>
              </tr>
            </thead>
            <tbody>
              {regionSummary.map((row) => (
                <tr key={row.region}>
                  <td>{row.region}</td>
                  <td>{row.schoolCount}</td>
                  <td>{wan(row.entrants)}</td>
                  <td>{wan(row.enrollment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer>
        <strong>数据来源</strong>
        <a href={summary.sources[0].url}>教育部《2024年全国教育事业发展统计公报》</a>
        <a href={summary.sources[1].url}>教育部《全国高等学校名单》</a>
        {latestTrendSource ? <a href={latestTrendSource.undergraduateUrl}>教育部《高等教育普通本科学生数》</a> : null}
        {latestTrendSource ? <a href={latestTrendSource.postgraduateUrl}>教育部《高等学校（机构）研究生数》</a> : null}
        <a href={majorEstimates.meta.source.url}>教育部《普通本科分学科门类学生数》</a>
        <a href="https://www.moe.gov.cn/srcsite/A15/moe_776/s3258/202601/t20260121_1427110.html">
          教育部关于做好2026年普通高校招生工作的通知
        </a>
      </footer>
    </main>
  );
}

export default App;
