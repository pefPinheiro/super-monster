# Ordem de Jogada — Lógica Card Heroes + Velocidade

Este documento explica exatamente como funciona a **ordem de turnos e prioridade de ação** no **Super Monster**, combinando a clareza posicional do **Card Heroes** com a estratégia de **Velocidade (VEL)**.

---

## 1. Quem Começa a Rodada? (Iniciativa por Velocidade Total)

No início de cada rodada (`Round 1`, `Round 2`, ...):
1. O jogo soma a **VEL efetiva** de todos os monstros vivos no campo de cada jogador (incluindo bônus de lugar como `+VEL`, `Ímpeto` e auras como `Uirapuru` / `Pantera`).
2. **Quem tiver a maior VEL Total ganha a Iniciativa** e faz a **1ª jogada da rodada**.
3. **Empate de VEL:**
   - No `Round 1`: sorteio justo (50% / 50%).
   - Do `Round 2` em diante: alterna automaticamente para quem **não** começou a rodada anterior.

---

## 2. Qual Monstro Age Primeiro? (Card Heroes + Velocidade)

Inspirado no **Card Heroes**, os monstros em campo seguem uma fila clara e previsível dentro de cada lado:

1. **Prioridade por Velocidade (VEL):** Entre os monstros prontos de um jogador, o monstro com **maior VEL efetiva** tem prioridade na fila.
2. **Desempate Posicional (Card Heroes):** Se dois monstros do mesmo lado tiverem a mesma VEL, vale a ordem do tabuleiro da **Esquerda para a Direita** (`Slot 1 → Slot 2 → Slot 3`).

> **Na prática:** Ao iniciar a sua vez, o sistema destaca na arena e na **Fila de Ordem** qual é o próximo monstro da sequência (`PRÓXIMO`), mas você mantém controle tático total caso queira agir com outro monstro pronto ou ativar uma habilidade extra primeiro.

---

## 3. Como Funciona a Alternância na Rodada?

O combate segue **alternância estrita 1-a-1** (estilo Card Heroes Tático):

```text
[1º Jogador com Iniciativa: age com 1 monstro]
        ↓
[2º Adversário: age com 1 monstro]
        ↓
[3º Jogador com Iniciativa: age com 1 monstro]
        ↓
[4º Adversário: age com 1 monstro]
        ↓
...até todos os monstros prontos agirem ou os jogadores passarem a vez.
```

### Regras Especiais de Ação:
- **Ataque Duplo (`double_attack` — Ex: Tengu, Cérbero):** Pode agir **2 vezes por rodada**. Após o 1º ataque, ele continua pronto para a sua próxima vez, mas a vez alterna normalmente para o adversário entre um golpe e outro.
- **Reforço no Meio do Jogo:**
  - Cartas normais entram em estado **`ESPERA`** e só agem na rodada seguinte.
  - Cartas com **Ímpeto (`rush_reinforce` — Ex: Curupira)** entram **`PRONTAS`** e já entram na fila da rodada atual!
- **Fim da Rodada:** Quando ambos agem com todas as cartas (ou passam a vez), ativam-se os modificadores de fim de rodada (`HEAL`, `ESCUDO`, `QUEIMA`), cada jogador recebe +1 reforço (até o máximo de **2 reforços extras** na partida) e a iniciativa da próxima rodada é recalculada.

---

## 4. Como Ler na Tela Durante a Batalha

1. **Placa de Velocidade (`hud_vel_banner.png`):** Mostra a VEL Total de cada lado (`VOCÊ × INIM.`) e indica quem inicia (`1º VOCÊ` ou `1º INIM.`).
2. **Barra de Fila da Rodada:** Logo abaixo do topo, exibe os próximos passos da rodada em tempo real (`1º VOCÊ (Pantera) → 2º INIM. (Curupira) → 3º VOCÊ (Fenrir)...`).
3. **Selo de Turno:** No topo esquerdo, mostra `★ SUA VEZ (X prontos)` ou `⚔ INIMIGO (Y prontos)`.
