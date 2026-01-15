// Translations for Shogun Legends V3
// Supports English (en) and Japanese (ja)

// Import quiz questions for translation
import { MBTI_DEF, FACTOR_DEF, LIKERT } from './quiz.js';
import { CHARACTERS } from '../data/gameData.js';

// Helper to get translated quiz questions
const getQuizTranslations = () => {
  const en = {};
  const ja = {};
  
  // MBTI questions
  MBTI_DEF.forEach(([id, text]) => {
    en[`quiz_${id}`] = text;
    // Japanese translations for MBTI questions
    const jaTranslations = {
      "EI1": "新しい人と会った後、エネルギーが湧いてくる。",
      "EI2": "グループ作業よりも、一人で深く集中する作業を好む。",
      "EI3": "考えを明確にするために、アイデアを口に出して話す。",
      "EI4": "ほとんどの日、一人で静かな時間が必要で、それで充電できる。",
      "EI5": "会話を始める側になることを楽しむ。",
      "EI6": "大きな社交イベントはすぐに疲れる。",
      "EI7": "新しい環境で簡単に友達を作れる。",
      "EI8": "突然の電話よりも、テキストメッセージを好む。",
      "SN1": "直感よりも具体的な事実を信頼する。",
      "SN2": "大きな可能性について考えることが多い。",
      "SN3": "段階的な指示を好む。",
      "SN4": "詳細よりもパターンを探ることを楽しむ。",
      "SN5": "実験的な方法よりも実証済みの方法を好む。",
      "SN6": "現状よりも可能性に焦点を当てる。",
      "SN7": "他の人が見逃す実用的な詳細に気づく。",
      "SN8": "抽象的な理論に興奮する。",
      "TF1": "賛否を分析して決断する。",
      "TF2": "論理がそうでないと言っても、調和を優先する。",
      "TF3": "個人的な事情よりも公平さを重視する。",
      "TF4": "選択において人の感情を重く見る。",
      "TF5": "率直で客観的なフィードバックを与えることに抵抗がない。",
      "TF6": "反対意見があっても衝突を避ける。",
      "TF7": "選択肢を判断する際、雰囲気よりも基準を好む。",
      "TF8": "頭よりも心で決断する。",
      "JP1": "スケジュールやToDoリストを好む。",
      "JP2": "計画を柔軟で開放的に保つ。",
      "JP3": "決断が確定すると気分が良くなる。",
      "JP4": "より多くの情報を集めるために決断を遅らせることに抵抗がない。",
      "JP5": "自発性よりも明確な構造を好む。",
      "JP6": "計画をその場で適応させながら働くのが最も良い。",
      "JP7": "計画を立て、その計画を実行する。",
      "JP8": "できるだけ長く選択肢を開いたままにしておくことを好む。"
    };
    ja[`quiz_${id}`] = jaTranslations[id] || text;
  });
  
  // Factor questions
  FACTOR_DEF.forEach(([id, text]) => {
    en[`quiz_${id}`] = text;
    const jaTranslations = {
      "FQ1": "正確性と一貫性のために作業を再確認する。",
      "FQ2": "勢いを増していると思われる機会に素早く行動する。",
      "FQ3": "他の人が無視する過小評価されたアイデアを探す。",
      "FQ4": "短期的な結果よりも長期的なビジョンに焦点を当てる。",
      "FQ5": "着実な進歩を好み、不要なリスクを避ける。",
      "FQ6": "独立して大胆なイニシアチブを取ることを好む。",
      "FQ7": "安定した予測可能なサポートを提供することを楽しむ。",
      "FQ8": "他の人とつながり、協力するときに活躍する。",
      "FQ9": "速いペースで進化する環境で働くことを楽しむ。",
      "FQ10": "リスクに慎重で、下落保護について考える。",
      "FQ11": "時間の経過とともに複合効果について考える。",
      "FQ12": "信頼性と一貫性に誇りを持っている。",
      "FQ13": "異なるチームやアイデア間を流動的に移動する。"
    };
    ja[`quiz_${id}`] = jaTranslations[id] || text;
  });
  
  return { en, ja };
};

const quizTranslations = getQuizTranslations();

