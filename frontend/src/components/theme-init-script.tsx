export function ThemeInitScript() {
  const script = `(function(){try{var t=localStorage.getItem('optischedule-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
