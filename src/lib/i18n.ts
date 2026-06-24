import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Sidebar
      "app.title": "Study Garden",
      "app.tagline": "Small steps every day",
      "sidebar.menu": "Menu",
      "sidebar.home": "Home",
      "sidebar.notes": "Notes",
      "sidebar.tasks": "Task Tracker",
      "sidebar.search": "Search",

      // Profile section
      "profile.name": "Name",
      "profile.university": "University",
      "profile.semester": "Semester",
      "profile.degree": "Degree",
      "profile.major": "Major / Courses",
      "profile.email": "Email",
      "profile.hometown": "Hometown",
      "profile.location": "Current Location",
      "profile.private": "Private Account",
      "profile.save": "Save Changes",
      "profile.cancel": "Cancel",
      "profile.changePhoto": "Change Photo",
      "profile.removePhoto": "Remove",

      // Auth / Login
      "auth.login": "Login",
      "auth.signup": "Sign Up",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.name": "Name",
      "auth.loginButton": "Log In",
      "auth.signupButton": "Sign Up",
      "auth.noAccount": "Don't have an account?",
      "auth.haveAccount": "Already have an account?",
      "auth.welcome": "Welcome back",
      "auth.createAccount": "Create your account",
      "auth.subtitle": "Small steps every day.",
      "auth.error": "An error occurred. Please try again.",
      "auth.errorEmail": "Invalid email address.",
      "auth.errorPassword": "Password should be at least 6 characters.",
      "auth.errorUserNotFound": "No account found with this email.",
      "auth.errorWrongPassword": "Incorrect password. Please try again.",
      "auth.errorEmailInUse": "This email is already registered.",
      "auth.demoMode": "Demo mode — any email/password will work.",
      "auth.logout": "Log Out",

      // Language toggle
      "lang.toggle": "EN | JP",

      // Home page
      "home.greeting.morning": "Good morning",
      "home.greeting.afternoon": "Good afternoon",
      "home.greeting.evening": "Good evening",
      "home.quote": "Small steps every day.",
      "home.calendar.title": "June 2026",
      "home.calendar.today": "Today",
      "home.calendar.hasEvents": "Has events",
      "home.week.title": "This Week",
      "home.week.noEvents": "No events",
      "home.profile.university": "Stanford University",
      "home.profile.semester": "Spring 2026 · Semester 4",

      // Notes page
      "notes.title": "Notes",
      "notes.subtitle": "Your recent lecture notes & study materials",
      "notes.importPdf": "Import Lecture PDF",
      "notes.createAnki": "Create Anki Card",

      // Tasks page
      "tasks.title": "Tasks",
      "tasks.remaining": "remaining today",
      "tasks.today": "Today",
      "tasks.upcoming": "Upcoming",

      // Search page
      "search.title": "Search",
      "search.placeholder": "Search your study materials...",
      "search.subtitle": "Search across Notes, Tasks, and Schedule.",
      "search.recent": "Recent Searches",
      "search.categories": "Browse by Category",
      "search.noRecent": "No recent searches.",
      "search.cat.notes": "Notes",
      "search.cat.tasks": "Tasks",
      "search.cat.schedule": "Schedule",
      "search.cat.anki": "Anki Decks",
    },
  },
  jp: {
    translation: {
      // Sidebar
      "app.title": "Study Garden",
      "app.tagline": "毎日少しずつ",
      "sidebar.menu": "メニュー",
      "sidebar.home": "ホーム",
      "sidebar.notes": "ノート",
      "sidebar.tasks": "タスク",
      "sidebar.search": "検索",

      // Profile section
      "profile.name": "名前",
      "profile.university": "大学",
      "profile.semester": "学期",
      "profile.degree": "学位",
      "profile.major": "専攻 / 科目",
      "profile.email": "メール",
      "profile.hometown": "出身地",
      "profile.location": "現在地",
      "profile.private": "プライベートアカウント",
      "profile.save": "変更を保存",
      "profile.cancel": "キャンセル",
      "profile.changePhoto": "写真を変更",
      "profile.removePhoto": "削除",

      // Auth / Login
      "auth.login": "ログイン",
      "auth.signup": "新規登録",
      "auth.email": "メールアドレス",
      "auth.password": "パスワード",
      "auth.name": "名前",
      "auth.loginButton": "ログイン",
      "auth.signupButton": "登録",
      "auth.noAccount": "アカウントをお持ちでないですか？",
      "auth.haveAccount": "すでにアカウントをお持ちですか？",
      "auth.welcome": "おかえりなさい",
      "auth.createAccount": "アカウントを作成",
      "auth.subtitle": "毎日少しずつ。",
      "auth.error": "エラーが発生しました。もう一度お試しください。",
      "auth.errorEmail": "メールアドレスが無効です。",
      "auth.errorPassword": "パスワードは6文字以上で入力してください。",
      "auth.errorUserNotFound": "このメールアドレスのアカウントが見つかりません。",
      "auth.errorWrongPassword": "パスワードが正しくありません。もう一度お試しください。",
      "auth.errorEmailInUse": "このメールアドレスはすでに登録されています。",
      "auth.demoMode": "デモモード — どのメール/パスワードでもログインできます。",
      "auth.logout": "ログアウト",

      // Language toggle
      "lang.toggle": "EN | JP",

      // Home page
      "home.greeting.morning": "おはよう",
      "home.greeting.afternoon": "こんにちは",
      "home.greeting.evening": "こんばんは",
      "home.quote": "毎日少しずつ。",
      "home.calendar.title": "2026年6月",
      "home.calendar.today": "今日",
      "home.calendar.hasEvents": "予定あり",
      "home.week.title": "今週の予定",
      "home.week.noEvents": "予定なし",
      "home.profile.university": "スタンフォード大学",
      "home.profile.semester": "2026年春 · セメスター4",

      // Notes page
      "notes.title": "ノート",
      "notes.subtitle": "最近の講義ノートと学習資料",
      "notes.importPdf": "PDFをインポート",
      "notes.createAnki": "Ankiカード作成",

      // Tasks page
      "tasks.title": "タスク",
      "tasks.remaining": "件の残りタスク（今日）",
      "tasks.today": "今日",
      "tasks.upcoming": "今後の予定",

      // Search page
      "search.title": "検索",
      "search.placeholder": "学習資料を検索...",
      "search.subtitle": "ノート、タスク、スケジュール全体を検索。",
      "search.recent": "最近の検索",
      "search.categories": "カテゴリーで探す",
      "search.noRecent": "最近の検索はありません。",
      "search.cat.notes": "ノート",
      "search.cat.tasks": "タスク",
      "search.cat.schedule": "スケジュール",
      "search.cat.anki": "Ankiデッキ",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
