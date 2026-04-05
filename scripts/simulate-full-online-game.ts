/**
 * End-to-end online game simulation: one process, five logical players.
 * Writes to Realtime Database the same way the web app does (not multiple browsers).
 *
 * Run: npx tsx scripts/simulate-full-online-game.ts
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, update, remove, serverTimestamp } from 'firebase/database'
import type { GameState } from '../src/game/types'
import {
  initializeGame,
  resolveTeamVote,
  resolveQuest,
  checkGameEnd,
  getCurrentQuest,
  getLeader,
  getNextLeaderIndex,
  shouldUseLadyOfTheLake,
  resolveAssassination,
} from '../src/game/engine'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv(): void {
  const p = resolve(root, '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    process.env[k] = v
  }
}

function sanitize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
function randomCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function pushGame(
  db: ReturnType<typeof getDatabase>,
  code: string,
  gameState: GameState
): Promise<void> {
  await update(ref(db, `rooms/${code}`), {
    gameState: sanitize(gameState),
    status: gameState.phase === 'gameOver' ? 'finished' : 'playing',
    lastActivity: serverTimestamp(),
  })
}

function pickProposedTeam(game: GameState): string[] {
  const leader = getLeader(game)
  const quest = getCurrentQuest(game)
  const others = game.players.filter((p) => p.id !== leader.id)
  const need = quest.teamSize - 1
  return [leader.id, ...others.slice(0, need).map((p) => p.id)]
}

async function main(): Promise<void> {
  loadEnv()
  const apiKey = process.env.VITE_FIREBASE_API_KEY
  const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL
  if (!apiKey || !databaseURL) {
    throw new Error('Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_DATABASE_URL in .env')
  }

  initializeApp({
    apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  })
  const db = getDatabase()

  const code = randomCode()
  const names = ['SimHost', 'SimAlice', 'SimBob', 'SimCharlie', 'SimDiana']
  const playerIds: string[] = []

  console.log(`Room ${code} — simulating ${names.length} players\n`)

  for (let i = 0; i < names.length; i++) {
    const id = crypto.randomUUID().slice(0, 8)
    playerIds.push(id)
    if (i === 0) {
      await set(ref(db, `rooms/${code}`), {
        code,
        hostId: id,
        status: 'lobby',
        config: null,
        players: { [id]: { name: names[i], ready: true } },
        gameState: null,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      })
    } else {
      await update(ref(db, `rooms/${code}/players/${id}`), {
        name: names[i],
        ready: true,
      })
      await update(ref(db, `rooms/${code}`), { lastActivity: serverTimestamp() })
    }
    console.log(`  [player ${i + 1}] ${names[i]} joined (${id})`)
  }

  const players = playerIds.map((id, i) => ({ id, name: names[i] }))
  const config = {
    playerCount: 5,
    includePercivalMorgana: false,
    includeMordred: false,
    includeOberon: false,
    includeLadyOfTheLake: false,
  }

  let game = initializeGame(players, config, 'online')
  await pushGame(db, code, game)
  console.log('\n→ started: roleReveal')

  game = { ...game, phase: 'nightPhase' }
  await pushGame(db, code, game)
  console.log('→ nightPhase')

  game = { ...game, phase: 'teamProposal', votes: [], questCards: [] }
  await pushGame(db, code, game)
  console.log('→ teamProposal')

  let steps = 0
  const maxSteps = 500

  while (game.phase !== 'gameOver' && steps++ < maxSteps) {
    switch (game.phase) {
      case 'teamProposal': {
        const leader = getLeader(game)
        const team = pickProposedTeam(game)
        const quests = [...game.quests]
        quests[game.currentQuest] = {
          ...quests[game.currentQuest],
          leader: leader.id,
          proposedTeam: team,
        }
        game = { ...game, quests, phase: 'teamVote', votes: [] }
        await pushGame(db, code, game)
        console.log(
          `→ teamVote (leader ${leader.name}, team: ${team.map((id) => game.players.find((p) => p.id === id)!.name).join(', ')})`
        )
        break
      }
      case 'teamVote': {
        const votes = game.players.map((p) => ({
          playerId: p.id,
          vote: 'approve' as const,
        }))
        const approved = resolveTeamVote(votes)
        if (!approved) throw new Error('Sim only uses approvals')
        const quests = [...game.quests]
        quests[game.currentQuest] = { ...quests[game.currentQuest], votes }
        game = {
          ...game,
          votes,
          quests,
          consecutiveRejections: 0,
          phase: 'quest',
          questCards: [],
        }
        await pushGame(db, code, game)
        console.log('→ quest (all approved)')
        break
      }
      case 'quest': {
        const quest = getCurrentQuest(game)
        const cards = quest.proposedTeam.map((playerId) => ({
          playerId,
          action: 'success' as const,
        }))
        const result = resolveQuest(cards, quest.requiresDoubleFail)
        const quests = [...game.quests]
        quests[game.currentQuest] = {
          ...quests[game.currentQuest],
          cards,
          result,
        }
        const endCheck = checkGameEnd(quests)
        if (endCheck.ended && endCheck.winner === 'good') {
          game = { ...game, quests, questCards: cards, phase: 'assassination' }
          await pushGame(db, code, game)
          console.log(`→ assassination (quest ${game.currentQuest + 1} → ${result})`)
        } else if (endCheck.ended) {
          game = {
            ...game,
            quests,
            questCards: cards,
            winner: endCheck.winner,
            winReason: endCheck.reason,
            phase: 'gameOver',
          }
          await pushGame(db, code, game)
          console.log(`→ gameOver (${endCheck.winner}: ${endCheck.reason})`)
        } else {
          const nextGame: GameState = {
            ...game,
            quests,
            questCards: cards,
            currentQuest: game.currentQuest + 1,
            currentLeaderIndex: getNextLeaderIndex(
              game.currentLeaderIndex,
              game.players.length
            ),
          }
          const useLady = shouldUseLadyOfTheLake(nextGame)
          game = {
            ...nextGame,
            phase: useLady ? 'ladyOfTheLake' : 'questResult',
          }
          await pushGame(db, code, game)
          console.log(
            `→ ${game.phase} (quest ${game.currentQuest} resolved ${result}, successes=${quests.filter((q) => q.result === 'success').length})`
          )
        }
        break
      }
      case 'questResult': {
        game = { ...game, phase: 'teamProposal', votes: [], questCards: [] }
        await pushGame(db, code, game)
        console.log('→ teamProposal (after quest result)')
        break
      }
      case 'ladyOfTheLake': {
        // Not used when includeLadyOfTheLake is false; keep for safety
        game = { ...game, phase: 'questResult' }
        await pushGame(db, code, game)
        console.log('→ questResult (skipped lady)')
        break
      }
      case 'assassination': {
        const merlin = game.players.find((p) => p.role === 'merlin')
        const wrongTarget = game.players.find(
          (p) => p.alignment === 'good' && p.id !== merlin?.id
        )
        if (!wrongTarget) throw new Error('No wrong target for assassin')
        const { winner, reason } = resolveAssassination(
          wrongTarget.id,
          game.players
        )
        game = {
          ...game,
          assassinTarget: wrongTarget.id,
          winner,
          winReason: reason,
          phase: 'gameOver',
        }
        await pushGame(db, code, game)
        console.log(`→ gameOver (${winner}: ${reason})`)
        break
      }
      default:
        throw new Error(`Unhandled phase: ${game.phase}`)
    }
  }

  if (game.phase !== 'gameOver') {
    throw new Error('Stopped before gameOver (max steps)')
  }

  console.log('\n✓ Full game finished in Firebase.')
  await remove(ref(db, `rooms/${code}`))
  console.log(`✓ Cleaned up room ${code}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
