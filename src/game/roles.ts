import type { RoleDefinition, RoleId } from './types'

export const ROLES: Record<RoleId, RoleDefinition> = {
  loyalServant: {
    id: 'loyalServant',
    name: 'Loyal Servant of Arthur',
    alignment: 'good',
    description: 'A loyal servant. You have no special information.',
    isOptional: false,
  },
  merlin: {
    id: 'merlin',
    name: 'Merlin',
    alignment: 'good',
    description: 'You know who the evil players are (except Mordred). If evil loses, the Assassin will try to identify you.',
    isOptional: false,
  },
  percival: {
    id: 'percival',
    name: 'Percival',
    alignment: 'good',
    description: 'You see Merlin and Morgana, but you don\'t know which is which.',
    isOptional: true,
    pairedWith: 'morgana',
  },
  minionOfMordred: {
    id: 'minionOfMordred',
    name: 'Minion of Mordred',
    alignment: 'evil',
    description: 'A servant of evil. You know who the other evil players are (except Oberon).',
    isOptional: false,
  },
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    alignment: 'evil',
    description: 'A servant of evil. If good completes 3 quests, you get one chance to identify and kill Merlin.',
    isOptional: false,
  },
  morgana: {
    id: 'morgana',
    name: 'Morgana',
    alignment: 'evil',
    description: 'You appear as Merlin to Percival. You know the other evil players (except Oberon).',
    isOptional: true,
    pairedWith: 'percival',
  },
  mordred: {
    id: 'mordred',
    name: 'Mordred',
    alignment: 'evil',
    description: 'You are hidden from Merlin. You know the other evil players (except Oberon).',
    isOptional: true,
  },
  oberon: {
    id: 'oberon',
    name: 'Oberon',
    alignment: 'evil',
    description: 'You don\'t know who the other evil players are, and they don\'t know you.',
    isOptional: true,
  },
}

export function getRoleName(roleId: RoleId): string {
  return ROLES[roleId].name
}

export function getRoleAlignment(roleId: RoleId): 'good' | 'evil' {
  return ROLES[roleId].alignment
}
