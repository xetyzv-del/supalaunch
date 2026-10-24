import type {
  BroadcastClass,
  MainsQuestion,
  Quiz,
  QuizQuestion,
  ResourceItem,
  SyllabusPaper,
  SyllabusSubtopic,
  TopicOfDay,
} from '../types/index.ts';
import { istISO, todayIST } from '../lib/format.ts';
import { SEED_INFOGRAPHICS } from './infographics.ts';

export type SeedSyllabusPaper = Omit<SyllabusPaper, 'subtopics'> & {
  subtopics: Omit<SyllabusSubtopic, 'completed'>[];
};

export interface SeedBundle {
  topic: TopicOfDay;
  topics: TopicOfDay[];
  quizQuestions: QuizQuestion[];
  quizzes: Quiz[];
  mainsQuestion: MainsQuestion;
  mainsQuestions: MainsQuestion[];
  syllabus: SeedSyllabusPaper[];
  resources: ResourceItem[];
  broadcasts: BroadcastClass[];
}

function shiftDate(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function buildSeed(today: string = todayIST()): SeedBundle {
  const at = (offsetDays: number, hhmm: string) => istISO(today, offsetDays, hhmm);

  const topics: TopicOfDay[] = [
    {
      id: 'topic-1',
      title: 'Central Bank Digital Currency (e-Rupee) & Cross-Border Sovereign Settlements',
      category: 'Macroeconomics & Monetary Policy',
      source: 'RBI Bulletin & Economic Survey Synthesis',
      publishDate: today,
      readTimeMinutes: 6,
      gsPaper: 'GS-3',
      summaryBullets: [
        'RBI expands wholesale e-Rupee pilot (CBDC-W) to bilateral trade settlements with ASEAN and GCC corridors, reducing foreign exchange settlement latency.',
        'Statutory backing derives from the amended Reserve Bank of India Act, 1934 — Section 2(aiv) explicitly includes digital form within the definition of "bank note".',
        'Programmable retail CBDC tokens enable end-use-restricted agricultural and clean-energy subsidies without commercial intermediary leakages.',
        'Core monetary trade-off: calibrating non-interest-bearing wallet caps to prevent commercial bank CASA deposit disintermediation during credit stress.',
      ],
      keyArticlesOrData: [
        { label: 'Statutory Anchor', value: 'RBI Act 1934 · Sec 2(aiv) & Sec 22' },
        { label: 'Cross-Border Bridge', value: 'BIS Project mBridge & Nexus Protocols' },
        { label: 'Settlement Finality', value: 'T+0 Instant Wholesale Clearing' },
        { label: 'Syllabus Mapping', value: 'GS-3 · Indian Economy & Mobilization' },
      ],
      mindmapNodes: [
        {
          title: 'Structural Architecture',
          color: 'slate',
          items: [
            'Two-tier tokenized retail model (RBI issues, banks distribute)',
            'Wholesale interbank clearing (CBDC-W) for G-Sec settlement',
            'Offline NFC smart-card & feature-phone interoperability',
          ],
        },
        {
          title: 'Macroeconomic Gains',
          color: 'emerald',
          items: [
            'Reduction in physical currency printing & logistics cost',
            'Programmable Direct Benefit Transfers (DBT 2.0)',
            'De-risking from unilateral cross-border messaging bottlenecks',
          ],
        },
        {
          title: 'Prudential Risks',
          color: 'amber',
          items: [
            'Deposit flight risk from commercial banks during downturns',
            'Cyber resilience and post-quantum cryptographic transition',
            'Balancing small-value anonymity with PMLA compliance',
          ],
        },
        {
          title: 'Policy Way Forward',
          color: 'rose',
          items: [
            'Tiered holding ceilings with zero remuneration on retail wallets',
            'Bilateral central bank liquidity swap integration',
            'Statutory privacy guardrails aligned with DPDP Act 2023',
          ],
        },
      ],
      pdfBriefName: 'CivilEdge_Crux_CBDC_Sovereign_Settlements.md',
      infographics: SEED_INFOGRAPHICS['topic-1'],
    },
    {
      id: 'topic-2',
      title: '16th Finance Commission, Horizontal Devolution & Demographic Performance Equity',
      category: 'Constitutional Polity & Fiscal Federalism',
      source: 'Constitutional Provisions & PRS Legislative Brief',
      publishDate: shiftDate(today, -1),
      readTimeMinutes: 7,
      gsPaper: 'GS-2',
      summaryBullets: [
        'Constituted under Article 280(1), the 16th Finance Commission recalibrates vertical and horizontal tax devolution for the 2026–2031 award cycle.',
        'Southern and western states highlight the tension between 2011 Census population weights and fiscal rewards for early fertility stabilization (TFR < 2.0).',
        'Rising share of non-divisible cesses and surcharges under Article 271 shrinks the net divisible pool shared with States.',
        'Disaster risk financing and municipal property-tax reforms under Article 280(3)(bb)/(c) emerge as critical third-tier fiscal anchors.',
      ],
      keyArticlesOrData: [
        { label: 'Constitutional Basis', value: 'Article 280 & Article 270' },
        { label: '15th FC Vertical Share', value: '41% of Divisible Pool' },
        { label: 'Demographic Weight', value: '12.5% (15th FC Formula)' },
        { label: 'Syllabus Mapping', value: 'GS-2 · Functions & Responsibilities of the Union and States' },
      ],
      mindmapNodes: [
        {
          title: 'Constitutional Mandate',
          color: 'slate',
          items: [
            'Quasi-judicial status under Art. 280(1)',
            'Net proceeds distribution under Art. 270',
            'Grants-in-aid principles under Art. 275',
          ],
        },
        {
          title: 'Devolution Dilemmas',
          color: 'amber',
          items: [
            'Population (2011) vs demographic performance (TFR)',
            'Income distance formula disincentivizing high-GSDP states',
            'Shrinking divisible pool via Art. 271 cesses & surcharges',
          ],
        },
        {
          title: 'Reform Proposals',
          color: 'emerald',
          items: [
            'Capping cesses at 10% of Gross Tax Revenue',
            'Incentivizing capital capex over recurring revenue deficits',
            'Strengthening State Finance Commissions under Art. 243-I',
          ],
        },
        {
          title: 'Mains Way Forward',
          color: 'rose',
          items: [
            'Cooperative federalism through permanent Inter-State Council secretariat',
            'Predictable disaster mitigation funding (NDMF / SDMF)',
            'Performance grants tied to municipal property tax rationalization',
          ],
        },
      ],
      pdfBriefName: 'CivilEdge_Crux_16th_Finance_Commission.md',
      infographics: SEED_INFOGRAPHICS['topic-2'],
    },
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 'qq-1',
      subject: 'Polity & Governance',
      topic: 'Constitutional Bodies & Fiscal Federalism',
      gsPaper: 'GS-2',
      questionEn: 'With reference to the Finance Commission of India, consider the following statements:',
      questionHi: 'भारत के वित्त आयोग के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:',
      statementsEn: [
        'The Commission is constituted by the President under Article 280 of the Constitution at the expiration of every fifth year or earlier.',
        'The recommendations made by the Finance Commission regarding the distribution of tax revenues are binding upon the Union Government.',
        'The qualifications of members and the manner of their selection are determined by Parliament by law.',
      ],
      statementsHi: [
        'आयोग का गठन राष्ट्रपति द्वारा संविधान के अनुच्छेद 280 के तहत प्रत्येक पांचवें वर्ष की समाप्ति पर या उससे पहले किया जाता है।',
        'कर राजस्व के वितरण के संबंध में वित्त आयोग द्वारा की गई सिफारिशें केंद्र सरकार के लिए बाध्यकारी हैं।',
        'सदस्यों की योग्यताएं और उनके चयन का तरीका संसद द्वारा कानून द्वारा निर्धारित किया जाता है।',
      ],
      optionsEn: ['1 and 2 only', '1 and 3 only', '2 and 3 only', '1, 2 and 3'],
      optionsHi: ['केवल 1 और 2', 'केवल 1 और 3', 'केवल 2 और 3', '1, 2 और 3'],
      correctIndex: 1,
      explanationEn:
        'Statement 1 is correct (Art. 280(1)). Statement 2 is incorrect: Recommendations are advisory in nature and not legally binding, though by constitutional convention governments accept tax-sharing recommendations. Statement 3 is correct (Art. 280(2) & Finance Commission (Miscellaneous Provisions) Act, 1951).',
      explanationHi:
        'कथन 1 सही है (अनुच्छेद 280(1))। कथन 2 गलत है: सिफारिशें केवल सलाहकारी प्रकृति की होती हैं और बाध्यकारी नहीं हैं। कथन 3 सही है (अनुच्छेद 280(2) और वित्त आयोग अधिनियम, 1951)।',
      sourceBook: 'Indian Polity — M. Laxmikanth (Chapter: Finance Commission)',
    },
    {
      id: 'qq-2',
      subject: 'Indian Economy',
      topic: 'Monetary Policy & Digital Currency',
      gsPaper: 'GS-3',
      questionEn: 'Consider the following statements regarding the Central Bank Digital Currency (CBDC / e-Rupee) issued by the Reserve Bank of India:',
      questionHi: 'भारतीय रिजर्व बैंक द्वारा जारी केंद्रीय बैंक डिजिटल मुद्रा (CBDC / ई-रुपया) के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:',
      statementsEn: [
        'It is a direct legal tender liability of the Reserve Bank of India appearing on its sovereign balance sheet.',
        'Retail CBDC (CBDC-R) balances held in individual digital wallets earn overnight interest at the RBI Reverse Repo rate.',
        'The Reserve Bank of India Act, 1934 was amended in 2022 to include digital currency within the definition of "bank note".',
      ],
      statementsHi: [
        'यह भारतीय रिजर्व बैंक की प्रत्यक्ष कानूनी देयता है जो उसके संप्रभु बैलेंस शीट पर दिखाई देती है।',
        'व्यक्तिगत डिजिटल वॉलेट में रखी गई खुदरा सीबीडीसी (CBDC-R) शेष राशि पर आरबीआई रिवर्स रेपो दर पर रातोंरात ब्याज मिलता है।',
        'भारतीय रिजर्व बैंक अधिनियम, 1934 में 2022 में संशोधन कर डिजिटल मुद्रा को "बैंक नोट" की परिभाषा में शामिल किया गया था।',
      ],
      optionsEn: ['1 and 2 only', '1 and 3 only', '2 and 3 only', '1, 2 and 3'],
      optionsHi: ['केवल 1 और 2', 'केवल 1 और 3', 'केवल 2 और 3', '1, 2 और 3'],
      correctIndex: 1,
      explanationEn:
        'Statement 1 is correct (sovereign currency liability of RBI). Statement 2 is incorrect: CBDC is non-interest bearing by design to prevent commercial bank deposit disintermediation. Statement 3 is correct (Finance Act 2022 amended Section 2(aiv) of RBI Act, 1934).',
      explanationHi:
        'कथन 1 सही है (आरबीआई की संप्रभु देयता)। कथन 2 गलत है: सीबीडीसी गैर-ब्याज वाली मुद्रा है ताकि वाणिज्यिक बैंकों के जमा आधार को नुकसान न पहुंचे। कथन 3 सही है (वित्त अधिनियम 2022 द्वारा आरबीआई अधिनियम की धारा 2(aiv) में संशोधन)।',
      sourceBook: 'RBI Report on Currency and Finance & Economic Survey',
    },
  ];

  const quizzes: Quiz[] = [
    {
      id: 'quiz-1',
      title: 'Full-Pattern Prelims General Studies Mock Test (2026)',
      gsPaper: 'GS-1',
      subject: 'Comprehensive General Studies',
      testType: 'mock_test',
      durationMinutes: 120,
      questionIds: ['qq-1', 'qq-2'],
      isPublished: true,
      createdAt: shiftDate(today, -3),
    },
    {
      id: 'quiz-2',
      title: 'Polity & Economy Core Concepts Drill',
      gsPaper: 'GS-2',
      subject: 'Polity & Governance',
      testType: 'mcq_drill',
      durationMinutes: 20,
      questionIds: ['qq-1', 'qq-2'],
      isPublished: true,
      createdAt: shiftDate(today, -1),
    },
  ];

  const mainsQuestions: MainsQuestion[] = [
    {
      id: 'mains-1',
      title: 'Federal Fiscal Dynamics & 16th Finance Commission',
      gsPaper: 'GS-2',
      subject: 'Polity & Federal Governance',
      marks: 15,
      wordLimit: 250,
      prompt:
        'Examine the emerging fault lines in Indian fiscal federalism. In this context, discuss how the 16th Finance Commission can reconcile horizontal equity with economic efficiency and demographic transition performance. (250 words / 15 Marks)',
      suggestedTimeMin: 11,
      framework: {
        intro:
          'Define the constitutional role of the Finance Commission under Article 280 as a balancing wheel of Indian fiscal federalism. Cite the constitution of the 16th Finance Commission for the 2026–2031 award cycle.',
        dimensions: [
          {
            title: 'Vertical Fiscal Imbalance & Cesses',
            points: [
              'Article 270 divisible pool shrinkage due to Article 271 cesses/surcharges',
              'Rising reliance of States on conditional Centrally Sponsored Schemes (CSS)',
            ],
          },
          {
            title: 'Horizontal Equity vs Demographic Performance',
            points: [
              'Tension between 2011 Census population share and early fertility decline (TFR < 2.1)',
              'Income distance criteria vs rewarding high GSDP mobilization',
            ],
          },
        ],
        statutoryOrDataRefs: [
          'Article 280, Article 270, Article 271',
          '15th FC 41% vertical share',
          'Punchhi Commission recommendations on cesses',
        ],
        wayForward: [
          'Introduce a constitutional cap on non-divisible cesses and surcharges',
          'Refine demographic performance index without penalizing lower-fertility states',
          'Strengthen local bodies through predictable Article 280(3)(bb)/(c) tied grants',
        ],
        conclusion:
          'Conclude with the vision of collaborative fiscal federalism to sustain India’s 2047 Viksit Bharat economic transition.',
      },
      modelAnswerSnippet:
        'A competitive Mains answer begins by citing Article 280(1), highlights the structural growth of cesses under Article 271 (exceeding ~18% of gross tax revenue), dissects the 2011 Census vs TFR equity trade-off, and concludes with Punchhi Commission suggestions to limit cesses and empower State Finance Commissions.',
      publishDate: today,
    },
  ];

  const syllabus: SeedSyllabusPaper[] = [
    {
      paper: 'GS-1',
      title: 'Heritage, Culture, History & Geography of the World & Society',
      subtopics: [
        { id: 'gs1-1', name: 'Indian Culture: Art Forms, Literature & Architecture from Ancient to Modern Times', importance: 'High Priority' },
        { id: 'gs1-2', name: 'Modern Indian History from middle of 18th Century to Present: Significant Events, Personalities & Issues', importance: 'Core Standard' },
        { id: 'gs1-3', name: 'Salient Features of World Physical Geography & Geophysical Phenomena (Earthquakes, Tsunami, Volcanoes)', importance: 'Frequent PYQs' },
      ],
    },
    {
      paper: 'GS-2',
      title: 'Governance, Constitution, Polity, Social Justice & International Relations',
      subtopics: [
        { id: 'gs2-1', name: 'Indian Constitution: Historical Underpinnings, Evolution, Features, Amendments & Basic Structure', importance: 'High Priority' },
        { id: 'gs2-2', name: 'Functions & Responsibilities of the Union and States: Federal Issues & Devolution to Local Levels', importance: 'High Priority' },
        { id: 'gs2-3', name: 'Statutory, Regulatory & Quasi-Judicial Bodies (ECI, CAG, UPSC, Finance Commission, NGT)', importance: 'Frequent PYQs' },
      ],
    },
    {
      paper: 'GS-3',
      title: 'Technology, Economic Development, Biodiversity, Environment, Security & Disaster Management',
      subtopics: [
        { id: 'gs3-1', name: 'Indian Economy & Issues Relating to Planning, Mobilization of Resources, Growth & Employment', importance: 'High Priority' },
        { id: 'gs3-2', name: 'Government Budgeting, Monetary Policy, Fiscal Deficits & Banking Sector Reforms', importance: 'Core Standard' },
        { id: 'gs3-3', name: 'Conservation, Environmental Pollution & Degradation, Environmental Impact Assessment (EIA)', importance: 'Frequent PYQs' },
      ],
    },
    {
      paper: 'GS-4',
      title: 'Ethics, Integrity & Aptitude',
      subtopics: [
        { id: 'gs4-1', name: 'Ethics & Human Interface: Essence, Determinants & Consequences of Ethics in Human Actions', importance: 'High Priority' },
        { id: 'gs4-2', name: 'Public / Civil Service Values & Ethics in Public Administration: Ethical Dilemmas & Accountability', importance: 'Core Standard' },
        { id: 'gs4-3', name: 'Case Studies on Moral & Governance Dilemmas in Administration', importance: 'Frequent PYQs' },
      ],
    },
  ];

  const resources: ResourceItem[] = [
    {
      id: 'res-1',
      title: 'Indian Polity (7th Edition) — Constitutional & Non-Constitutional Bodies Matrix',
      category: 'standard',
      gsPaper: 'GS-2',
      format: 'pdf',
      sizeBytes: 4_194_304,
      pages: 148,
      downloads: 1240,
      rating: 4.9,
      authorOrSource: 'M. Laxmikanth / CivilEdge Faculty Synthesis',
      summary:
        'Comprehensive comparative table of Articles 280 (FC), 324 (ECI), 148 (CAG), and 315 (UPSC) with appointment, removal, and landmark SC rulings.',
      topicsCovered: ['Article 280', 'Article 324', 'Article 148', 'Quasi-Judicial Bodies'],
      isUserUploaded: false,
      moderationStatus: 'approved',
    },
    {
      id: 'res-2',
      title: 'NCERT Class XI: Indian Economic Development (High-Yield Crux Notes)',
      category: 'ncert',
      gsPaper: 'GS-3',
      format: 'pdf',
      sizeBytes: 2_621_440,
      pages: 82,
      downloads: 980,
      rating: 4.8,
      authorOrSource: 'NCERT Official Curriculum',
      summary:
        'Foundational synthesis of post-1947 economic policy, 1991 LPG reforms, poverty alleviation metrics, and sustainable human capital indicators.',
      topicsCovered: ['1991 LPG Reforms', 'Five-Year Plans', 'Poverty & HDI', 'Agrarian Transformation'],
      isUserUploaded: false,
      moderationStatus: 'approved',
    },
  ];

  const broadcasts: BroadcastClass[] = [
    {
      id: 'broadcast-1',
      title: 'Masterclass: 16th Finance Commission, Article 280 & Fiscal Federalism',
      subject: 'GS-2',
      faculty: 'Prof. Raghavendra Menon',
      facultyDesignation: 'Former UPSC Faculty & Federalism Specialist',
      source: 'custom',
      streamUrl: 'https://studio.civiledge.in/live/fiscal-federalism-16th-fc',
      scheduledAt: at(0, '18:30'),
      durationMinutes: 90,
      status: 'live',
      description:
        'Interactive faculty seminar examining the Terms of Reference of the 16th Finance Commission, vertical vs horizontal devolution dilemmas, Article 271 cesses, and high-scoring Mains frameworks.',
      topicsCovered: [
        'Article 280 Mandate & Terms of Reference',
        'Article 270 Divisible Pool vs Article 271 Cesses',
        '2011 Census vs Demographic Transition Equity',
        'Mains Answer Structuring & Punchhi Commission Anchors',
      ],
      viewersCount: 148,
    },
    {
      id: 'broadcast-2',
      title: 'GS-3 Economy: Central Bank Digital Currency (CBDC-W & CBDC-R)',
      subject: 'GS-3',
      faculty: 'Dr. Anurag Verma',
      facultyDesignation: 'Lead Editorial Analyst & Senior Economist',
      source: 'custom',
      streamUrl: 'https://studio.civiledge.in/live/cbdc-macroeconomics',
      scheduledAt: at(1, '11:00'),
      durationMinutes: 75,
      status: 'scheduled',
      description:
        'High-yield breakdown of wholesale vs retail e-Rupee, cross-border settlements with Project mBridge, and banking CASA implications.',
      topicsCovered: [
        'RBI Act 1934 Amendment Sec 2(aiv)',
        'Wholesale G-Sec Settlement vs Retail Anonymity',
        'Cross-Border Project mBridge Protocols',
      ],
      viewersCount: 0,
    },
  ];

  return {
    topic: topics[0],
    topics,
    quizQuestions,
    quizzes,
    mainsQuestion: mainsQuestions[0],
    mainsQuestions,
    syllabus,
    resources,
    broadcasts,
  };
}
