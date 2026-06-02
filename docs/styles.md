# 🎨 Guia de Estilos — Mini ERP de Treinamento (Stara)

Este documento define o sistema de design do Mini ERP de Treinamento, garantindo consistência visual, simplicidade e foco operacional.

O objetivo é manter uma interface **leve, padronizada e altamente reutilizável**, adequada para uso em ambiente de treinamento industrial.

---

# 🧭 Princípios de Design

- Simplicidade acima de tudo
- Alta legibilidade em ambiente operacional
- Poucos elementos visuais, porém consistentes
- Componentização CSS (sem duplicação de estilos)
- Hierarquia clara de informação
- Interface neutra com cores funcionais para status

---

# Logo Detalhado stara: https://cdn.brandfetch.io/idSuWMr7wH/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B
# Logo minimalista stara (fundo laranja) https://cdn.brandfetch.io/idSuWMr7wH/w/1080/h/1080/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B 
# 🎯 Identidade Visual (Stara)

O sistema utiliza como base as cores institucionais da Stara:

## 🟠 Cor Primária (Stara Orange)

> Aproximação fiel do laranja institucional:

```css
--color-primary: #F36F21;
🟢 Cor Accent (Stara Green)
--color-accent: #00A859;
🧱 Paleta Base do Sistema
🌫️ Backgrounds
--bg-primary: #F5F6F8;     /* cinza muito claro (fundo principal) */
--bg-surface: #FFFFFF;     /* cards e painéis */
--bg-muted: #EEF0F3;       /* blocos secundários */
--bg-hover: #E9EBEF;       /* hover de elementos */
🧩 Textos
--text-primary: #1F2328;   /* texto principal */
--text-secondary: #5B6470; /* textos auxiliares */
--text-muted: #8A94A6;     /* textos discretos */
🚦 Cores de Estado (Eventos e Status)
🟢 Success
--success: #1DB954;
--success-dark: #148A3D;
🔴 Error
--error: #E53935;
--error-dark: #B71C1C;
🟡 Warning
--warning: #F9A825;
--warning-dark: #F57F17;
🔵 Info (opcional)
--info: #1E88E5;
--info-dark: #1565C0;
```

🧱 Tipografia
Fonte principal

O sistema utiliza a fonte Geist via Google Fonts.

<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```css
Aplicação global
body {
  font-family: "Geist", sans-serif;
}
Hierarquia
--font-xs: 11px;
--font-sm: 13px;
--font-md: 14px;
--font-lg: 16px;
--font-xl: 20px;
🧱 Sistema de Componentes CSS
📦 Container
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}
🧩 Card (Surface base)
.card {
  background: var(--bg-surface);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  padding: 16px;
}
📊 Panel (estrutura de seção)
.panel {
  background: var(--bg-surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E6E8EC;
}
.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid #EEF0F3;
  font-weight: 500;
}
.panel-body {
  padding: 16px;
}
🔘 Botões
.btn {
  font-family: "Geist", sans-serif;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.15s;
}
Variantes
.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-accent {
  background: var(--color-accent);
  color: white;
}
.btn-danger {
  background: var(--error);
  color: white;
}
.btn-secondary {
  background: var(--bg-muted);
  color: var(--text-primary);
}
🏷️ Badges (status)
.badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 500;
}
Estados
.badge-success { background: #E6F7ED; color: var(--success-dark); }
.badge-error   { background: #FDE8E8; color: var(--error-dark); }
.badge-warning { background: #FFF4D6; color: var(--warning-dark); }
📋 Tabelas
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  text-align: left;
  background: var(--bg-muted);
  padding: 10px;
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-secondary);
}
td {
  padding: 10px;
  border-bottom: 1px solid #EEF0F3;
}
tr:hover {
  background: var(--bg-hover);
}
🧭 Inputs
input, select, textarea {
  font-family: "Geist", sans-serif;
  border: 1px solid #DADCE0;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
}
input:focus {
  border-color: var(--color-primary);
}
🧩 Layout
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 240px;
  background: var(--bg-surface);
}
.content {
  flex: 1;
  padding: 16px;
  background: var(--bg-primary);
}
```

⚡ Feedback Visual (Eventos)
Evento concluído
Badge verde
Ícone de check
leve highlight no card
Evento pausado
Badge amarelo
indicação visual de suspensão
Evento erro/invalidado
Badge vermelho
destaque leve no container
📌 Regras de Consistência
Nunca usar cores fora da paleta definida
Nunca criar botões sem classe .btn
Sempre usar .card ou .panel como base de superfície
Evitar inline styles
Priorizar reutilização de componentes CSS