// Card comparison utilities
import { Card } from './cardValidation'
import { guessValidationCheck } from './cardValidation'
import { isStraight, isTwinStraight, runRange } from './cardRuns'

const ZERO = 0;
const ONE = 1;
const TWO = 2;
const THREE = 3;
const FOUR = 4;

const checkOneCard = (obj: Card[]): boolean => {
  if (obj.length === ONE) {
    return true;
  } else return false;
};

// 같은 두패인가 검사
const checkTwinsCard = (obj: Card[]): boolean => {
  if (obj.length !== TWO) return false
  const jokers = obj.filter((card) => card.number === ZERO).length
  // Ta + So together is the bomb, not a pair.
  if (jokers === TWO) return false
  // A lone joker takes the rank of the card beside it.
  if (jokers === ONE) return true
  // Two ordinary cards must be the same rank.
  return obj[0].number === obj[1].number
};


// 방인가 검사
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
    } else if (obj[0].number === ZERO && obj[1].number === ZERO) {
      return true;
    } else if (obj[0].number === ZERO && obj[2].number === ZERO) {
      return true;
    } else if (obj[1].number === ZERO && obj[2].number === ZERO) {
      return true;
    }
  }
  return false;
};

// 마대인가 검사
const checkQuadsCard = (obj: Card[]): boolean => {
  if (obj.length === FOUR) {
    //같은 4패 혹은 같은 3패와 따 혹은 소
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

    //같은 2패와 따소
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
};

// Straights and twin straights are any run of MIN_RUN ranks or more, so the
// shape checks live in cardRuns.ts.
const checkStraightCard = (obj: Card[]): boolean => isStraight(obj)

const checkTwinStraightCard = (obj: Card[]): boolean => isTwinStraight(obj)

// 따소-폭탄인가 검사
const checkBombCard = (obj: Card[]): boolean => {
  if (obj.length === TWO) {
    if (obj[0].number === ZERO && obj[1].number === ZERO) {
      return true;
    }
  }
  return false;
};

export const cardCompareUtil = (param_former_cards: Card[], param_later_cards: Card[]): boolean => {
  const guess_former_cards  = guessValidationCheck(param_former_cards);
  const guess_later_cards = guessValidationCheck(param_later_cards);
  let former_cards, later_cards;
  if(guess_former_cards.length > 0) {
    former_cards = [...guess_former_cards];
  } else {
    former_cards = [...param_former_cards];
  }
  console.log(former_cards);
  console.log(later_cards);
  if(guess_later_cards.length > 0) {
    later_cards = [...guess_later_cards]
  } else {
    later_cards = [...param_later_cards]  
  }
  // The shape checks no longer sort as a side effect, and several of the
  // comparisons below read cards by position, so order them here.
  const byRank = (a: Card, b: Card) =>
    a.number - b.number ? a.number - b.number : a.type - b.type;
  former_cards.sort(byRank);
  later_cards.sort(byRank);

  var result: boolean = false;
  var check_f: boolean;
  var check_l: boolean;
  // 전자가 한패인 경우
  check_f = checkOneCard(former_cards);
  if (check_f === true) {
    check_l = checkOneCard(later_cards);

    // 후자가 한패인 경우
    if (check_l === true) {
      // 전자가 13 (2)을 냈을때
      if (former_cards[0].number === 13) {
        result = false;
        return result;
      }
      // 후자가 2로 눌렀을떄
      if (later_cards[0].number === 13) {
        result = true;
        return result;
      }
      // +1 큰 한패를 내거나 2로 눌렀을떄
      if (
        later_cards[0].number - former_cards[0].number === 1 ||
        later_cards[0].number === 13
      ) {
        result = true;
        return result;
      }
    }

    // 방으로 눌렀을떄
    check_l = checkTripletsCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }

    // 마대로 눌렀을떄
    check_l = checkQuadsCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }

    // 폭탄으로 눌렀을떄
    check_l = checkBombCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }
    return result;
  } else if (checkTwinsCard(former_cards) === true) {
    // 전자가 같은 두패인 경우
    check_l = checkTwinsCard(later_cards);
    
    // 후자가 두패인 경우
    if (check_l === true) {
      let tmp: number | undefined;
      if(former_cards[0].number > former_cards[1].number){
        tmp = former_cards[0].number;
        former_cards[0].number = former_cards[1].number;
        former_cards[1].number = tmp;
      }
      if(later_cards[0].number > later_cards[1].number){
        tmp = later_cards[0].number;
        later_cards[0].number = later_cards[1].number;
        later_cards[1].number = tmp;
      }
      // 전자가 13 (2-2)을 냈을때
      if (former_cards[1].number === 13 || former_cards[0].number === 13) {
        result = false;
        return result;
      }

      // +1 큰 두패를 내거나 2로 눌렀을떄
      else if (
        later_cards[1].number - former_cards[1].number === 1 ||
        later_cards[1].number === 13
      ) {
        result = true;
        return result;
      }
    }

    // 방으로 눌렀을떄
    check_l = checkTripletsCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }

    // 마대로 눌렀을떄
    check_l = checkQuadsCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }

    // 폭탄으로 눌렀을떄
    check_l = checkBombCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }
    return result;
  } else if (checkTripletsCard(former_cards) === true) {
    // 전자가 같은 세패인 경우

    // 후자가 같은 세패인 경우
    check_l = checkTripletsCard(later_cards);

    if (check_l === true) {
      // 전자가 13 (2-2-2)을 냈을때
      if (former_cards[2].number === 13 || former_cards[1].number === 13 || former_cards[0].number === 13) {
        result = false;
        return result;
      }
      let fv, lv;
      for(let p = 0; p < 3; p ++){
        if(former_cards[p].number){
          fv = former_cards[p].number;
        }
        if(later_cards[p].number){
          lv = later_cards[p].number;
        }
      }
      //더 큰 세패로 눌렀을떄
      if (lv - fv >= 1) {
        result = true;
        return result;
      }
    }

    // 마대로 눌렀을떄
    check_l = checkQuadsCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }

    // 폭탄으로 눌렀을떄
    check_l = checkBombCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }
    return result;
  } else if (checkQuadsCard(former_cards) === true) {
    // 전자가 같은 네패인 경우

    // 후자도 같은 네패인 경우
    check_l = checkQuadsCard(later_cards);

    if (check_l === true) {
      // 전자가 13 (2-2-2-2)을 냈을때
      if (former_cards[3].number === 13) {
        result = false;
        return result;
      }

      //더 큰 네패로 눌렀을떄
      let fv, lv;
      for(let p = 0; p < 4; p ++){
        if(former_cards[p].number){
          fv = former_cards[p].number;
        }
        if(later_cards[p].number){
          lv = later_cards[p].number;
        }
      }
      
      if (lv - fv >= 1) {
        result = true;
        return result;
      }
    }

    // 폭탄으로 눌렀을떄
    check_l = checkBombCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }
    return result;
  } else if (checkBombCard(former_cards) === true) {
    // 전자가 폭탄인 경우
    result = false;
    return result;
  } else if (checkStraightCard(former_cards) === true) {
    /// --- 전자가 련속5패-닐리리인 경우 ---

    // 후자가 련속5패-닐리리인 경우
    check_l = checkStraightCard(later_cards);

    if (check_l === true) {
      // Beaten by a run of the same length sitting exactly one rank higher.
      const before = runRange(former_cards, 1);
      const after = runRange(later_cards, 1);
      if (before && after && after.runLength === before.runLength && after.lo === before.lo + 1) {
        result = true;
        return result;
      }
    } else if (checkTripletsCard(later_cards)) {
      result = true;
      return result;
    } else if (checkQuadsCard(later_cards)) {
      result = true;
      return result;
    }
    // 폭탄으로 눌렀을떄
    check_l = checkBombCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }
    return result;
  } else if (checkTwinStraightCard(former_cards) === true) {
    // 전자가 쌍련속5패-쌍닐리리인 경우

    // 후자가 쌍련속5패-쌍닐리리인 경우
    check_l = checkTwinStraightCard(later_cards);

    if (check_l === true) {
      // Beaten by a twin run of the same length one rank higher.
      const before = runRange(former_cards, 2);
      const after = runRange(later_cards, 2);
      if (before && after && after.runLength === before.runLength && after.lo === before.lo + 1) {
        result = true;
        return result;
      }
    }

    // 폭탄으로 눌렀을떄
    check_l = checkBombCard(later_cards);
    if (check_l === true) {
      result = true;
      return result;
    }
    return result;
  } else {
    result = false;
    return result;
  }
};
