import type { Precedence } from '@super-monster/game-engine';

/**
 * Mapa oficial de caminhos dentro da pasta /Assets.
 */
export const UI_ASSETS = {
  // 1. Tela Principal (Menu Inicial — Carrossel de Emblemas Gigantes)
  referenciaTelaPrincipal: '/UI/referencia_tela_principal.png',
  logoBatalha: '/UI/logo_batalha.png',
  logoCampanha: '/UI/logo_campanha.png',
  logoDeck: '/UI/logo_deck.png',
  logoMercado: '/UI/logo_mercado.png',
  logoConfig: '/UI/logo_config.png',
  iconSeta: '/UI/icon_seta.png',

  // Botões horizontais/placas de apoio
  menuBtnBattle: '/UI/btn_batalha.png',
  menuBtnCampaign: '/UI/btn_campanha.png',
  menuBtnShop: '/UI/btn_shop.png',
  menuBtnSettings: '/UI/btn_config.png',

  // 2. HUD da Tela de Batalha & Diálogos
  hudAxeHpBar: '/UI/hud_axe_hp_bar.png',
  hudBtnAuto: '/UI/hud_btn_auto.png',
  hudBtnLog: '/UI/hud_btn_log.png',
  hudSideBorder: '/UI/hud_side_border.png',
  hudPortraitFrameAlly: '/UI/hud_portrait_frame_ally.png',
  hudPortraitFrameEnemy: '/UI/hud_portrait_frame_enemy.png',
  hudBottomLeather: '/UI/hud_bottom_leather.png',
  hudTopHeader: '/UI/hud_top_header.png',
  hudMedallion: '/UI/hud_medallion.png',
  hudPassBtn: '/UI/hud_pass_btn.png',
  hudVelBanner: '/UI/hud_vel_banner.png',
  hudTurnBanner: '/UI/hud_turn_banner.png',
  hudActionAttack: '/UI/shield_and_sword_icon.png',
  hudActionEffect: '/UI/icon_action_effect.png',
  dialogFrameMain: '/UI/dialog_frame_main.png',
  dialogFramePopup: '/UI/dialog_frame_popup.png',
  dialogHeaderPlate: '/UI/dialog_header_plate.png',
  dialogBtnConfirmDraft: '/UI/dialog_btn_confirm_draft.png',
  uiCaliceVenceu: '/UI/ui_calice_venceu.png',
  uiCalicePerdeu: '/UI/ui_calice_perdeu.png',
  uiCaliceEmpate: '/UI/ui_calice_empate.png',

  // 2b. Efeitos Visuais de Combate (VFX) & Slot de Modificador do Herói
  efectGarra: '/UI/efect_garra.png',
  efectVida: '/UI/efect_vida.png',
  efectDano: '/UI/efect_dano.png',
  vfxAttackProjectile: '/UI/vfx_attack_projectile.png',
  hudHeroModSlot: '/UI/hud_hero_mod_slot.png',

  // 3. Cartas, Slots, Cristais e Selos (Ataque, Vida, Velocidade)
  cardFrame: '/UI/card_frame.png',
  slotEmpty: '/UI/slot_empty.png',
  cardBack: '/UI/card_back.png',
  crystalFuria: '/UI/crystal_furia.png',
  crystalAstucia: '/UI/crystal_astucia.png',
  crystalArcano: '/UI/crystal_arcano.png',
  sealAtk: '/UI/seal_atk.png',
  sealHp: '/UI/seal_hp.png',
  sealVel: '/UI/seal_vel.png',

  // 5. Retratos dos Heróis
  heroAlly: '/Herois/hero_ally.jpg',
  heroEnemy: '/Herois/hero_enemy.png',

  // 6. Elementos Visuais do Mapa de Campanha
  campaignNodeUnlocked: '/Campanha/node_unlocked.png',
  campaignNodeCompleted: '/Campanha/node_completed.png',
  campaignNodeLocked: '/Campanha/node_locked.png',
  campaignNodeBoss: '/Campanha/node_boss.png',
} as const;

export const CRYSTAL_ASSETS: Record<Precedence, string> = {
  furia: UI_ASSETS.crystalFuria,
  astucia: UI_ASSETS.crystalAstucia,
  arcano: UI_ASSETS.crystalArcano,
};
