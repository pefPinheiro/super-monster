# Guia de Prompts Pendentes — Google Flow (Nano Banana 2.1)

Este guia contém **apenas os prompts das imagens que ainda NÃO existem** em `Assets/UI/`.  
Todos os selos (`seal_atk.png`, `seal_hp.png`, `seal_vel.png`), efeitos de impacto (`efect_garra.png`, `efect_vida.png`, `efect_dano.png`), diálogos, banners e ícones de ação já estão presentes no diretório e conectados ao jogo.

---

## Configuração Padrão no Flow
- **Aba:** `Imagem`
- **Modelo:** `Nano Banana 2.1`
- **Referência de estilo (opcional):** `Assets/referencia_estilo_master.png`
- **Recorte:** Fundo branco puro (`#FFFFFF`) sem sombra projetada para remoção em 1 clique antes de salvar como `.png` transparente em `Assets/UI/`.

---

## 1. Projétil Rúnico de Ataque / Efeito (substitui qualquer linha saindo em direção ao alvo)
- **Proporção no Flow:** `16:9`
- **Salvar como:** `Assets/UI/vfx_attack_projectile.png`

```text
A horizontal 2D game combat VFX sprite of a flying mystical Nordic runic energy spear pointing straight to the right. A sharp glowing molten-gold and blazing fiery-amber energy lance etched with luminous runes, trailing glowing sparks, embers, and swirling magical wind streaks behind it. Hand-painted stylized 2D mobile game VFX asset, crisp luminous silhouette, high contrast, centered horizontally pointing right, completely isolated on a pure solid flat white background (#FFFFFF), no drop shadow, no text, no letters, no characters.
```

---

## 2. Slot Circular de Modificador do Herói (canto superior direito do retrato do jogador)
- **Proporção no Flow:** `1:1`
- **Salvar como:** `Assets/UI/hud_hero_mod_slot.png`

```text
A compact circular 2D game HUD badge socket for a Hero passive modifier, in dark Nordic runic fantasy style. A miniature forged dark iron and weathered bronze medallion ring gripped by tiny silver claws, holding a glowing cyan-blue Nordic rune gem in the center. Hand-painted stylized 2D mobile game UI icon, bold silhouette, high contrast, centered front-facing orthographic view, completely isolated on a pure solid flat white background (#FFFFFF), no drop shadow, no text, no letters.
```
