/* eslint-disable prefer-const */
import { BigInt, Address, Bytes } from '@graphprotocol/graph-ts'
import { GreenBitCoin, OpenBox, RevealBoxes, Transfer, GreenBTC as GreenBTCContract } from '../types/GreenBTC/GreenBTC'

import { GreenBTC, GreenBTCBlock } from '../types/schema'
import { ONE_BI, ZERO_BI, ADDRESS_ZERO } from './helpers'

const ADDRESS_GREENTBTC = '0xdf51f3dcd849f116948a5b23760b1ca0b5425bde'

// event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType)
export function handleGreenBitCoin(event: GreenBitCoin): void {

  let greenBTC = GreenBTC.load("GREEN_BTC")
  if (greenBTC === null) {
    greenBTC = new GreenBTC("GREEN_BTC")
    greenBTC.bought = ZERO_BI
    greenBTC.opened = ZERO_BI
    greenBTC.revealed = ZERO_BI
    greenBTC.won = ZERO_BI
    greenBTC.amountEnergy = ZERO_BI
    greenBTC.save()
  }

  greenBTC.bought = greenBTC.bought.plus(ONE_BI)
  greenBTC.amountEnergy = greenBTC.amountEnergy.plus(event.params.ARTCount)
  greenBTC.save()

  let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.height.toString().padStart(8,'0'))
  if (greenBTCBlock === null) {
  let greenBTCBlock = new GreenBTCBlock("GREENBTC_BLOCK_"+ event.params.height.toString().padStart(8,'0'))
    greenBTCBlock.heightBTC = event.params.height
    greenBTCBlock.amountEnergy = event.params.ARTCount
    greenBTCBlock.indexBuy = greenBTC.bought
    greenBTCBlock.buyTimestamp = event.block.timestamp
    greenBTCBlock.openTimestamp = ZERO_BI
    greenBTCBlock.buyTxHash = event.transaction.hash
    greenBTCBlock.opener = Bytes.fromHexString(ADDRESS_ZERO)
    greenBTCBlock.openBlockHeight = ZERO_BI
    greenBTCBlock.minter = event.params.minter
    greenBTCBlock.owner = event.params.minter
    greenBTCBlock.greenType = event.params.greenType
    greenBTCBlock.seed = ''
    greenBTCBlock.status = "Sold"                // sold
    greenBTCBlock.save()
  } else {                                        // For event OpenBox first
//  greenBTCBlock.heightBTC = event.params.height
    greenBTCBlock.amountEnergy = event.params.ARTCount
    greenBTCBlock.indexBuy = greenBTC.bought
//    greenBTCBlock.buyTimestamp = event.block.timestamp
//    greenBTCBlock.openTimestamp = ZERO_BI
//    greenBTCBlock.buyTxHash = event.transaction.hash
//    greenBTCBlock.opener = Bytes.fromHexString(ADDRESS_ZERO)
//    greenBTCBlock.openBlockHeight = ZERO_BI
    greenBTCBlock.minter = event.params.minter
    greenBTCBlock.owner = event.params.minter
    greenBTCBlock.greenType = event.params.greenType
//    greenBTCBlock.seed = ''
//    greenBTCBlock.status = "Sold"                // should be opened
    greenBTCBlock.save()
  }
}

// event OpenBox(address opener, uint256 tokenID, uint256 blockNumber)
export function handleOpenBox(event: OpenBox): void {

  let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.tokenID.toString().padStart(8,'0'))
  if (greenBTCBlock === null) {                 // For event OpenBox first
    let greenBTCBlock = new GreenBTCBlock("GREENBTC_BLOCK_"+ event.params.tokenID.toString().padStart(8,'0'))
    greenBTCBlock.heightBTC = event.params.tokenID
    greenBTCBlock.amountEnergy = ZERO_BI
    greenBTCBlock.indexBuy = ZERO_BI
    greenBTCBlock.buyTimestamp = event.block.timestamp
    greenBTCBlock.openTimestamp = event.block.timestamp
    greenBTCBlock.buyTxHash = event.transaction.hash
    greenBTCBlock.opener = event.params.opener
    greenBTCBlock.openBlockHeight = event.params.blockNumber
    greenBTCBlock.minter = Bytes.fromHexString(ADDRESS_ZERO)
    greenBTCBlock.owner = Bytes.fromHexString(ADDRESS_ZERO)
    greenBTCBlock.greenType = 0
    greenBTCBlock.seed = ''
    greenBTCBlock.status = "Opened"              // opened
    greenBTCBlock.save()
  } else {
    greenBTCBlock.opener = event.params.opener
    greenBTCBlock.openBlockHeight = event.params.blockNumber
    greenBTCBlock.openTimestamp = event.block.timestamp
    greenBTCBlock.status = "Opened"              // opened
    greenBTCBlock.save()
  }

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
    let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ revealList[index].toString().padStart(8,'0'))!

    let greenBTCContract = GreenBTCContract.bind(Address.fromString(ADDRESS_GREENTBTC))
    let dataNFT = greenBTCContract.dataNFT(revealList[index])

    greenBTCBlock.seed = dataNFT.value5.toHexString()                         // retrieve seed
    greenBTCBlock.status = wonList[index] ? "Lucky" : "Revealed"              
    greenBTCBlock.save() 

    if (wonList[index]) greenBTC.won = greenBTC.won.plus(ONE_BI)
  }

  greenBTC.revealed = greenBTC.revealed.plus(BigInt.fromI32(revealList.length))
  greenBTC.save()
}

// event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
export function handleTransfer(event: Transfer): void {

  if (event.params.from.toHexString() != ADDRESS_ZERO) {
    let greenBTCBlock = GreenBTCBlock.load("GREENBTC_BLOCK_"+ event.params.tokenId.toString().padStart(8,'0'))!
    greenBTCBlock.owner = event.params.to
    greenBTCBlock.save()
  }
}