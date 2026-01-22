import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Caixinha para Funcionários",
  description: "Sistema completo de gerenciamento de caixinha com contribuições via cotas, empréstimos e sorteios mensais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const movedElements = new WeakSet();
                
                function forceMoveButton() {
                  // PRIMEIRO: Procurar pelo elemento específico identificado: #devtools-indicator
                  const devToolsIndicator = document.getElementById('devtools-indicator');
                  if (devToolsIndicator) {
                    // Forçar movimento usando cssText para sobrescrever tudo
                    devToolsIndicator.style.cssText = 'position: fixed !important; left: auto !important; right: 1rem !important; bottom: 1rem !important; top: auto !important; z-index: 99999 !important; transform: none !important; margin: 0 !important;';
                    movedElements.add(devToolsIndicator);
                  }
                  
                  // SEGUNDO: Procurar por classe .nextjs-toast
                  const nextjsToasts = document.querySelectorAll('.nextjs-toast');
                  for (const toast of nextjsToasts) {
                    if (!movedElements.has(toast)) {
                      toast.style.cssText = 'position: fixed !important; left: auto !important; right: 1rem !important; bottom: 1rem !important; top: auto !important; z-index: 99999 !important; transform: none !important; margin: 0 !important;';
                      movedElements.add(toast);
                    }
                  }
                  
                  // TERCEIRO: Procurar por div#devtools-indicator.nextjs-toast (seletor combinado)
                  const combined = document.querySelectorAll('div#devtools-indicator.nextjs-toast');
                  for (const el of combined) {
                    if (!movedElements.has(el)) {
                      el.style.cssText = 'position: fixed !important; left: auto !important; right: 1rem !important; bottom: 1rem !important; top: auto !important; z-index: 99999 !important; transform: none !important; margin: 0 !important;';
                      movedElements.add(el);
                    }
                  }
                  
                  // TERCEIRO: Procurar elementos VISÍVEIS na parte inferior esquerda (botão real)
                  const allElements = document.querySelectorAll('*');
                  for (const el of allElements) {
                    if (movedElements.has(el)) continue;
                    
                    try {
                      const rect = el.getBoundingClientRect();
                      const styles = window.getComputedStyle(el);
                      
                      // Elementos visíveis na parte inferior esquerda (botões pequenos)
                      const isSmall = rect.width < 200 && rect.height < 200;
                      const isButton = el.tagName === 'BUTTON';
                      const hasButton = el.querySelector('button') !== null;
                      const hasImage = el.querySelector('img') !== null;
                      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
                      const isNextJsRelated = ariaLabel.includes('next') || ariaLabel.includes('dev') || ariaLabel.includes('open');
                      
                      if (rect.width > 0 && 
                          rect.height > 0 &&
                          rect.bottom > window.innerHeight - 100 &&
                          rect.left < 150 &&
                          styles.display !== 'none' &&
                          styles.visibility !== 'hidden' &&
                          styles.opacity !== '0' &&
                          isSmall &&
                          (isButton || hasButton || (hasImage && isNextJsRelated))) {
                        
                        el.style.setProperty('position', 'fixed', 'important');
                        el.style.setProperty('left', 'auto', 'important');
                        el.style.setProperty('right', '1rem', 'important');
                        el.style.setProperty('bottom', '1rem', 'important');
                        el.style.setProperty('top', 'auto', 'important');
                        el.style.setProperty('z-index', '99999', 'important');
                        el.style.setProperty('transform', 'none', 'important');
                        movedElements.add(el);
                      }
                    } catch(e) {
                      // Ignorar
                    }
                  }
                  
                  // SEGUNDO: Procurar especificamente pelo nextjs-portal
                  const portals = document.querySelectorAll('nextjs-portal');
                  for (const portal of portals) {
                    if (!movedElements.has(portal)) {
                      portal.style.setProperty('left', 'auto', 'important');
                      portal.style.setProperty('right', '1rem', 'important');
                      portal.style.setProperty('top', 'auto', 'important');
                      portal.style.setProperty('bottom', '1rem', 'important');
                      portal.style.setProperty('position', 'fixed', 'important');
                      movedElements.add(portal);
                    }
                  }
                  
                  // SEGUNDO: Procurar botões com aria-label relacionado ao Next.js
                  const buttons = document.querySelectorAll('button');
                  for (const btn of buttons) {
                    if (movedElements.has(btn)) continue;
                    
                    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                    if (ariaLabel.includes('next') || ariaLabel.includes('dev') || ariaLabel.includes('open') || ariaLabel.includes('issue')) {
                      const rect = btn.getBoundingClientRect();
                      if (rect.left < window.innerWidth / 2) {
                        // Mover o botão
                        btn.style.setProperty('position', 'fixed', 'important');
                        btn.style.setProperty('left', 'auto', 'important');
                        btn.style.setProperty('right', '1rem', 'important');
                        btn.style.setProperty('bottom', '1rem', 'important');
                        btn.style.setProperty('top', 'auto', 'important');
                        btn.style.setProperty('z-index', '99999', 'important');
                        btn.style.setProperty('transform', 'none', 'important');
                        movedElements.add(btn);
                        
                        // Mover TODOS os pais que estão na parte inferior esquerda
                        let parent = btn.parentElement;
                        let depth = 0;
                        while (parent && parent !== document.body && depth < 10) {
                          if (movedElements.has(parent)) {
                            parent = parent.parentElement;
                            depth++;
                            continue;
                          }
                          
                          const parentRect = parent.getBoundingClientRect();
                          const parentStyles = window.getComputedStyle(parent);
                          
                          // Se o pai está na parte inferior esquerda, movê-lo
                          if (parentRect.left < 200 && parentRect.bottom > window.innerHeight - 100) {
                            parent.style.setProperty('position', 'fixed', 'important');
                            parent.style.setProperty('left', 'auto', 'important');
                            parent.style.setProperty('right', '1rem', 'important');
                            parent.style.setProperty('bottom', '1rem', 'important');
                            parent.style.setProperty('top', 'auto', 'important');
                            parent.style.setProperty('z-index', '99998', 'important');
                            parent.style.setProperty('transform', 'none', 'important');
                            movedElements.add(parent);
                          }
                          
                          parent = parent.parentElement;
                          depth++;
                        }
                      }
                    }
                  }

                  // Mover alerta de issues (quando existir)
                  const issueButtons = document.querySelectorAll('button[aria-label*="issues"], button[aria-label*="Issue"]');
                  issueButtons.forEach((issueBtn) => {
                    if (movedElements.has(issueBtn)) return;
                    issueBtn.style.setProperty('position', 'fixed', 'important');
                    issueBtn.style.setProperty('left', 'auto', 'important');
                    issueBtn.style.setProperty('right', '1rem', 'important');
                    issueBtn.style.setProperty('bottom', '1rem', 'important');
                    issueBtn.style.setProperty('top', 'auto', 'important');
                    issueBtn.style.setProperty('z-index', '99999', 'important');
                    issueBtn.style.setProperty('transform', 'none', 'important');
                    movedElements.add(issueBtn);

                    const parent = issueBtn.parentElement;
                    if (parent && !movedElements.has(parent)) {
                      parent.style.setProperty('position', 'fixed', 'important');
                      parent.style.setProperty('left', 'auto', 'important');
                      parent.style.setProperty('right', '1rem', 'important');
                      parent.style.setProperty('bottom', '1rem', 'important');
                      parent.style.setProperty('top', 'auto', 'important');
                      parent.style.setProperty('z-index', '99998', 'important');
                      parent.style.setProperty('transform', 'none', 'important');
                      movedElements.add(parent);
                    }
                  });
                  
                  // TERCEIRO: Procurar todos os elementos visíveis na parte inferior esquerda
                  const allElements = document.querySelectorAll('*');
                  let moved = false;
                  
                  for (const el of allElements) {
                    if (movedElements.has(el)) continue;
                    
                    try {
                      const rect = el.getBoundingClientRect();
                      const styles = window.getComputedStyle(el);
                      
                      // Se está fixo e na parte inferior esquerda
                      if (styles.position === 'fixed' && 
                          rect.bottom > window.innerHeight - 120 &&
                          rect.left < 200 &&
                          rect.left >= 0 &&
                          rect.width > 0 &&
                          rect.height > 0) {
                        
                        // Verificar se tem aria-label relacionado ou é um botão pequeno (típico do Dev Tools)
                        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
                        const isSmallButton = rect.width < 100 && rect.height < 100;
                        
                        if (ariaLabel.includes('next') || ariaLabel.includes('dev') || ariaLabel.includes('open') || isSmallButton) {
                          el.style.setProperty('position', 'fixed', 'important');
                          el.style.setProperty('left', 'auto', 'important');
                          el.style.setProperty('right', '1rem', 'important');
                          el.style.setProperty('bottom', '1rem', 'important');
                          el.style.setProperty('top', 'auto', 'important');
                          el.style.setProperty('z-index', '99999', 'important');
                          el.style.setProperty('transform', 'none', 'important');
                          movedElements.add(el);
                          moved = true;
                        }
                      }
                    } catch(e) {
                      // Ignorar erros
                    }
                  }
                  
                  return moved;
                }
                
                // Executar imediatamente
                forceMoveButton();
                
                // Executar após o DOM carregar
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', forceMoveButton);
                } else {
                  forceMoveButton();
                }
                
                // Executar múltiplas vezes com requestAnimationFrame
                let attempts = 0;
                const maxAttempts = 20;
                
                function tryMove() {
                  attempts++;
                  forceMoveButton();
                  
                  if (attempts < maxAttempts) {
                    requestAnimationFrame(tryMove);
                  }
                }
                
                // Iniciar tentativas com requestAnimationFrame
                tryMove();
                
                // Também executar periodicamente - mais frequente
                setInterval(forceMoveButton, 50);
                
                // Executar continuamente com requestAnimationFrame
                function continuousMove() {
                  forceMoveButton();
                  requestAnimationFrame(continuousMove);
                }
                continuousMove();
                
                // Executar após delays específicos
                setTimeout(forceMoveButton, 100);
                setTimeout(forceMoveButton, 500);
                setTimeout(forceMoveButton, 1000);
                setTimeout(forceMoveButton, 2000);
                
                // Observar mudanças no DOM
                const observer = new MutationObserver(() => {
                  forceMoveButton();
                });
                observer.observe(document.body, { 
                  childList: true, 
                  subtree: true, 
                  attributes: true,
                  attributeFilter: ['style', 'aria-label', 'class']
                });
                
                // Observar mudanças no documentElement
                if (window.MutationObserver) {
                  const styleObserver = new MutationObserver(() => {
                    forceMoveButton();
                  });
                  styleObserver.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                  });
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var panelStyleId = 'caixa-devtools-panel-right';

                function injectPanelStyles(root) {
                  if (root.querySelector('#' + panelStyleId)) return;
                  var doc = root.host && root.host.ownerDocument ? root.host.ownerDocument : document;
                  var style = doc.createElement('style');
                  style.id = panelStyleId;
                  style.textContent = '#panel-route, .panel-route, #nextjs-dev-tools-menu, .dynamic-panel-container, .panel-content-container { left: auto !important; right: 0 !important; transform: none !important; transform-origin: right center !important; }';
                  root.appendChild(style);
                }

                function moveDevToolsToRight() {
                  var portal = document.querySelector('nextjs-portal');
                  if (!portal || !portal.shadowRoot) return;

                  var root = portal.shadowRoot;

                  injectPanelStyles(root);

                  var indicator = root.querySelector('#devtools-indicator');
                  var bottomOffset = '1rem';
                  if (indicator) {
                    var rect = indicator.getBoundingClientRect();
                    var gap = 8;
                    var calcBottom = Math.round(window.innerHeight - rect.top + gap);
                    bottomOffset = Math.max(16, calcBottom) + 'px';

                    indicator.style.setProperty('position', 'fixed', 'important');
                    indicator.style.setProperty('left', 'auto', 'important');
                    indicator.style.setProperty('right', '1rem', 'important');
                    indicator.style.setProperty('bottom', '1rem', 'important');
                    indicator.style.setProperty('top', 'auto', 'important');
                    indicator.style.setProperty('z-index', '99999', 'important');
                    indicator.style.setProperty('transform', 'none', 'important');
                  }

                  var panel = root.querySelector('#panel-route');
                  if (panel) {
                    panel.style.setProperty('position', 'fixed', 'important');
                    panel.style.setProperty('left', 'auto', 'important');
                    panel.style.setProperty('right', '0', 'important');
                    panel.style.setProperty('top', '0', 'important');
                    panel.style.setProperty('bottom', '0', 'important');
                    panel.style.setProperty('z-index', '99998', 'important');
                    panel.style.setProperty('transform', 'none', 'important');
                    panel.style.setProperty('transform-origin', 'right center', 'important');
                  }

                  var menu = root.querySelector('#nextjs-dev-tools-menu');
                  if (menu) {
                    menu.style.setProperty('position', 'fixed', 'important');
                    menu.style.setProperty('left', 'auto', 'important');
                    menu.style.setProperty('right', '1rem', 'important');
                    menu.style.setProperty('bottom', bottomOffset, 'important');
                    menu.style.setProperty('top', 'auto', 'important');
                    menu.style.setProperty('z-index', '2147483647', 'important');
                    menu.style.setProperty('transform', 'none', 'important');
                  }

                  var dynamicPanels = root.querySelectorAll('.dynamic-panel-container');
                  dynamicPanels.forEach(function(panelEl) {
                    panelEl.style.setProperty('position', 'fixed', 'important');
                    panelEl.style.setProperty('left', 'auto', 'important');
                    panelEl.style.setProperty('right', '1rem', 'important');
                    panelEl.style.setProperty('top', 'auto', 'important');
                    panelEl.style.setProperty('bottom', bottomOffset, 'important');
                    panelEl.style.setProperty('z-index', '2147483646', 'important');
                    panelEl.style.setProperty('transform', 'none', 'important');
                  });

                  var panelContents = root.querySelectorAll('.panel-content-container');
                  panelContents.forEach(function(contentEl) {
                    contentEl.style.setProperty('left', 'auto', 'important');
                    contentEl.style.setProperty('right', '0', 'important');
                    contentEl.style.setProperty('transform', 'none', 'important');
                  });

                  var issueButtons = root.querySelectorAll('button[aria-label*="issues"], button[aria-label*="Issue"]');
                  issueButtons.forEach(function(issueBtn) {
                    issueBtn.style.setProperty('position', 'fixed', 'important');
                    issueBtn.style.setProperty('left', 'auto', 'important');
                    issueBtn.style.setProperty('right', '1rem', 'important');
                    issueBtn.style.setProperty('bottom', '1rem', 'important');
                    issueBtn.style.setProperty('top', 'auto', 'important');
                    issueBtn.style.setProperty('z-index', '2147483647', 'important');
                    issueBtn.style.setProperty('transform', 'none', 'important');
                  });
                }

                moveDevToolsToRight();

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', moveDevToolsToRight);
                }

                var observer = new MutationObserver(moveDevToolsToRight);
                observer.observe(document.documentElement, { childList: true, subtree: true });

                setInterval(moveDevToolsToRight, 250);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
