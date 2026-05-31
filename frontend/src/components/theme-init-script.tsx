import Script from 'next/script';

const THEME_INIT = `(function(){try{var t=localStorage.getItem('optischedule-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export function ThemeInitScript() {
  return (
    <Script id="optischedule-theme-init" strategy="beforeInteractive">
      {THEME_INIT}
    </Script>
  );
}
