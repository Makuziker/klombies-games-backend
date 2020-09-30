import fs from 'fs'
import path from 'path'
import R, { add } from 'ramda'
import appRoot from 'app-root-path'

interface Card {
  id: string
  value: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'JOKER'
  suit: 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'STARS' | 'SPADES' | ''
}

interface Player {
  score: number
  numGoneOut: number
  hand: Card[]
  groups: Card[]
}

interface Players {
  [key: string]: Player
}

type Round = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export interface FiveCrownsInterface {
  getPublicState(): {
    currentRound: number
    dealerIdx: number
    turnIdx: number
    topCardInDiscard: Card
    playerList: string[]
    players: Players
  }
  getPublicStateAndPrivatePlayer(id: string): {
    currentRound: number
    dealerIdx: number
    turnIdx: number
    topCardInDiscard: Card
    playerList: string[]
    players: Players
  } | null
  getPrivatePlayer(id: string): Player | null
  drawFromDeck(id: string): void | string
  drawFromDiscard(id: string): void | string
  discardFromHand(id: string, card: Card): void | string
}

/**
 * A factory function.
 * Progress the game by using its returned methods.
 * @param playerList an array of user ids, the first user in the array is the first dealer
 */
export const fiveCrowns = (playerList: string[]) => {

  // GAME STATE INITIALIZATION AND LEXICAL VARIABLES

  const deckTemplate: Card[] = JSON
    .parse(fs.readFileSync(path.join(appRoot.path, 'five-crowns-deck.json'), 'utf8'))
  let discardPile: Card[] = []
  let playingDeck = [...deckTemplate]

  let currentRound: Round = 1
  let dealerIdx = 0
  let turnIdx = dealerIdx + 1

  const players: Players = {}
  for (const id of playerList) {
    players[id] = {
      score: 0,
      numGoneOut: 0,
      hand: [],
      groups: []
    }
  }

  // PRIVATE METHODS

  const removeCardFromDeck = () => {
    const card = playingDeck.shift()
    if (!card) throw new Error('Playing deck is empty!')
    return card
  }

  const removeCardFromDiscard = () => {
    const card = discardPile.shift()
    if (!card) throw new Error('Discard pile is empty!')
    return card
  }

  const getPlayerIdByIdx = (index: number) => playerList[index]

  const isPlayerTurn = (id: string) => id === playerList[turnIdx]

  const playerMayDraw = (id: string) => players[id].hand.length === currentRound + 2

  const playerMayDiscard = (id: string) => players[id].hand.length === currentRound + 3

  const playerHasCard = (playerId: string, card: Card) => players[playerId].hand.includes(card)

  const getCardIdxInHand = (playerId: string, card: Card) => players[playerId].hand.indexOf(card)

  const addCardToHand = (id: string, card: Card) => players[id].hand.push(card)

  const removeCardFromHand = (playerId: string, cardIdx: number) => {
    const card = players[playerId].hand.splice(cardIdx, 1)[0]
    return card
  }

  const addCardToDiscard = (card: Card) => discardPile.push(card)

  const getTopCardInDiscard = () => R.clone(discardPile[0])

  const dealerHasTheirFullHand = () => players[playerList[dealerIdx]].hand.length === currentRound + 2

  const isLastInPlayerList = (idx: number) => idx === playerList.length - 1

  /**
   * Returns the next idx in playerList. Loops back to 0 if the index is the last in playerList.
   * @param index integer between 0 and playerList.length - 1
   */
  const getNextPlayerListIdx = (index: number) => isLastInPlayerList(index) ? 0 : index + 1

  const nextTurn = () => { turnIdx = getNextPlayerListIdx(turnIdx) }

  const getCurrentWildCard = () => {
    if (currentRound === 11) return 'K'
    if (currentRound === 10) return 'Q'
    if (currentRound === 9) return 'J'
    return currentRound + 2
  }

  const getCardPointValue = (card: Card) => {
    const wildCard = getCurrentWildCard()
    if (card.value === 'JOKER') return 50
    if (card.value === wildCard) return 20
    if (card.value === 'K') return 13
    if (card.value === 'Q') return 12
    if (card.value === 'J') return 11
    return card.value
  }

  const addScores = () => {
    for (const id in players) {
      for (const card of players[id].hand) {
        const cardValue = getCardPointValue(card)
        players[id].score += cardValue
      }
    }
  }

  const shuffleDeck = (deck: Card[]) => {
    const shuffledDeck = [...deck]
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck
  }

  const restoreDeckFromDiscard = () => {
    // handle the edge case where playingDeck is depleted
    playingDeck = [...discardPile]
    const topCard = removeCardFromDeck()
    discardPile = []
    addCardToDiscard(topCard)
    playingDeck = shuffleDeck(playingDeck)
    console.log('restored playing deck from discard pile')
  }

  const dealCards = () => {
    let cardRecipientIdx = getNextPlayerListIdx(dealerIdx)
    while (!dealerHasTheirFullHand()) {
      const nextCard = removeCardFromDeck()
      addCardToHand(getPlayerIdByIdx(cardRecipientIdx), nextCard)
      cardRecipientIdx = getNextPlayerListIdx(cardRecipientIdx)
    }
    const firstDiscard = removeCardFromDeck()
    addCardToDiscard(firstDiscard)
  }

  const getPublicPlayers = () => {
    const publicPlayers = R.clone(players)
    for (const id in publicPlayers) {
      publicPlayers[id].hand = []
    }
    return publicPlayers
  }

  const declareWinner = () => {
    let winnerId: string | null = null
    let tiedIds: string[] = []
    for (const id in players) {
      if (!winnerId) {
        winnerId = id
        continue
      }
      if (players[id].score < players[winnerId].score) {
        winnerId = id
        tiedIds = []
        continue
      }
      if (players[id].score === players[winnerId].score) {
        tiedIds.push(id)
        continue
      }
    }
    if (tiedIds.length > 0 && winnerId) {
      tiedIds.push(winnerId)
      return tiedIds
    }
    return winnerId
  }

  const startGame = () => {
    playingDeck = shuffleDeck(playingDeck)
    dealCards()
  }

  const nextRound = () => {
    if (currentRound === 11) return endGame()

    discardPile = []
    for (const id in players) {
      players[id].hand = []
      players[id].groups = []
    }
    playingDeck = [...deckTemplate]
    dealerIdx = getNextPlayerListIdx(dealerIdx)
    currentRound++
    playingDeck = shuffleDeck(playingDeck)
    dealCards()
  }

  const endGame = () => {
    const winner = declareWinner()
    // TODO
  }

  // START GAME AND RETURN PUBLIC METHODS

  startGame()

  return {
    getPrivatePlayer: (id: string) => {
      const player = R.clone(players[id])
      if (!player) return null
      return player
    },
    getPublicState: () => {
      const topCardInDiscard = getTopCardInDiscard()
      const publicPlayers = getPublicPlayers()
      return {
        currentRound,
        dealerIdx,
        turnIdx,
        topCardInDiscard,
        playerList,
        players: publicPlayers
      }
    },
    getPublicStateAndPrivatePlayer: (id: string) => {
      const topCardInDiscard = getTopCardInDiscard()
      const filteredPlayers = getPublicPlayers()
      if (!filteredPlayers[id]) return null
      filteredPlayers[id].hand = R.clone(players[id].hand)
      return {
        currentRound,
        dealerIdx,
        turnIdx,
        topCardInDiscard,
        playerList,
        players: filteredPlayers
      }
    },
    drawFromDeck: (id: string) => {
      if (!isPlayerTurn(id)) return 'Not their turn'
      if (!playerMayDraw) return 'Player may not draw'
      const cardFromDeck = removeCardFromDeck()
      addCardToHand(id, cardFromDeck)
      if (playingDeck.length === 0) restoreDeckFromDiscard()
    },
    drawFromDiscard: (id: string) => {
      if (!isPlayerTurn(id)) return 'Not their turn'
      if (!playerMayDraw) return 'Player may not draw'
      const cardFromDiscard = removeCardFromDiscard()
      addCardToHand(id, cardFromDiscard)
    },
    discardFromHand: (id: string, card: Card) => {
      if (!isPlayerTurn(id)) return 'Not their turn'
      if (!playerMayDiscard(id)) return 'Player may not discard'
      const cardIdx = getCardIdxInHand(id, card)
      if (cardIdx === -1) return 'Player does not have that card'
      const cardToDiscard = removeCardFromHand(id, cardIdx)
      addCardToDiscard(cardToDiscard)
      nextTurn()
    }
  }
}
