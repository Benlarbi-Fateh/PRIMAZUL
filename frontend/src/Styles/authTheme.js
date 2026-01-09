// src/styles/authTheme.js

export const authTheme = {
  // Fond principal avec dégradé sombre élégant
  pageBg: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900",

  // Sidebar avec dégradé bleu premium
  sidebarBg: "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800",
  sidebarPattern:
    "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30",

  // Card principale
  cardBg:
    "bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-blue-900/20",
  cardBgHover: "hover:shadow-blue-500/10 hover:border-slate-600/50",

  // Textes
  textPrimary: "text-white",
  textSecondary: "text-slate-300",
  textMuted: "text-slate-400",
  textAccent: "text-cyan-400",

  // Inputs
  inputBg:
    "bg-slate-700/50 border-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20",
  inputText: "text-white placeholder-slate-400",

  // Boutons principaux
  buttonPrimary:
    "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-400 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30",
  buttonSecondary:
    "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500",
  buttonGhost:
    "bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-white",

  // États
  errorBg: "bg-red-500/10 border border-red-500/30",
  errorText: "text-red-400",
  successBg: "bg-emerald-500/10 border border-emerald-500/30",
  successText: "text-emerald-400",
  warningBg: "bg-amber-500/10 border border-amber-500/30",
  warningText: "text-amber-400",
  infoBg: "bg-cyan-500/10 border border-cyan-500/30",
  infoText: "text-cyan-400",

  // Feature cards dans la sidebar
  featureCard:
    "bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all",

  // Logo container
  logoBg: "bg-white/20 backdrop-blur-sm border border-white/30",

  // Mobile feature cards
  mobileFeature: "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50",

  // Links
  linkPrimary: "text-cyan-400 hover:text-cyan-300",
  linkSecondary: "text-slate-400 hover:text-white",

  // Dividers
  divider: "border-slate-700",

  // Code input
  codeInputBg: "bg-slate-700 border-slate-600 focus:border-cyan-500 text-white",
  codeInputActive:
    "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20",

  // Password strength
  strengthWeak: "bg-red-500",
  strengthFair: "bg-orange-500",
  strengthMedium: "bg-yellow-500",
  strengthStrong: "bg-emerald-500",
};

// Classes utilitaires combinées
export const authClasses = {
  page: `min-h-screen flex flex-col lg:flex-row ${authTheme.pageBg}`,

  sidebar: `hidden lg:flex lg:w-2/5 ${authTheme.sidebarBg} p-8 flex-col justify-between relative overflow-hidden`,
  sidebarOverlay: `absolute inset-0 ${authTheme.sidebarPattern}`,

  mainContent: `flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8`,

  card: `w-full max-w-sm sm:max-w-md ${authTheme.cardBg} rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 transition-all duration-300 ${authTheme.cardBgHover}`,

  title: `text-2xl sm:text-3xl font-bold ${authTheme.textPrimary} mb-2`,
  subtitle: `${authTheme.textSecondary} text-sm sm:text-base`,

  label: `block text-sm font-medium ${authTheme.textSecondary} mb-2`,

  input: `w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 ${authTheme.inputBg} ${authTheme.inputText} rounded-xl sm:rounded-2xl outline-none focus:ring-2 transition-all text-sm sm:text-base`,
  inputWithToggle: `w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 ${authTheme.inputBg} ${authTheme.inputText} rounded-xl sm:rounded-2xl outline-none focus:ring-2 transition-all text-sm sm:text-base`,

  buttonPrimary: `w-full ${authTheme.buttonPrimary} py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base`,
  buttonSecondary: `w-full ${authTheme.buttonSecondary} py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base`,

  error: `mb-4 sm:mb-6 p-3 sm:p-4 ${authTheme.errorBg} rounded-xl sm:rounded-2xl ${authTheme.errorText} text-sm flex items-center gap-3`,
  success: `mb-4 sm:mb-6 p-3 sm:p-4 ${authTheme.successBg} rounded-xl sm:rounded-2xl ${authTheme.successText} text-sm flex items-center gap-3`,

  featureCard: `flex items-center gap-4 p-4 ${authTheme.featureCard} rounded-2xl`,

  mobileHeader: `lg:hidden text-center mb-6 sm:mb-8`,
  mobileFeatures: `lg:hidden mt-6 grid grid-cols-3 gap-3 text-center`,
  mobileFeatureItem: `flex flex-col items-center ${authTheme.mobileFeature} p-2 sm:p-3 rounded-xl sm:rounded-2xl`,

  iconContainer: `w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center`,
  iconContainerSmall: `w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center`,

  link: `${authTheme.linkPrimary} font-medium transition-colors`,

  codeInput: `w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold ${authTheme.codeInputBg} rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50`,
};
