/**
 * Mapa oficial de caminhos dentro da pasta /Assets.
 * Assim que você salvar o PNG no caminho abaixo, o jogo carrega automaticamente!
 */
export const UI_ASSETS = {
  // Folha 1 — Tela Inicial & Menu
  menuBtnBattle: '/UI/btn_batalha.png',
  menuBtnCampaign: '/UI/btn_campanha.png',
  menuBtnShop: '/UI/btn_shop.png',
  menuBtnSettings: '/UI/btn_config.png',

  // Folha 2 — HUD Superior & Inferior de Batalha
  hudTopBar: '/UI/hud_top_bar.png',
  hudAxeHpBar: '/UI/hud_axe_hp_bar.png',
  hudSideBorder: '/UI/hud_side_border.png',
  hudBottomLeather: '/UI/hud_bottom_leather.png',
  hudMedallion: '/UI/hud_medallion.png',
  hudPassBtn: '/UI/hud_pass_btn.png',

  // Folha 3 — Cartas, Molduras, Cristais & Slots
  cardFrame: '/UI/card_frame.png',
  cardBack: '/UI/card_back.png',
  slotEmpty: '/UI/slot_empty.png',
  crystalFuria: '/UI/crystal_furia.png',
  crystalAstucia: '/UI/crystal_astucia.png',
  crystalArcano: '/UI/crystal_arcano.png',
  sealAtk: '/UI/seal_atk.png',
  sealHp: '/UI/seal_hp.png',
  sealVel: '/UI/seal_vel.png',

  // Folha 5 — Retratos dos Heróis
  heroAlly: '/Herois/hero_ally.jpg',
  heroEnemy: '/Herois/hero_enemy.png',
} as const;