export const translations = {
  en: {
    // Title Screen
    title: "SHOGUN LEGENDS V3",
    subtitle: "Factor-Based Strategy Battle",
    newGame: "New Game",
    iKnowMyType: "I Know My Personality Type",
    savedProfile: "Saved Profile",
    personalityType: "Personality Type",
    teamFormation: "Team Formation",
    notSet: "Not Set",
    continueGame: "Continue Game",
    personalityOnly: "Personality Only",
    loadProfile: "Load Profile",
    pvpMode: "PvP Mode",
    enterEnemyHashcode: "Enter Enemy Team Hashcode",
    enterHashcodePlaceholder: "Enter Hashcode (e.g. ENTJ01234)",
    startPvPBattle: "Start PvP Battle",
    invalidHashcode: "Invalid team hashcode",
    unitsPlaced: "units placed",
    
    // Quiz
    quizTitle: "Personality Assessment",
    question: "Question",
    of: "of",
    back: "Back",
    stronglyDisagree: "Strongly Disagree",
    disagree: "Disagree",
    neutral: "Neutral",
    agree: "Agree",
    stronglyAgree: "Strongly Agree",
    
    // Quiz Result
    yourPersonality: "Your Personality Type",
    factorExposureScores: "Factor Exposure Scores",
    factorExposureDescription: "Your strategic exposure to each factor. The battlefield environment (Omyo) will reveal how these factors manifest when you deploy.",
    enterWarCouncil: "Enter War Council",
    saveProfile: "Save Profile",
    profile: "Profile",
    
    // Recruit - War Council Guide
    warCouncil: "WAR COUNCIL",
    units: "UNITS",
    formationGuide: "Formation Guide",
    activeUnit: "ACTIVE UNIT",
    formation: "FORMATION",
    selectHero: "Select hero to view tactical data",
    placeLeaderFirst: "Place Leader First!",
    save: "Save",
    deploy: "DEPLOY",
    teamHashcode: "Team Hashcode (for PvP):",
    ranks: "Ranks:",
    sRank: "S-Rank",
    sRankDesc: "Highest stats, strongest abilities",
    aRank: "A-Rank",
    aRankDesc: "Strong stats, good abilities",
    bRank: "B-Rank",
    bRankDesc: "Balanced stats, supportive abilities",
    placementStrategy: "Placement Strategy:",
    guardianPlacement: "Guardians should be placed in center columns (columns 1-3) to protect adjacent heroes",
    guardianEffect: "When a Guardian is Guarding, adjacent heroes take 40% less damage",
    warlordDesc: "Warlords excel at dealing damage and counter-attacking",
    duelistDesc: "Duelists are fast attackers, weak against Guardians/Tacticians",
    tacticianDesc: "Tacticians provide support, healing, and crowd control",
    formationTips: "Formation Tips:",
    leaderFirst: "Place your Leader first (required)",
    rotateShapes: "Rotate shapes by clicking on them to fit better",
    perfectWa: "Units with same MBTI type as leader get Perfect Wa bonus (+15 HP, +3 ATK/DEF)",
    fillAllSlots: "Fill all 5 slots before deploying to battle",
    guardians: "Guardians",
    guarding: "Guarding",
    warlords: "Warlords",
    duelists: "Duelists",
    tacticians: "Tacticians",
    leader: "Leader",
    perfectWaBonus: "Perfect Wa",
    
    // Omyo
    omyoRevelation: "OMYO REVELATION",
    omyoSubtitle: "陰陽の気が現れる",
    omyoStory1: "As your forces deploy to the battlefield, the Omyo — the natural balance of yin and yang — begins to manifest. The very elements respond to your strategic exposure, revealing how the forces of nature will favor or challenge your formation.",
    omyoStory2: "The winds shift, the earth trembles, and the spiritual energies align. Your heroes' connection to the fundamental forces of the world becomes clear as the environmental elements reveal their influence...",
    environmentalForcesManifest: "Environmental Forces Manifest",
    earthStability: "Earth's Stability",
    windSwiftness: "Wind's Swiftness",
    stoneEndurance: "Stone's Endurance",
    flameAmbition: "Flame's Ambition",
    waterCalm: "Water's Calm",
    thunderBoldness: "Thunder's Boldness",
    lightNurturing: "Light's Nurturing",
    mistFlow: "Mist's Flow",
    favorable: "Favorable",
    challenging: "Challenging",
    impactOnFormation: "Impact on Your Formation",
    statImpact: "stat impact",
    elementsNeutral: "The elements remain neutral to your current exposure.",
    enterBattlefield: "Enter Battlefield",
    omyoForcesImpacting: "OMYO FORCES IMPACTING BATTLEFIELD",
    omyoForcesSubtitle: "陰陽の気が戦場に影響する",
    factorReturnsExposures: "Factor Returns & Exposures",
    yourTeamExposure: "Your Team Exposure",
    enemyTeamExposure: "Enemy Team Exposure",
    factorReturn: "Factor Return",
    statImpactSummary: "Stat Impact Summary",
    omyoHedgeActive: "Enemy: Omyo Hedge Active",
    
    // Battle
    battleStart: "BATTLE START",
    challengeMode: "CHALLENGE MODE",
    hellMode: "HELL MODE",
    tapToBegin: "Tap to Begin",
    turn: "Turn",
    hp: "HP",
    mp: "MP",
    attack: "Attack",
    skill: "Skill",
    guard: "Guard",
    wait: "Wait",
    battleLog: "Battle Log",
    
    // Victory/Defeat
    victory: "VICTORY",
    defeat: "DEFEAT",
    backToTitle: "Back to Title",
    rematch: "Rematch",
    newSkirmish: "New Skirmish",
    challengeModeButton: "Challenge Mode",
    hellModeButton: "Hell Mode",
    
    // Errors
    noSavedProfile: "No saved profile found or saved data is incompatible with the current version.\n\nPlease start a new game.",
    errorLoadingProfile: "Error loading saved profile. The saved data may be incompatible with the current version.\n\nPlease start a new game.",
    failedToLoadProfile: "Failed to load saved profile. Please try starting a new game.",
    clearProfileConfirm: "Clear saved profile? This cannot be undone.",
    profileSaved: "Profile saved! Hashcode:",
    
    // Common
    language: "Language",
    english: "English",
    japanese: "Japanese",
    
    // War Council
    tapToRotate: "Tap to Rotate",
    tacticalAnalysis: "TACTICAL ANALYSIS",
    teamImpact: "TEAM IMPACT",
    
    // Battle Log Messages
    rematchStarted: "REMATCH STARTED!",
    rematchChallengeMode: "REMATCH: CHALLENGE MODE!",
    rematchHellMode: "REMATCH: HELL MODE!",
    challengeModeStart: "CHALLENGE MODE START!",
    defeatDemonLord: "Defeat the Demon Lord!",
    hellModeActivated: "🔥 HELL MODE ACTIVATED! 🔥",
    defeatTrump: "Defeat Donald Trump and his Droids!",
    isStunned: "is Stunned!",
    interceptsAttack: "intercepts the attack on Trump!",
    isDestroyed: "is destroyed!",
    leaderFallen: "💔 LEADER FALLEN!",
    armyDemoralized: "'s army demoralized!",
    attacksFor: "attacks",
    attacksForDmg: "for",
    damage: "!",
    counters: "⚔️",
    countersExclamation: "COUNTERS!",
    hypeAttacksAgain: "🔥 HYPE!",
    attacksAgain: "attacks again!",
    skillUsed: ":",
    hitFor: "Hit for",
    doubleSlash: "Double Slash!",
    burnsAllEnemies: "Burns all enemies!",
    dmgToAllEnemies: "40 DMG to all enemies, Trump heals 30 HP!",
    armyUp: "Army",
    up: "Up!",
    vitalityRestored: "Vitality restored!",
    teaCalms: "Tea calms the soul (HP/MP Up)!",
    stunned: "Stunned",
    
    // Hero Names and Skills (will be populated below)
    ...quizTranslations.en
  },
  
  ja: {
    // Title Screen
    title: "将軍レジェンド V3",
    subtitle: "ファクター戦略バトル",
    newGame: "新規ゲーム",
    iKnowMyType: "性格タイプを知っている",
    savedProfile: "保存されたプロフィール",
    personalityType: "性格タイプ",
    teamFormation: "チーム編成",
    notSet: "未設定",
    continueGame: "ゲームを続ける",
    personalityOnly: "性格のみ",
    loadProfile: "プロフィールを読み込む",
    pvpMode: "PvPモード",
    enterEnemyHashcode: "敵チームハッシュコードを入力",
    enterHashcodePlaceholder: "ハッシュコードを入力 (例: ENTJ01234)",
    startPvPBattle: "PvPバトル開始",
    invalidHashcode: "無効なチームハッシュコード",
    unitsPlaced: "ユニット配置済み",
    
    // Quiz
    quizTitle: "性格診断",
    question: "質問",
    of: "/",
    back: "戻る",
    stronglyDisagree: "全く同意しない",
    disagree: "同意しない",
    neutral: "どちらでもない",
    agree: "同意する",
    stronglyAgree: "強く同意する",
    
    // Quiz Result
    yourPersonality: "あなたの性格タイプ",
    factorExposureScores: "ファクターエクスポージャースコア",
    factorExposureDescription: "各ファクターへの戦略的エクスポージャー。戦場環境（陰陽）は、展開時にこれらのファクターがどのように現れるかを明らかにします。",
    enterWarCouncil: "軍議に入る",
    saveProfile: "プロフィールを保存",
    profile: "プロフィール",
    
    // Recruit - War Council Guide
    warCouncil: "軍議",
    units: "ユニット",
    formationGuide: "編成ガイド",
    activeUnit: "アクティブユニット",
    formation: "編成",
    selectHero: "ヒーローを選択して戦術データを表示",
    placeLeaderFirst: "まずリーダーを配置してください！",
    save: "保存",
    deploy: "出撃",
    teamHashcode: "チームハッシュコード (PvP用):",
    ranks: "ランク:",
    sRank: "Sランク",
    sRankDesc: "最高のステータス、最強の能力",
    aRank: "Aランク",
    aRankDesc: "強いステータス、良い能力",
    bRank: "Bランク",
    bRankDesc: "バランスの取れたステータス、支援能力",
    placementStrategy: "配置戦略:",
    guardianPlacement: "ガーディアンは中央列（1-3列目）に配置し、隣接するヒーローを守る",
    guardianEffect: "ガーディアンが防御している時、隣接するヒーローは40%ダメージ減少",
    warlordDesc: "ウォーロードはダメージ処理と反撃に優れる",
    duelistDesc: "デュエリストは高速攻撃者、ガーディアン/タクティシャンに弱い",
    tacticianDesc: "タクティシャンはサポート、回復、群衆制御を提供",
    formationTips: "編成のヒント:",
    leaderFirst: "まずリーダーを配置（必須）",
    rotateShapes: "形状をクリックして回転させ、より良く配置",
    perfectWa: "リーダーと同じMBTIタイプのユニットは完璧な和ボーナス（+15 HP、+3 ATK/DEF）を得る",
    fillAllSlots: "戦闘に展開する前に5つのスロットをすべて埋める",
    guardians: "ガーディアン",
    guarding: "防御中",
    warlords: "ウォーロード",
    duelists: "デュエリスト",
    tacticians: "タクティシャン",
    leader: "リーダー",
    perfectWaBonus: "完璧な和",
    
    // Omyo
    omyoRevelation: "陰陽開示",
    omyoSubtitle: "陰陽の気が現れる",
    omyoStory1: "あなたの軍が戦場に展開すると、陰陽—陰と陽の自然なバランス—が現れ始めます。要素自体があなたの戦略的エクスポージャーに反応し、自然の力があなたの編成をどのように支持または挑戦するかを明らかにします。",
    omyoStory2: "風が変わり、大地が震え、精神的なエネルギーが整列します。環境要素がその影響を明らかにするにつれて、ヒーローたちの世界の基本的な力へのつながりが明確になります...",
    environmentalForcesManifest: "環境力の現れ",
    earthStability: "大地の安定",
    windSwiftness: "風の迅速さ",
    stoneEndurance: "石の耐久性",
    flameAmbition: "炎の野心",
    waterCalm: "水の静けさ",
    thunderBoldness: "雷の大胆さ",
    lightNurturing: "光の育成",
    mistFlow: "霧の流れ",
    favorable: "有利",
    challenging: "挑戦的",
    impactOnFormation: "編成への影響",
    statImpact: "ステータス影響",
    elementsNeutral: "要素は現在のエクスポージャーに対して中立のままです。",
    enterBattlefield: "戦場に入る",
    omyoForcesImpacting: "陰陽の力が戦場に影響",
    omyoForcesSubtitle: "陰陽の気が戦場に影響する",
    factorReturnsExposures: "ファクターリターンとエクスポージャー",
    yourTeamExposure: "あなたのチームエクスポージャー",
    enemyTeamExposure: "敵チームエクスポージャー",
    factorReturn: "ファクターリターン",
    statImpactSummary: "ステータス影響サマリー",
    omyoHedgeActive: "敵: 陰陽ヘッジ有効",
    
    // Battle
    battleStart: "戦闘開始",
    challengeMode: "チャレンジモード",
    hellMode: "地獄モード",
    tapToBegin: "タップして開始",
    turn: "ターン",
    hp: "HP",
    mp: "MP",
    attack: "攻撃",
    skill: "スキル",
    guard: "防御",
    wait: "待機",
    battleLog: "戦闘ログ",
    
    // Victory/Defeat
    victory: "勝利",
    defeat: "敗北",
    backToTitle: "タイトルに戻る",
    rematch: "再戦",
    newSkirmish: "新規小競り合い",
    challengeModeButton: "チャレンジモード",
    hellModeButton: "地獄モード",
    
    // Errors
    noSavedProfile: "保存されたプロフィールが見つからないか、保存されたデータが現在のバージョンと互換性がありません。\n\n新しいゲームを開始してください。",
    errorLoadingProfile: "保存されたプロフィールの読み込みエラー。保存されたデータが現在のバージョンと互換性がない可能性があります。\n\n新しいゲームを開始してください。",
    failedToLoadProfile: "保存されたプロフィールの読み込みに失敗しました。新しいゲームを開始してください。",
    clearProfileConfirm: "保存されたプロフィールをクリアしますか？この操作は元に戻せません。",
    profileSaved: "プロフィールを保存しました！ハッシュコード:",
    
    // Common
    language: "言語",
    english: "英語",
    japanese: "日本語",
    
    // War Council
    tapToRotate: "タップして回転",
    tacticalAnalysis: "戦術分析",
    teamImpact: "チームへの影響",
    
    // Battle Log Messages
    rematchStarted: "再戦開始！",
    rematchChallengeMode: "再戦: チャレンジモード！",
    rematchHellMode: "再戦: 地獄モード！",
    challengeModeStart: "チャレンジモード開始！",
    defeatDemonLord: "魔王を倒せ！",
    hellModeActivated: "🔥 地獄モード発動！ 🔥",
    defeatTrump: "ドナルド・トランプとドロイドを倒せ！",
    isStunned: "は気絶した！",
    interceptsAttack: "がトランプへの攻撃を阻止した！",
    isDestroyed: "は破壊された！",
    leaderFallen: "💔 リーダー倒れる！",
    armyDemoralized: "の軍は士気が下がった！",
    attacksFor: "が",
    attacksForDmg: "に",
    damage: "のダメージを与えた！",
    counters: "⚔️",
    countersExclamation: "が反撃！",
    hypeAttacksAgain: "🔥 ハイプ！",
    attacksAgain: "が再攻撃！",
    skillUsed: "スキル使用:",
    hitFor: "命中、",
    doubleSlash: "二刀流！",
    burnsAllEnemies: "全敵に燃焼！",
    dmgToAllEnemies: "全敵に40ダメージ、トランプは30 HP回復！",
    armyUp: "軍",
    up: "アップ！",
    vitalityRestored: "生命力回復！",
    teaCalms: "茶が魂を落ち着かせる（HP/MPアップ）！",
    stunned: "気絶",
    
    // Hero Names and Skills (will be populated below)
    ...quizTranslations.ja
  }
};

