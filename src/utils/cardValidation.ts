import { isStraight, isTwinStraight, resolveRun } from './cardRuns'

// Card validation utilities - simplified version for gameplay
// Based on the existing frontend implementation

export interface Card {
  type: number // 0: Spade, 1: Heart, 2: Crova, 3: Diamond, 4: SoWang, 5: TaWang
  number: number // 1-13 for regular cards, 0 for special cards (Ta, So)
}

export interface ValidationResult {
  status: number // 0: bad, 1: good, 2: bang, 3: madae, 4: taso
  msg: string
  guess_cards?: any []
}

const ZERO = 0
const ONE = 1
const TWO = 2
const THREE = 3
const FOUR = 4
const BAD_STATUS = 0;
const GOOD_STATUS = 1;
const BANG_STATUS = 2;
const MADAE_STATUS = 3;
const TASO_STATUS = 4;
const ERR_MSG = "주패형식이 정확하지 않습니다. 다시 선택하십시오.";
const REC_NEED_MSG = "아래의 주패묶음을 추천합니다.";
const NO_NEED_MSG = "주패묶음이 정확합니다. 가능한 방안은 한가지입니다.";
const BEST_MSG = "대소왕주패입니다. 제일 강한 묶음입니다.";

// Check if single card
const checkOneCard = (obj: Card[]): boolean => {
  return obj.length === ONE && obj[0].number !== 0
}

// Check if pair (twins)
const checkTwinsCard = (obj: Card[]): boolean => {
  if (obj.length !== TWO) return false
  const jokers = obj.filter((card) => card.number === ZERO).length
  // Ta + So together is the bomb, not a pair.
  if (jokers === TWO) return false
  // A lone joker takes the rank of the card beside it.
  if (jokers === ONE) return true
  // Two ordinary cards must be the same rank.
  return obj[0].number === obj[1].number
}

// Check if triplets (방)
const checkTripletsCard = (obj: Card[]): boolean => {
  if (obj.length === THREE) {
    if (obj[0].number === obj[1].number && obj[1].number === obj[2].number) {
      return true;
    } else if (obj[0].number === obj[1].number && obj[2].number === ZERO) {
      return true;
    } else if (obj[0].number === obj[2].number && obj[1].number === ZERO) {
      return true;
    } else if (obj[1].number === obj[2].number && obj[0].number === ZERO) {
      return true;
    } else if (
      obj[0].number === obj[1].number &&
      obj[1].number === ZERO &&
      obj[2].number !== ZERO
    ) {
      return true;
    } else if (
      obj[0].number === obj[2].number &&
      obj[2].number === ZERO &&
      obj[1].number !== ZERO
    ) {
      return true;
    } else if (
      obj[1].number === obj[2].number &&
      obj[2].number === ZERO &&
      obj[0].number !== ZERO
    ) {
      return true;
    }
  }
  return false;
}

// Check if quads (마대)
const checkQuadsCard = (obj: Card[]): boolean => {
  if (obj.length === FOUR) {
    if (
      obj[0].number === obj[1].number &&
      obj[1].number === obj[2].number &&
      obj[2].number === obj[3].number
    ) {
      return true;
    } else if (
      obj[0].number === obj[1].number &&
      obj[1].number === obj[2].number &&
      obj[3].number === ZERO
    ) {
      return true;
    } else if (
      obj[0].number === obj[1].number &&
      obj[1].number === obj[3].number &&
      obj[2].number === ZERO
    ) {
      return true;
    } else if (
      obj[0].number === obj[2].number &&
      obj[2].number === obj[3].number &&
      obj[1].number === ZERO
    ) {
      return true;
    } else if (
      obj[1].number === obj[2].number &&
      obj[2].number === obj[3].number &&
      obj[0].number === ZERO
    ) {
      return true;
    }

    if (
      obj[0].number === obj[1].number &&
      obj[2].number === 0 &&
      obj[3].number === 0
    ) {
      return true;
    } else if (
      obj[0].number === obj[2].number &&
      obj[1].number === 0 &&
      obj[3].number === 0
    ) {
      return true;
    } else if (
      obj[0].number === obj[3].number &&
      obj[1].number === 0 &&
      obj[2].number === 0
    ) {
      return true;
    } else if (
      obj[1].number === obj[2].number &&
      obj[0].number === 0 &&
      obj[3].number === 0
    ) {
      return true;
    } else if (
      obj[1].number === obj[3].number &&
      obj[0].number === 0 &&
      obj[2].number === 0
    ) {
      return true;
    } else if (
      obj[2].number === obj[3].number &&
      obj[1].number === 0 &&
      obj[0].number === 0
    ) {
      return true;
    }
  }
  return false;
}

// Straights and twin straights now accept any run of MIN_RUN ranks or more,
// so the length-specific checks live in cardRuns.ts.
const checkStraightCard = (obj: Card[]): boolean => isStraight(obj)

const checkTwinStraightCard = (obj: Card[]): boolean => isTwinStraight(obj)

const checkBombCard = (obj: Card[]): boolean => {
  if (obj.length === TWO) {
    if (obj[0].number === ZERO && obj[1].number === ZERO) {
      return true;
    }
  }
  return false;
};

export const guessValidationCheck = (obj: Card[]): any => {
  let result: any = {};
  let guess_cards: Card[][] = [];
  let check_val = false;

  const cards = obj;
  check_val = checkOneCard(cards);
  if (check_val === true) {
    result.status = GOOD_STATUS;
    result.msg = NO_NEED_MSG;
    result.guess_cards = [];
  } else if (checkTwinsCard(cards)) {
    result.status = GOOD_STATUS;
    result.msg = NO_NEED_MSG;
    result.guess_cards = [];
  } else if (checkTripletsCard(cards)) {
    result.status = BANG_STATUS;
    result.msg = NO_NEED_MSG;
    result.guess_cards = [];
  } else if (checkQuadsCard(cards)) {
    result.status = MADAE_STATUS;
    result.msg = NO_NEED_MSG;
    result.guess_cards = [];
  } else if (checkStraightCard(cards)) {
    result.status = GOOD_STATUS;
    // The comparison logic reads these in order, so keep the caller sorted.
    cards.sort((a, b) => (a.number - b.number ? a.number - b.number : a.type - b.type));
    const straightGuess = cards.some((card) => card.number === ZERO)
      ? resolveRun(cards, 1)
      : null;
    result.msg = straightGuess ? REC_NEED_MSG : NO_NEED_MSG;
    result.guess_cards = straightGuess ?? [];
  } else if (checkTwinStraightCard(cards)) {
    result.status = GOOD_STATUS;
    cards.sort((a, b) => (a.number - b.number ? a.number - b.number : a.type - b.type));
    const twinGuess = cards.some((card) => card.number === ZERO)
      ? resolveRun(cards, 2)
      : null;
    result.msg = twinGuess ? REC_NEED_MSG : NO_NEED_MSG;
    result.guess_cards = twinGuess ?? [];
  } else if (checkBombCard(cards)) {
    result.status = TASO_STATUS;
    result.msg = BEST_MSG;
    guess_cards.push([{ type: 4, number: 0 }, { type: 5, number: 0 }]);
    result.guess_cards = guess_cards[0];
  } else {
    result.status = BAD_STATUS;
    result.msg = ERR_MSG;
    result.guess_cards = guess_cards;
  }
  return result;
};
