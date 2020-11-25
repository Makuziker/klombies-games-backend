import fs from 'fs';
import path from 'path';
import R from 'ramda';
import appRoot from 'app-root-path';

import { ICard, IPlayers, IRound, IWinner, IGroupType, IInvalidGroupMessage } from './types';

export { IFiveCrowns } from './types';

/**
 * A factory function.
 * Progress the game by using its returned methods.
 * @param playerList an array of user ids, the first user in the array is the first dealer
 */
export const fiveCrowns = (playerList: string[]) => {

  // GAME STATE INITIALIZATION AND LEXICAL VARIABLES

  const deckTemplate: ICard[] = JSON.parse(fs.readFileSync(path.join(appRoot.path, 'card-deck.json'), 'utf8'));
  let discardPile: ICard[] = [];
  let playingDeck = [...deckTemplate];
  let currentRound: IRound = 1;
  let dealerIdx = 0;
  let turnIdx = dealerIdx + 1;
  let playerIdWhoWentOut: string | null = null;
  let isGameInSession = true;
  let winnerId: IWinner = null;

  const players: IPlayers = {};
  for (const id of playerList) {
    players[id] = {
      score: 0,
      numGoneOut: 0,
      hand: [],
      groups: [],
    };
  }

  // PRIVATE METHODS

  const removeCardFromDeck = () => {
    const card = playingDeck.shift();
    if (!card) throw new Error('Playing deck is empty!');
    return card;
  }

  const removeCardFromDiscard = () => {
    const card = discardPile.shift();
    if (!card) throw new Error('Discard pile is empty!');
    return card;
  }

  const getPlayerIdByIdx = (index: number) => playerList[index];

  const getPlayerIdxById = (playerId: string) => playerList.findIndex(id => id === playerId);

  const isPlayerTurn = (id: string) => id === playerList[turnIdx];

  const playerMayDraw = (id: string) => players[id].hand.length === currentRound + 2;

  const playerMayDiscard = (id: string) => players[id].hand.length === currentRound + 3;

  const flattenCardGroups = (groups: ICard[][]) => R.flatten(groups);

  const playerHasCardsInGroups = (playerId: string, groups: ICard[][]) => {
    const flattenedCardGroups = flattenCardGroups(groups);
    return playerHasCards(playerId, flattenedCardGroups);
  }

  const addGroupsToPlayer = (playerId: string, groups: ICard[][]) => {
    players[playerId].groups = R.clone(groups);
  }

  const getCardIdxInHand = (playerId: string, card: ICard) => {
    return players[playerId].hand.findIndex(c => {
      return c.id === card.id
        && c.suit === card.suit
        && c.value === card.value;
    });
  }

  const playerHasCard = (playerId: string, card: ICard) => getCardIdxInHand(playerId, card) !== -1;

  const playerHasCards = (playerId: string, cards: ICard[]) => {
    for (const card of cards) {
      if (!playerHasCard(playerId, card)) return false;
    }
    return true;
  }

  const addCardToHand = (id: string, card: ICard) => players[id].hand.push(card);

  const removeCardFromHand = (playerId: string, cardIdx: number) => {
    const card = players[playerId].hand.splice(cardIdx, 1)[0];
    return card;
  }

  const clearHand = (id: string) => players[id].hand = [];

  const addCardToDiscard = (card: ICard) => discardPile.unshift(card);

  const getTopCardInDiscard = () => R.clone(discardPile[0]);

  const dealerHasTheirFullHand = () => players[playerList[dealerIdx]].hand.length === currentRound + 2;

  const isLastInPlayerList = (idx: number) => idx === playerList.length - 1;

  /**
   * Returns the next idx in playerList. Loops back to 0 if the index is the last in playerList.
   * @param index integer between 0 and playerList.length - 1
   */
  const getNextPlayerListIdx = (index: number) => isLastInPlayerList(index) ? 0 : index + 1;

  const getPreviousPlayerListIdx = (index: number) => index === 0 ? playerList.length - 1 : index - 1;

  const nextTurn = () => {
    turnIdx = getNextPlayerListIdx(turnIdx);
  }

  const getCurrentWildCard = () => {
    if (currentRound === 11) return 'K';
    if (currentRound === 10) return 'Q';
    if (currentRound === 9) return 'J';
    return currentRound + 2;
  }

  const isWild = (card: ICard) => card.value === getCurrentWildCard() || card.value === 'JOKER';

  const getCardPointValue = (card: ICard, includeDynamicWilds = true) => {
    if (includeDynamicWilds) {
      const wildCard = getCurrentWildCard();
      if (card.value === wildCard) return 20;
    }
    if (card.value === 'JOKER') return 50;
    if (card.value === 'K') return 13;
    if (card.value === 'Q') return 12;
    if (card.value === 'J') return 11;
    return card.value;
  }

  const getScoreForCards = (cards: ICard[]) => {
    return cards.reduce((points, card) => points + getCardPointValue(card), 0);
  }

  const addScoreToPlayer = (id: string, score: number) => {
    players[id].score += score;
  }

  const shuffleDeck = (deck: ICard[]) => {
    const shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
  }

  const restoreDeckFromDiscard = () => {
    // handle the edge case where playingDeck is depleted
    playingDeck = [...discardPile];
    const topCard = removeCardFromDeck();
    discardPile = [];
    addCardToDiscard(topCard);
    playingDeck = shuffleDeck(playingDeck);
    console.log('restored playing deck from discard pile');
  }

  const dealCards = () => {
    let cardRecipientIdx = getNextPlayerListIdx(dealerIdx);
    while (!dealerHasTheirFullHand()) {
      const nextCard = removeCardFromDeck();
      addCardToHand(getPlayerIdByIdx(cardRecipientIdx), nextCard);
      cardRecipientIdx = getNextPlayerListIdx(cardRecipientIdx);
    }
    const firstDiscard = removeCardFromDeck();
    addCardToDiscard(firstDiscard);
  }

  const getPublicPlayers = () => {
    const publicPlayers = R.clone(players);
    for (const id in publicPlayers) {
      publicPlayers[id].hand = [];
    }
    return publicPlayers;
  }

  const getWinningPlayer = () => {
    let winningId: string | null = null;
    let tiedIds: string[] = [];
    for (const id in players) {
      if (!winningId) {
        winningId = id;
        continue;
      }
      if (players[id].score < players[winningId].score) {
        winningId = id;
        tiedIds = [];
        continue;
      }
      if (players[id].score === players[winningId].score) {
        tiedIds.push(id);
        continue;
      }
    }
    if (tiedIds.length > 0 && winningId) {
      tiedIds.push(winningId);
      return tiedIds;
    }
    return winningId;
  }

  const startGame = () => {
    playingDeck = shuffleDeck(playingDeck);
    dealCards();
  }

  const nextRound = () => {
    if (currentRound === 11) return endGame();

    discardPile = [];
    for (const id in players) {
      players[id].hand = [];
      players[id].groups = [];
    }
    playerIdWhoWentOut = null;
    playingDeck = [...deckTemplate];
    dealerIdx = getNextPlayerListIdx(dealerIdx);
    turnIdx = getNextPlayerListIdx(dealerIdx);
    currentRound++;
    playingDeck = shuffleDeck(playingDeck);
    dealCards();
  }

  const endGame = () => {
    winnerId = getWinningPlayer();
    isGameInSession = false;
  }

  const getValidAscendingCardInRun = (card: ICard) => {
    switch (card.value) {
      case 10:
        return { value: 'J', suit: card.suit, id: 'placeholder' };
      case 'J':
        return { value: 'Q', suit: card.suit, id: 'placeholder' };
      case 'Q':
        return { value: 'K', suit: card.suit, id: 'placeholder' };
      case 'K':
        return null;
      case 'JOKER':
        return null;
      default:
        return { value: card.value + 1, suit: card.suit, id: 'placeholder' };
    }
  }

  const getValidDescendingCardInRun = (card: ICard) => {
    switch (card.value) {
      case 'K':
        return { value: 'Q', suit: card.suit, id: 'placeholder' };
      case 'Q':
        return { value: 'J', suit: card.suit, id: 'placeholder' };
      case 'J':
        return { value: 10, suit: card.suit, id: 'placeholder' };
      case 3:
        return null;
      case 'JOKER':
        return null;
      default:
        return { value: card.value - 1, suit: card.suit, id: 'placeholder' };
    }
  }

  const cardPairHasSameSuitRank = (card1: ICard, card2: ICard) => {
    return card1.suit === card2.suit && card1.value === card2.value;
  }

  const cardPairIsBook = (card1: ICard, card2: ICard) => {
    return card1.value === card2.value;
  }

  const cardPairIsAscendingRun = (card1: ICard, card2: ICard) => {
    return card1.suit === card2.suit
      && getCardPointValue(card1, false) < getCardPointValue(card2, false);
  }

  const cardPairIsDescendingRun = (card1: ICard, card2: ICard) => {
    return card1.suit === card2.suit
      && getCardPointValue(card1, false) > getCardPointValue(card2, false);
  }

  const determineGroupType = (card1: ICard, card2: ICard) => {
    if (cardPairIsBook(card1, card2)) return 'BOOK';
    if (cardPairIsAscendingRun(card1, card2)) return 'ASCENDING_RUN';
    if (cardPairIsDescendingRun(card1, card2)) return 'DESCENDING_RUN';
    return null;
  }

  /**
   * types of invalid groups:
   * - two cards not the same suit and not the same rank
   * - more than half the cards are wild
   * - after determining groupType, find a card that does not fit the groupType
   * @returns a string explaining why the group is invalid, or null if the group is valid.
   */
  const validateGroup = (group: ICard[]) => {
    const numOfWilds = group.reduce((acc, card) => isWild(card) ? acc + 1 : acc, 0);
    if (numOfWilds > Math.floor(group.length / 2)) return 'No more than half the cards can be wild.';

    const firstNonWildIdx = group.findIndex(card => !isWild(card));
    const secondNonWildIdx = group.findIndex((card, index) => !isWild(card) && index > firstNonWildIdx);
    if (firstNonWildIdx === -1 || secondNonWildIdx === -1) return 'Group needs at least two non-wild cards.';

    const groupType: IGroupType = determineGroupType(group[firstNonWildIdx], group[secondNonWildIdx]);
    if (!groupType) return 'Group does not form a Book or a Run.';

    if (firstNonWildIdx > 0 && groupType !== 'BOOK') {
      // look backwards from the non-wild card
      // check that a wild is not substituting for a rank above K or below 3
      let validPrevCard: any = R.clone(group[firstNonWildIdx]); // todo type the validCard templates?
      let k = firstNonWildIdx;
      while (k > 0) {
        switch (groupType) {
          case 'DESCENDING_RUN':
            validPrevCard = getValidAscendingCardInRun(validPrevCard);
            if (validPrevCard === null) return 'A wildcard is substituting for a rank higher than K.';
            break;
          case 'ASCENDING_RUN':
            validPrevCard = getValidDescendingCardInRun(validPrevCard);
            if (validPrevCard === null) return 'A wildcard is substituting for a rank lower than 3';
            break;
        }
        k--;
      }
    }

    // finally, validate that every card after the first non-wild card obeys the groupType
    let validNextCard: any = R.clone(group[firstNonWildIdx]); // todo add type
    let i = firstNonWildIdx + 1;
    while (i < group.length) {
      switch (groupType) {
        case 'BOOK':
          if (isWild(group[i]) || cardPairIsBook(validNextCard, group[i])) break;
          return 'Book group type contains invalid card(s).';
        case 'ASCENDING_RUN':
          validNextCard = getValidAscendingCardInRun(validNextCard);
          if (!validNextCard) return 'Ascending Run group type contains invalid card(s).';
          if (isWild(group[i]) || cardPairHasSameSuitRank(group[i], validNextCard)) break;
          return 'Ascending Run group type contains invalid card(s).';
        case 'DESCENDING_RUN':
          validNextCard = getValidDescendingCardInRun(validNextCard);
          if (!validNextCard) return 'Descending Run group type contains invalid card(s).';
          if (isWild(group[i]) || cardPairHasSameSuitRank(group[i], validNextCard)) break;
          return 'Decending Run group type contains invalid card(s).';
      }
      i++;
    }

    return null;
  }

  /**
   * @returns null if all groups are valid, or an array of object(s) if there is at least one invalid group.
   */
  const validateGroups = (groups: ICard[][]) => {
    const invalidGroupMessages = groups.reduce<IInvalidGroupMessage[]>((acc, group) => {
      const error = validateGroup(group);
      if (error) return acc.concat({
        invalidGroup: group,
        errorMessage: error,
      });
      return acc;
    }, []);

    return invalidGroupMessages.length ? invalidGroupMessages : null;
  }

  const getRemainingCardsInHand = (id: string, groups: ICard[][], discard: ICard) => {
    const flattenedCardGroups = flattenCardGroups(groups);
    const groupsAndDiscard = flattenedCardGroups.concat([discard]);
    const remainingCards = R.difference(players[id].hand, groupsAndDiscard);
    return remainingCards.length ? remainingCards : null;
  }

  const getIdxOfPlayerWhoWentOut = (playerId: string | null) => playerList.findIndex(id => id === playerId);

  const getLastIdxToLayDownCards = () => {
    const idxOfPlayerWhoWentOut = getIdxOfPlayerWhoWentOut(playerIdWhoWentOut);
    return getPreviousPlayerListIdx(idxOfPlayerWhoWentOut);
  }

  const incNumGoneOut = (id: string) => {
    players[id].numGoneOut++;
  }

  // START GAME AND RETURN PUBLIC METHODS

  startGame();

  return {
    getPrivatePlayer: (id: string) => {
      const player = R.clone(players[id]);
      if (!player) return null;
      return player;
    },
    getPublicState: () => {
      const topCardInDiscard = getTopCardInDiscard();
      const publicPlayers = getPublicPlayers();
      return {
        isGameInSession,
        currentRound,
        dealerIdx,
        turnIdx,
        topCardInDiscard,
        playerList,
        players: publicPlayers,
        playerIdWhoWentOut,
        winnerId,
      };
    },
    getPublicStateAndPrivatePlayer: (id: string) => {
      const topCardInDiscard = getTopCardInDiscard();
      const filteredPlayers = getPublicPlayers();
      if (!filteredPlayers[id]) return null;
      filteredPlayers[id].hand = R.clone(players[id].hand);
      return {
        isGameInSession,
        currentRound,
        dealerIdx,
        turnIdx,
        topCardInDiscard,
        playerList,
        players: filteredPlayers,
        playerIdWhoWentOut,
        winnerId,
      };
    },
    drawFromDeck: (id: string) => {
      if (!isPlayerTurn(id)) return 'Not your turn';
      if (!playerMayDraw) return 'Player may not draw';
      const cardFromDeck = removeCardFromDeck();
      addCardToHand(id, cardFromDeck);
      if (playingDeck.length === 0) restoreDeckFromDiscard();
    },
    drawFromDiscard: (id: string) => {
      if (!isPlayerTurn(id)) return 'Not your turn';
      if (!playerMayDraw) return 'Player may not draw';
      const cardFromDiscard = removeCardFromDiscard();
      addCardToHand(id, cardFromDiscard);
    },
    discardFromHand: (id: string, card: ICard) => {
      if (!isPlayerTurn(id)) return 'Not your turn';
      if (playerIdWhoWentOut) return 'Another player has gone out. You must lay down all your cards';
      if (!playerMayDiscard(id)) return 'Player may not discard';
      const cardIdx = getCardIdxInHand(id, card);
      if (cardIdx === -1) return 'Player does not have that card to discard';
      const cardToDiscard = removeCardFromHand(id, cardIdx);
      addCardToDiscard(cardToDiscard);
      nextTurn();
    },
    goOut: (id: string, groups: ICard[][], discard: ICard) => {
      if (!isPlayerTurn(id)) return 'Not your turn';
      if (!playerMayDiscard(id)) return 'Player may not discard or go out';
      if (!playerHasCard(id, discard)) return 'Player does not have that card to discard';
      if (!playerHasCardsInGroups(id, groups)) return 'Player does not have those cards to group';
      if (getRemainingCardsInHand(id, groups, discard)) return 'Player cannot go out with cards leftover in their hand';
      const validationErrors = validateGroups(groups);
      if (validationErrors) return validationErrors;

      clearHand(id);
      addGroupsToPlayer(id, groups);
      playerIdWhoWentOut = id;
      incNumGoneOut(id);
      addCardToDiscard(discard);
      nextTurn();
    },
    layDownCards: (id: string, groups: ICard[][], discard: ICard) => {
      if (!isPlayerTurn(id)) return 'Not your turn';
      if (!playerMayDiscard(id)) return 'Player may not discard or go out';
      if (!playerHasCard(id, discard)) return 'Player does not have that card to discard';
      if (!playerHasCardsInGroups(id, groups)) return 'Player does not have those cards to group';
      const validationErrors = validateGroups(groups);
      if (validationErrors) return validationErrors;

      const remainingCards = getRemainingCardsInHand(id, groups, discard);
      if (remainingCards) {
        const points = getScoreForCards(remainingCards);
        addScoreToPlayer(id, points);
      }
      clearHand(id);
      addGroupsToPlayer(id, groups);
      addCardToDiscard(discard);

      if (R.equals(getLastIdxToLayDownCards(), getPlayerIdxById(id))) {
        nextRound();
      } else {
        nextTurn();
      }
    },
  }
}