// Add hero names and skills translations
Object.keys(CHARACTERS).forEach(mbti => {
  const char = CHARACTERS[mbti];
  translations.en[`hero_${mbti}_name`] = char.name;
  translations.en[`hero_${mbti}_title`] = char.title;
  translations.en[`hero_${mbti}_skill`] = char.skillName;
  translations.en[`hero_${mbti}_skillDesc`] = char.desc;
  
  // Japanese translations for hero names and skills
  const jaHeroNames = {
    "ENTJ": "織田信長", "ENFP": "豊臣秀吉", "ENTP": "伊達政宗", "ENFJ": "真田幸村",
    "ISFP": "宮本武蔵", "INFJ": "上杉謙信", "ESFP": "前田慶次", "ISTP": "服部半蔵",
    "INTJ": "徳川家康", "ESTJ": "源頼朝", "ESTP": "武田信玄",
    "ISTJ": "明智光秀", "INTP": "竹中半兵衛", "ISFJ": "石田三成", "ESFJ": "ねね", "INFP": "千利休",
    "TRUMP": "ドナルド・トランプ", "DROID": "ドロイド"
  };
  
  const jaHeroTitles = {
    "ENTJ": "魔王", "ENFP": "天下人", "ENTP": "独眼竜", "ENFJ": "真紅の悪魔",
    "ISFP": "剣聖", "INFJ": "軍神", "ESFP": "傾奇者", "ISTP": "影",
    "INTJ": "忍耐の人", "ESTJ": "初代将軍", "ESTP": "甲斐の虎",
    "ISTJ": "学者", "INTP": "天才軍師", "ISFJ": "忠義の行政官", "ESFJ": "高台院", "INFP": "茶聖",
    "TRUMP": "リーダー", "DROID": "保護者"
  };
  
  const jaSkillNames = {
    "ENTJ": "天下布武", "ENFP": "墨俣一夜城", "ENTP": "竜の咆哮", "ENFJ": "決死の突撃",
    "ISFP": "二天一流", "INFJ": "毘沙門天", "ESFP": "祭りビート", "ISTP": "暗殺",
    "INTJ": "大平和", "ESTJ": "鎌倉法", "ESTP": "風林火山",
    "ISTJ": "本能寺の炎", "INTP": "八門", "ISFJ": "補給線", "ESFJ": "母の愛", "INFP": "わびさび",
    "TRUMP": "アメリカを再び偉大に", "DROID": "ガードプロトコル"
  };
  
  const jaSkillDescs = {
    "ENTJ": "対象に1.8倍のダメージを与える。",
    "ENFP": "パーティー攻撃力+5（3ターン）。",
    "ENTP": "ダメージ+敵防御力低下。",
    "ENFJ": "失ったHPに基づくダメージ。",
    "ISFP": "2回攻撃（各70%ダメージ）。",
    "INFJ": "2.0倍の聖なるダメージ（防御無視）。",
    "ESFP": "パーティー速度+5。",
    "ISTP": "クリティカルダメージ、防御50%無視。",
    "INTJ": "自身の防御+15。",
    "ESTJ": "自身を40 HP回復+防御アップ。",
    "ESTP": "パーティー防御+5（3ターン）。",
    "ISTJ": "全敵に25の炎ダメージ。",
    "INTP": "対象を1ターンスタン。",
    "ISFJ": "パーティーを30 HP回復。",
    "ESFJ": "単一ターゲットを60 HP回復。",
    "INFP": "パーティーを25 HPと15 MP回復。",
    "TRUMP": "全敵に40ダメージ、自身を30 HP回復。",
    "DROID": "パッシブ: トランプへの攻撃を防御。"
  };
  
  translations.ja[`hero_${mbti}_name`] = jaHeroNames[mbti] || char.name;
  translations.ja[`hero_${mbti}_title`] = jaHeroTitles[mbti] || char.title;
  translations.ja[`hero_${mbti}_skill`] = jaSkillNames[mbti] || char.skillName;
  translations.ja[`hero_${mbti}_skillDesc`] = jaSkillDescs[mbti] || char.desc;
});

// Get translation for a key
export const t = (key, lang = 'en') => {
  return translations[lang]?.[key] || translations.en[key] || key;
};

// Get all translations for a language
export const getTranslations = (lang = 'en') => {
  return translations[lang] || translations.en;
};

// Get translated quiz question
export const getQuizQuestion = (questionId, lang = 'en') => {
  return t(`quiz_${questionId}`, lang);
};

// Get translated hero name
export const getHeroName = (mbti, lang = 'en') => {
  return t(`hero_${mbti}_name`, lang);
};

// Get translated hero title
export const getHeroTitle = (mbti, lang = 'en') => {
  return t(`hero_${mbti}_title`, lang);
};

// Get translated skill name
export const getSkillName = (mbti, lang = 'en') => {
  return t(`hero_${mbti}_skill`, lang);
};

// Get translated skill description
export const getSkillDesc = (mbti, lang = 'en') => {
  return t(`hero_${mbti}_skillDesc`, lang);
};
