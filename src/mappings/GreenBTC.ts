/* eslint-disable prefer-const */
import { BigInt, log, Address } from '@graphprotocol/graph-ts'
import { GreenBitCoin, OpenBox, RevealBoxes, GreenBTC as GreenBTCContract } from '../types/GreenBTC/GreenBTC'

import { GreenBTC, GreenBTCBlock } from '../types/schema'
import { ONE_BI, ZERO_BI } from './helpers'

const ADDRESS_GREENTBTC = '0xdf51f3dcd849f116948a5b23760b1ca0b5425bde'

// event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType)
export function handleGreenBitCoin(event: GreenBitCoin): void {

  let greenBTC = GreenBTC.load("GREEN_BTC")
  if (greenBTC === null) {
    greenBTC = new GreenBTC("GREEN_BTC")
    greenBTC.save()
  }

  greenBTC.indexLast = greenBTC.indexLast.plus(ONE_BI)
  greenBTC.bought = greenBTC.indexLast.plus(ONE_BI)
  greenBTC.amountEnergy = greenBTC.amountEnergy.plus(event.params.ARTCount)
  greenBTC.save()

  let greenBTCBlock = new GreenBTCBlock("GREENBTC_BLOCK_"+ event.params.height.toString().padStart(6,'0'))
  greenBTCBlock.indexBuy = greenBTC.indexLast
  greenBTCBlock.heightBTC = event.params.height
  greenBTCBlock.amountEnergy = event.params.ARTCount
  greenBTCBlock.greenType = event.params.greenType
  greenBTCBlock.owner = event.params.minter
  greenBTCBlock.openBlockHeight = ZERO_BI
  greenBTCBlock.seed = ZERO_BI
  greenBTCBlock.status = 1              // sold
  greenBTCBlock.save()
}

// event OpenBox(address openner, uint256 tokenID, uint256 blockNumber)
export function handleOpenBox(event: OpenBox): void {

  let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.tokenID.toString().padStart(6,'0'))!
  greenBTCBlock.openBlockHeight = event.params.blockNumber
  greenBTCBlock.status = 2              // opened
  greenBTCBlock.save()

  let greenBTC = GreenBTC.load("GREEN_BTC")!
  greenBTC.opened = greenBTC.opened.plus(ONE_BI)
  greenBTC.save()
}

// event RevealBoxes(uint256[] revealList, bool[] wonList)
export function handleRevealBoxes(event: RevealBoxes): void {

  let revealList = event.params.revealList
  let wonList = event.params.wonList

  let greenBTC = GreenBTC.load("GREEN_BTC")!

  for (let index = 0; index < revealList.length; index++) {
    let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ revealList[index].toString().padStart(6,'0'))!

    let greenBTCContract = GreenBTCContract.bind(Address.fromString(ADDRESS_GREENTBTC))
    let dataNFT = greenBTCContract.dataNFT(revealList[index])

    greenBTCBlock.seed = dataNFT.value5
    greenBTCBlock.status = wonList[index] ? 6 : 3             // 6: won
    greenBTCBlock.save() 

    if (wonList[index]) greenBTC.won = greenBTC.won.plus(ONE_BI)
  }

  greenBTC.revealed = greenBTC.revealed.plus(BigInt.fromI32(revealList.length))
  greenBTC.save()

}

